"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { initMercadoPago, CardPayment } from "@mercadopago/sdk-react";
import { supabase } from "@/lib/supabase";

initMercadoPago(process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY!, {
  locale: "pt-BR",
});

type CartItem = {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  type?: string;
  delivery_day?: string;
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
  observation: string;
  deliveryMethod: "delivery" | "pickup";
};

const DELIVERY_FEE = 15;

export default function PaymentPage() {
  const router = useRouter();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");

  const [isFinishing, setIsFinishing] = useState(false);
  const [isProcessingCard, setIsProcessingCard] = useState(false);
  const [error, setError] = useState("");

  const [pixData, setPixData] = useState<{
    qrCode: string;
    qrCodeBase64: string;
    paymentId: number;
    orderId: number;
  } | null>(null);

  useEffect(() => {
    const savedCart = localStorage.getItem("flower-cart");
    const savedCheckout = localStorage.getItem("flower-checkout");

    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch {
        localStorage.removeItem("flower-cart");
      }
    }

    if (savedCheckout) {
      try {
        setCustomerData(JSON.parse(savedCheckout));
      } catch {
        localStorage.removeItem("flower-checkout");
      }
    }
  }, []);

  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const deliveryFee =
    customerData?.deliveryMethod === "delivery" ? DELIVERY_FEE : 0;

  const total = subtotal + deliveryFee;

  function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  // ==========================================
  // 🆕 CAPTURA O DEVICE ID DO MERCADO PAGO
  // ==========================================

  function getDeviceId(): string | null {
    if (typeof window === "undefined") return null;
    return (window as any).MP_DEVICE_SESSION_ID || null;
  }

  function goBack() {
    router.push("/revisao");
  }

  async function saveOrderToSupabase(paymentMethodType: string) {
    if (!customerData) {
      throw new Error("Dados do cliente não encontrados.");
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_name: customerData.name,
        customer_phone: customerData.phone,
        customer_email: customerData.email,
        delivery_method: customerData.deliveryMethod,
        delivery_day:
          cartItems.find((item: any) => item.delivery_day)?.delivery_day ||
          null,
        cep: customerData.cep,
        street: customerData.street,
        number: customerData.number,
        complement: customerData.complement,
        neighborhood: customerData.neighborhood,
        city: customerData.city,
        observation: customerData.observation,
        subtotal,
        delivery_fee: deliveryFee,
        total,
        payment_method: paymentMethodType,
        payment_status: "pending",
        order_status: "pending",
      })
      .select()
      .single();

    if (orderError) {
      console.error("ERRO AO CRIAR PEDIDO:", orderError);
      throw new Error(orderError.message || "Erro ao criar pedido.");
    }

    const orderItems = cartItems.map((item: any) => ({
      order_id: order.id,
      product_id: item.type === "subscription" ? null : item.id,
      product_name: item.name,
      product_price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity,
      item_type: item.type === "subscription" ? "subscription" : "product",
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("ERRO AO CRIAR ITENS:", itemsError);
      throw new Error("Erro ao salvar produtos do pedido.");
    }

    return order.id;
  }

  async function handleCardSubmit(formData: any) {
    setIsProcessingCard(true);
    setError("");

    if (!customerData) {
      setError("Dados do cliente não encontrados.");
      setIsProcessingCard(false);
      return;
    }

    try {
      const orderId = await saveOrderToSupabase("card");

      // 🆕 Captura o device id
      const deviceId = getDeviceId();

      const response = await fetch("/api/mercado-pago/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: formData.token,
          payment_method_id: formData.payment_method_id,
          installments: formData.installments,
          transaction_amount: total,
          device_id: deviceId, // 🆕 Envia o device id
          payer: {
            email: customerData.email,
            first_name: customerData.name.split(" ")[0],
            last_name: customerData.name.split(" ").slice(1).join(" "),
          },
          description: `Pedido FLOWER PROPS #${orderId}`,
          external_reference: `FLOWER-${orderId}`,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao processar pagamento.");
      }

      if (result.status === "approved") {
        await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            order_status: "confirmed",
            payment_id: String(result.id),
          })
          .eq("id", orderId);

        localStorage.setItem("flower-order-id", String(orderId));
        localStorage.removeItem("flower-cart");

        router.push("/pedido-confirmado");
      } else if (result.status === "in_process" || result.status === "pending") {
        await supabase
          .from("orders")
          .update({
            payment_status: "pending",
            payment_id: String(result.id),
          })
          .eq("id", orderId);

        setError(
          "Pagamento em análise. Você receberá uma confirmação em breve."
        );
        setIsProcessingCard(false);
      } else {
        await supabase
          .from("orders")
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

  async function handlePixPayment() {
    setIsFinishing(true);
    setError("");

    if (!customerData) {
      setError("Dados do cliente não encontrados.");
      setIsFinishing(false);
      return;
    }

    try {
      const orderId = await saveOrderToSupabase("pix");

      // 🆕 Captura o device id
      const deviceId = getDeviceId();

      const response = await fetch("/api/mercado-pago/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_method_id: "pix",
          transaction_amount: total,
          device_id: deviceId, // 🆕 Envia o device id
          payer: {
            email: customerData.email,
            first_name: customerData.name.split(" ")[0],
            last_name: customerData.name.split(" ").slice(1).join(" "),
          },
          description: `Pedido FLOWER PROPS #${orderId}`,
          external_reference: `FLOWER-${orderId}`,
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
        orderId,
      });

      localStorage.setItem("flower-order-id", String(orderId));

      setIsFinishing(false);
    } catch (err: any) {
      console.error("Erro no Pix:", err);
      setError(err?.message || "Erro ao gerar Pix. Tente novamente.");
      setIsFinishing(false);
    }
  }

  async function finishOrder() {
    if (cartItems.length === 0) {
      setError("Seu carrinho está vazio.");
      return;
    }

    if (!customerData) {
      setError("Dados do cliente não encontrados.");
      return;
    }

    if (paymentMethod === "pix") {
      await handlePixPayment();
    }
  }

  function copyPixCode() {
    if (!pixData) return;

    navigator.clipboard.writeText(pixData.qrCode);
    alert("Código Pix copiado! Cole no seu app do banco.");
  }

  // ==========================================
  // POLLING: DETECTA PAGAMENTO DO PIX AUTOMATICAMENTE
  // ==========================================

  useEffect(() => {
    if (!pixData) return;

    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("payment_status")
          .eq("id", pixData.orderId)
          .single();

        if (error) {
          console.error("Erro no polling:", error);
          return;
        }

        if (data?.payment_status === "paid") {
          console.log("✅ Pagamento detectado! Redirecionando...");

          clearInterval(interval);

          localStorage.setItem(
            "flower-order-id",
            String(pixData.orderId)
          );
          localStorage.removeItem("flower-cart");

          router.push("/pedido-confirmado");
        }
      } catch (err) {
        console.error("Erro no polling:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [pixData, router]);

  return (
    <main className="payment-page">
      {/* HEADER PADRONIZADO */}
      <header className="payment-header">
        <div className="payment-header-inner">
          <a href="/" className="payment-logo">
            FLOWER
            <span>PROPS</span>
          </a>

          <div className="payment-header-title">Pagamento</div>

          <button type="button" onClick={goBack} className="payment-back">
            ← Voltar à revisão
          </button>
        </div>
      </header>

      {/* ETAPAS */}
      <div className="payment-steps">
        <div className="payment-step completed">
          <span>✓</span>
          <p>Carrinho</p>
        </div>

        <div className="payment-line completed" />

        <div className="payment-step completed">
          <span>✓</span>
          <p>Dados</p>
        </div>

        <div className="payment-line completed" />

        <div className="payment-step completed">
          <span>✓</span>
          <p>Revisão</p>
        </div>

        <div className="payment-line active" />

        <div className="payment-step current">
          <span>4</span>
          <p>Pagamento</p>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="payment-container">
        <section className="payment-main">
          <div className="payment-intro">
            <span className="payment-eyebrow">FINALIZAÇÃO</span>

            <h1>
              Escolha como
              <br />
              <em>pagar.</em>
            </h1>

            <p>Selecione a forma de pagamento para concluir seu pedido.</p>
          </div>

          {error && (
            <div className="account-message error" style={{ marginBottom: 20 }}>
              {error}
            </div>
          )}

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

          {paymentMethod === "pix" && !pixData && (
            <section className="payment-card payment-instructions">
              <div className="payment-card-heading">
                <span>02</span>

                <div>
                  <h2>Pagamento via Pix</h2>
                  <p>Você receberá o QR Code após confirmar o pedido.</p>
                </div>
              </div>

              <div className="pix-information">
                <div className="pix-symbol">PIX</div>

                <div>
                  <strong>Simples, rápido e seguro</strong>
                  <p>
                    Após finalizar, o QR Code será gerado pra você escanear.
                  </p>
                </div>
              </div>
            </section>
          )}

          {pixData && (
            <section className="payment-card payment-instructions">
              <div className="payment-card-heading">
                <span>02</span>

                <div>
                  <h2>Escaneie o QR Code</h2>
                  <p>Abra o app do seu banco e escaneie o código abaixo.</p>
                </div>
              </div>

              <div
                className="pix-qrcode-container"
                style={{ textAlign: "center", padding: "30px 0" }}
              >
                <img
                  src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                  alt="QR Code Pix"
                  style={{
                    maxWidth: 260,
                    margin: "0 auto 20px",
                    display: "block",
                  }}
                />

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
                  Após o pagamento, seu pedido será confirmado automaticamente.
                </p>
              </div>
            </section>
          )}

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
                  initialization={{ amount: total }}
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

          {paymentMethod === "pix" && !pixData && (
            <>
              <button
                type="button"
                className="finish-payment-button"
                onClick={finishOrder}
                disabled={isFinishing}
              >
                {isFinishing ? "Gerando Pix..." : "Finalizar pedido"}
                {!isFinishing && <span>→</span>}
              </button>

              <p className="payment-note">
                Ao finalizar, você confirma seu pedido com a FLOWER PROPS.
              </p>
            </>
          )}

          {pixData && (
            <button
              type="button"
              className="finish-payment-button"
              onClick={() => {
                localStorage.removeItem("flower-cart");
                router.push("/pedido-confirmado");
              }}
            >
              Já paguei, continuar
              <span>→</span>
            </button>
          )}
        </section>

        <aside className="payment-summary">
          <div className="payment-summary-heading">
            <span>RESUMO</span>
            <h2>Seu pedido</h2>
          </div>

          <div className="payment-summary-products">
            {cartItems.map((item) => (
              <div className="payment-summary-product" key={item.id}>
                <div className="payment-summary-image">
                  <img src={item.image} alt={item.name} />
                  <span>{item.quantity}</span>
                </div>

                <div>
                  <strong>{item.name}</strong>
                  <p>{formatPrice(item.price)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="payment-values">
            <div>
              <span>Produtos</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>

            <div>
              <span>
                {customerData?.deliveryMethod === "pickup"
                  ? "Retirada no ateliê"
                  : "Entrega"}
              </span>

              <strong>
                {deliveryFee === 0 ? "Grátis" : formatPrice(deliveryFee)}
              </strong>
            </div>
          </div>

          <div className="payment-total">
            <span>Total</span>
            <strong>{formatPrice(total)}</strong>
          </div>

          <div className="payment-summary-receiving">
            <span>RECEBIMENTO</span>
            <strong>
              {customerData?.deliveryMethod === "pickup"
                ? "Retirada no ateliê"
                : "Entrega"}
            </strong>
          </div>

          {!pixData && (
            <button
              type="button"
              className="payment-summary-back"
              onClick={goBack}
            >
              ← Voltar à revisão
            </button>
          )}
        </aside>
      </div>
    </main>
  );
}