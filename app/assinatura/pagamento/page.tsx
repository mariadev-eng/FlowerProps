"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { initMercadoPago, CardPayment } from "@mercadopago/sdk-react";
import { supabase } from "../../../lib/supabase";

initMercadoPago(process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY!, {
  locale: "pt-BR",
});

type SubscriptionData = {
  id: number;
  name: string;
  description: string;
  price: number;
  frequency: string;
  deliveries_per_month: number;
  image: string | null;
  delivery_day: "saturday" | "sunday";
};

type CustomerData = {
  name: string;
  phone: string;
  email: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

type DeliveryMethod = "delivery" | "pickup";

type CheckoutData = {
  subscription: SubscriptionData;
  customer: CustomerData;
  deliveryMethod: DeliveryMethod;
};

export default function AssinaturaPagamentoPage() {
  const router = useRouter();

  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingCard, setIsProcessingCard] = useState(false);
  const [error, setError] = useState("");

  const [pixData, setPixData] = useState<{
    qrCode: string;
    qrCodeBase64: string;
    paymentId: number;
    subscriptionOrderId: number;
  } | null>(null);

  // 🎯 Timer de 5 minutos (300 segundos)
  const [timeLeft, setTimeLeft] = useState(300);

  // ==========================================
  // CARREGA DADOS DO CHECKOUT
  // ==========================================

  useEffect(() => {
    const saved = localStorage.getItem("flower-subscription-customer");

    if (!saved) {
      router.push("/assinaturas");
      return;
    }

    try {
      setCheckoutData(JSON.parse(saved));
    } catch {
      router.push("/assinaturas");
    }

    setIsLoading(false);
  }, [router]);

  // ==========================================
  // TIMER DE 5 MINUTOS
  // ==========================================

  useEffect(() => {
    if (!pixData) return;
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [pixData, timeLeft]);

  // ==========================================
  // POLLING: DETECTA PAGAMENTO AUTOMATICAMENTE
  // ==========================================

  useEffect(() => {
    if (!pixData) return;
    if (timeLeft <= 0) return;

    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from("subscription_orders")
          .select("payment_status")
          .eq("id", pixData.subscriptionOrderId)
          .single();

        if (error) {
          console.error("Erro no polling:", error);
          return;
        }

        if (data?.payment_status === "paid") {
          console.log("✅ Pagamento detectado! Redirecionando...");

          clearInterval(interval);

          localStorage.setItem(
            "flower-subscription-order-id",
            String(pixData.subscriptionOrderId)
          );
          localStorage.removeItem("flower-subscription-customer");

          router.push("/assinatura/confirmada");
        }
      } catch (err) {
        console.error("Erro no polling:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [pixData, router, timeLeft]);

  // ==========================================
  // QUANDO EXPIRAR: CANCELA PEDIDO
  // ==========================================

  useEffect(() => {
    if (!pixData) return;
    if (timeLeft > 0) return;

    async function cancelOrder() {
      console.log("⏰ Pix expirado. Cancelando pedido...");

      await supabase
        .from("subscription_orders")
        .update({ payment_status: "cancelled" })
        .eq("id", pixData!.subscriptionOrderId);
    }

    cancelOrder();
  }, [timeLeft, pixData]);

  // ==========================================
  // SALVA PEDIDO NO SUPABASE (pending)
  // ==========================================

  async function saveSubscriptionOrder(paymentMethodType: string) {
    if (!checkoutData) {
      throw new Error("Dados do checkout não encontrados.");
    }

    const { subscription, customer, deliveryMethod } = checkoutData;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: order, error: orderError } = await supabase
      .from("subscription_orders")
      .insert({
        user_id: user?.id || null,
        plan_name: subscription.name,
        plan_frequency: subscription.frequency,
        plan_price: subscription.price,
        deliveries_per_month: subscription.deliveries_per_month,
        delivery_day: subscription.delivery_day,
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_email: customer.email,
        delivery_method: deliveryMethod,
        cep: deliveryMethod === "delivery" ? customer.cep : null,
        street: deliveryMethod === "delivery" ? customer.street : null,
        number: deliveryMethod === "delivery" ? customer.number : null,
        complement:
          deliveryMethod === "delivery" ? customer.complement : null,
        neighborhood:
          deliveryMethod === "delivery" ? customer.neighborhood : null,
        city: deliveryMethod === "delivery" ? customer.city : null,
        state: deliveryMethod === "delivery" ? customer.state : null,
        payment_method: paymentMethodType,
        payment_status: "pending",
      })
      .select()
      .single();

    if (orderError) {
      console.error("ERRO AO CRIAR PEDIDO:", orderError);
      throw new Error(orderError.message || "Erro ao criar pedido.");
    }

    return order.id;
  }

  // ==========================================
  // PAGAMENTO COM CARTÃO
  // ==========================================

  async function handleCardSubmit(formData: any) {
    setIsProcessingCard(true);
    setError("");

    if (!checkoutData) {
      setError("Dados do checkout não encontrados.");
      setIsProcessingCard(false);
      return;
    }

    try {
      const orderId = await saveSubscriptionOrder("card");
      const { customer, subscription } = checkoutData;

      const response = await fetch("/api/mercado-pago/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: formData.token,
          payment_method_id: formData.payment_method_id,
          installments: formData.installments,
          transaction_amount: subscription.price,
          payer: {
            email: customer.email,
            first_name: customer.name.split(" ")[0],
            last_name: customer.name.split(" ").slice(1).join(" "),
          },
          description: `Assinatura ${subscription.name} — FLOWER`,
          external_reference: `SUBSCRIPTION-${orderId}`,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao processar pagamento.");
      }

      if (result.status === "approved") {
        await supabase
          .from("subscription_orders")
          .update({
            payment_status: "paid",
            payment_id: String(result.id),
          })
          .eq("id", orderId);

        localStorage.setItem(
          "flower-subscription-order-id",
          String(orderId)
        );
        localStorage.removeItem("flower-subscription-checkout");
        localStorage.removeItem("flower-subscription-customer");

        router.push("/assinatura/confirmada");
      } else if (result.status === "in_process" || result.status === "pending") {
        await supabase
          .from("subscription_orders")
          .update({
            payment_status: "pending",
            payment_id: String(result.id),
          })
          .eq("id", orderId);

        setError(
          "Pagamento em análise. Você receberá confirmação em breve."
        );
        setIsProcessingCard(false);
      } else {
        await supabase
          .from("subscription_orders")
          .update({
            payment_status: "rejected",
            payment_id: String(result.id),
          })
          .eq("id", orderId);

        setError(
          "Pagamento não aprovado. Verifique os dados do cartão e tente novamente."
        );
        setIsProcessingCard(false);
      }
    } catch (err: any) {
      console.error("Erro no cartão:", err);
      setError(err?.message || "Erro ao processar pagamento.");
      setIsProcessingCard(false);
    }
  }

  // ==========================================
  // PAGAMENTO COM PIX
  // ==========================================

  async function handlePixPayment() {
    setIsProcessing(true);
    setError("");

    if (!checkoutData) {
      setError("Dados do checkout não encontrados.");
      setIsProcessing(false);
      return;
    }

    try {
      const orderId = await saveSubscriptionOrder("pix");
      const { customer, subscription } = checkoutData;

      const response = await fetch("/api/mercado-pago/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_method_id: "pix",
          transaction_amount: subscription.price,
          payer: {
            email: customer.email,
            first_name: customer.name.split(" ")[0],
            last_name: customer.name.split(" ").slice(1).join(" "),
          },
          description: `Assinatura ${subscription.name} — FLOWER`,
          external_reference: `SUBSCRIPTION-${orderId}`,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao gerar Pix.");
      }

      setPixData({
        qrCode: result.qr_code,
        qrCodeBase64: result.qr_code_base64,
        paymentId: result.id,
        subscriptionOrderId: orderId,
      });

      // 🎯 Reinicia o timer
      setTimeLeft(300);

      localStorage.setItem(
        "flower-subscription-order-id",
        String(orderId)
      );

      setIsProcessing(false);
    } catch (err: any) {
      console.error("Erro no Pix:", err);
      setError(err?.message || "Erro ao gerar Pix. Tente novamente.");
      setIsProcessing(false);
    }
  }

  function copyPixCode() {
    if (!pixData) return;
    navigator.clipboard.writeText(pixData.qrCode);
    alert("Código Pix copiado! Cole no seu app do banco.");
  }

  function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  // ==========================================
  // LOADING
  // ==========================================

  if (isLoading || !checkoutData) {
    return (
      <main className="payment-page">
        <div className="checkout-container">
          <p>Carregando...</p>
        </div>
      </main>
    );
  }

  const { subscription, deliveryMethod } = checkoutData;

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <main className="payment-page">
      <header className="payment-header">
        <div className="payment-header-inner">
          <Link href="/" className="payment-logo">
            FLOWER
            <span>PROPS</span>
          </Link>

          <div className="payment-header-title">
            Assinatura — Pagamento
          </div>

          <Link href="/assinatura/checkout" className="payment-back">
            ← Voltar
          </Link>
        </div>
      </header>

      <div className="payment-container">
        <section className="payment-main">
          <div className="payment-intro">
            <span className="payment-eyebrow">FINALIZAÇÃO</span>
            <h1>
              Como você quer
              <br />
              <em>pagar?</em>
            </h1>
            <p>Escolha a forma de pagamento para ativar sua assinatura.</p>
          </div>

          {error && (
            <div
              className="account-message error"
              style={{ marginBottom: 20 }}
            >
              {error}
            </div>
          )}

          {/* MÉTODOS */}
          {!pixData && (
            <section className="payment-card">
              <div className="payment-card-heading">
                <span>01</span>
                <div>
                  <h2>Forma de pagamento</h2>
                  <p>Escolha uma opção</p>
                </div>
              </div>

              <div className="payment-methods">
                <button
                  type="button"
                  className={`payment-method ${
                    paymentMethod === "pix" ? "selected" : ""
                  }`}
                  onClick={() => setPaymentMethod("pix")}
                >
                  <div className="payment-method-icon">PIX</div>
                  <div className="payment-method-content">
                    <strong>Pix</strong>
                    <span>Pagamento instantâneo</span>
                  </div>
                  <div className="payment-radio">
                    {paymentMethod === "pix" && "✓"}
                  </div>
                </button>

                <button
                  type="button"
                  className={`payment-method ${
                    paymentMethod === "card" ? "selected" : ""
                  }`}
                  onClick={() => setPaymentMethod("card")}
                >
                  <div className="payment-method-icon card-icon">CARD</div>
                  <div className="payment-method-content">
                    <strong>Cartão</strong>
                    <span>Crédito ou débito</span>
                  </div>
                  <div className="payment-radio">
                    {paymentMethod === "card" && "✓"}
                  </div>
                </button>
              </div>
            </section>
          )}

          {/* PIX — INSTRUÇÕES */}
          {paymentMethod === "pix" && !pixData && (
            <section className="payment-card payment-instructions">
              <div className="payment-card-heading">
                <span>02</span>
                <div>
                  <h2>Pagamento via Pix</h2>
                  <p>Você receberá o QR Code após confirmar.</p>
                </div>
              </div>

              <div className="pix-information">
                <div className="pix-symbol">PIX</div>
                <div>
                  <strong>Simples, rápido e seguro</strong>
                  <p>Após finalizar, o QR Code será gerado pra você.</p>
                </div>
              </div>
            </section>
          )}

          {/* PIX — QR CODE ATIVO */}
          {pixData && timeLeft > 0 && (
            <section className="payment-card payment-instructions">
              <div className="payment-card-heading">
                <span>02</span>
                <div>
                  <h2>Escaneie o QR Code</h2>
                  <p>Abra o app do seu banco e escaneie abaixo.</p>
                </div>
              </div>

              <div style={{ textAlign: "center", padding: "30px 0" }}>
                <img
                  src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                  alt="QR Code Pix"
                  style={{
                    maxWidth: 260,
                    margin: "0 auto 20px",
                    display: "block",
                  }}
                />

                {/* 🎯 TIMER */}
                <div
                  style={{
                    marginBottom: 20,
                    padding: "12px 24px",
                    background: "#f7f8f4",
                    borderRadius: 4,
                    display: "inline-block",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      marginBottom: 6,
                      color: "#68735a",
                      fontSize: 9,
                      fontWeight: 600,
                      letterSpacing: "0.15em",
                    }}
                  >
                    EXPIRA EM
                  </span>

                  <strong
                    style={{
                      display: "block",
                      color: timeLeft <= 60 ? "#a65f5f" : "#293b31",
                      fontFamily: "monospace",
                      fontSize: 26,
                      fontWeight: 600,
                      lineHeight: 1,
                    }}
                  >
                    {Math.floor(timeLeft / 60)}:
                    {String(timeLeft % 60).padStart(2, "0")}
                  </strong>
                </div>

                {/* 🎯 INDICADOR AGUARDANDO */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    marginBottom: 20,
                    color: "#68735a",
                    fontSize: 13,
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#68735a",
                      animation: "pulse 1.5s infinite",
                    }}
                  />
                  Aguardando pagamento...
                </div>

                <button
                  type="button"
                  className="button button-primary dark"
                  onClick={copyPixCode}
                  style={{ marginTop: 10 }}
                >
                  Copiar código Pix
                </button>

                <p
                  style={{
                    marginTop: 20,
                    fontSize: 12,
                    color: "#68735a",
                    lineHeight: 1.6,
                  }}
                >
                  Após o pagamento, sua assinatura será ativada
                  automaticamente.
                </p>
              </div>
            </section>
          )}

          {/* PIX — EXPIRADO */}
          {pixData && timeLeft === 0 && (
            <section className="payment-card payment-instructions">
              <div className="payment-card-heading">
                <span>02</span>
                <div>
                  <h2>Pix expirado</h2>
                  <p>O tempo para pagamento acabou.</p>
                </div>
              </div>

              <div style={{ textAlign: "center", padding: "30px 0" }}>
                <p
                  style={{
                    marginBottom: 24,
                    color: "#68735a",
                    fontSize: 14,
                    lineHeight: 1.7,
                  }}
                >
                  O QR Code expirou após 5 minutos. Nenhum valor foi
                  cobrado.
                  <br />
                  Você pode tentar novamente.
                </p>

                <button
                  type="button"
                  className="button button-primary dark"
                  onClick={() => {
                    setPixData(null);
                    setTimeLeft(300);
                  }}
                  style={{ marginRight: 8 }}
                >
                  Tentar novamente
                </button>

                <Link
                  href="/"
                  className="button button-outline dark"
                >
                  Voltar pra home
                </Link>
              </div>
            </section>
          )}

          {/* CARTÃO */}
          {paymentMethod === "card" && (
            <section className="payment-card payment-instructions">
              <div className="payment-card-heading">
                <span>02</span>
                <div>
                  <h2>Dados do cartão</h2>
                  <p>Preencha os dados com segurança.</p>
                </div>
              </div>

              {isProcessingCard ? (
                <div style={{ padding: "40px 0", textAlign: "center" }}>
                  <p>Processando pagamento... Aguarde.</p>
                </div>
              ) : (
                <CardPayment
                  initialization={{ amount: subscription.price }}
                  onSubmit={handleCardSubmit}
                  customization={{
                    visual: {
                      style: {
                        theme: "default",
                      },
                    },
                  }}
                />
              )}
            </section>
          )}

          {/* BOTÃO FINALIZAR (PIX) */}
          {paymentMethod === "pix" && !pixData && (
            <>
              <button
                type="button"
                className="finish-payment-button"
                onClick={handlePixPayment}
                disabled={isProcessing}
              >
                {isProcessing ? "Gerando Pix..." : "Finalizar pedido"}
                {!isProcessing && <span>→</span>}
              </button>

              <p className="payment-note">
                Ao finalizar, você confirma sua assinatura com a FLOWER.
              </p>
            </>
          )}
        </section>

        {/* RESUMO */}
        <aside className="payment-summary">
          <div className="payment-summary-heading">
            <span>RESUMO</span>
            <h2>Sua assinatura</h2>
          </div>

          <div className="payment-summary-products">
            <div className="payment-summary-product">
              <div className="payment-summary-image">
                {subscription.image && (
                  <img src={subscription.image} alt={subscription.name} />
                )}
                <span>1</span>
              </div>

              <div>
                <strong>Assinatura {subscription.name}</strong>
                <p>
                  {subscription.deliveries_per_month}{" "}
                  {subscription.deliveries_per_month === 1
                    ? "entrega"
                    : "entregas"}
                  /mês
                </p>
              </div>
            </div>
          </div>

          <div className="payment-values">
            <div>
              <span>Plano</span>
              <strong>{formatPrice(subscription.price)}</strong>
            </div>

            <div>
              <span>
                {deliveryMethod === "pickup"
                  ? "Retirada no ateliê"
                  : "Entrega"}
              </span>
              <strong>Grátis</strong>
            </div>

            <div>
              <span>Dia da entrega</span>
              <strong>
                {subscription.delivery_day === "saturday"
                  ? "Sábado"
                  : "Domingo"}
              </strong>
            </div>
          </div>

          <div className="payment-total">
            <span>Total</span>
            <strong>{formatPrice(subscription.price)}</strong>
          </div>

          <div className="payment-summary-receiving">
            <span>RECEBIMENTO</span>
            <strong>
              {deliveryMethod === "pickup"
                ? "Retirada no ateliê"
                : "Entrega em Macaé"}
            </strong>
          </div>
        </aside>
      </div>
    </main>
  );
}