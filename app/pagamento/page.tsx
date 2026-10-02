"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { initMercadoPago } from "@mercadopago/sdk-react";
import { supabase } from "@/lib/supabase";

initMercadoPago(process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY!, {
  locale: "pt-BR",
});

const WHATSAPP_NUMBER = "5522992298475";

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

  const [isFinishing, setIsFinishing] = useState(false);
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

  function getDeviceId(): string | null {
    if (typeof window === "undefined") return null;
    return (window as any).MP_DEVICE_SESSION_ID || null;
  }

  function goBack() {
    router.push("/revisao");
  }

  // ==========================================
  // SALVA PEDIDO NO SUPABASE (pending)
  // ==========================================

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

  // ==========================================
  // PAGAMENTO COM PIX
  // ==========================================

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

      const deviceId = getDeviceId();

      const response = await fetch("/api/mercado-pago/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_method_id: "pix",
          transaction_amount: total,
          device_id: deviceId,
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

  // ==========================================
  // CARTÃO VIA WHATSAPP (CRÉDITO / DÉBITO)
  // ==========================================

  async function handleCardWhatsApp(type: "credito" | "debito") {
    setIsFinishing(true);
    setError("");

    if (!customerData) {
      setError("Dados do cliente não encontrados.");
      setIsFinishing(false);
      return;
    }

    try {
      // Salva o pedido primeiro como "pending"
      const orderId = await saveOrderToSupabase(
        type === "credito" ? "card_credito" : "card_debito"
      );

      // Monta a lista de itens
      const itemsList = cartItems
        .map((item) => `• ${item.quantity}x ${item.name}`)
        .join("\n");

      // Monta a mensagem
      const message = `Olá! Quero pagar com cartão de ${
        type === "credito" ? "crédito" : "débito"
      }.

📦 Pedido: #${orderId}
💰 Valor: ${formatPrice(total)}
👤 Cliente: ${customerData.name}

Itens:
${itemsList}

Aguardo o link de pagamento. Obrigado!`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

      // Abre o WhatsApp
      window.open(whatsappLink, "_blank");

      // Salva o ID do pedido
      localStorage.setItem("flower-order-id", String(orderId));

      setIsFinishing(false);
    } catch (err: any) {
      console.error("Erro ao processar cartão:", err);
      setError(err?.message || "Erro ao processar. Tente novamente.");
      setIsFinishing(false);
    }
  }

  function copyPixCode() {
    if (!pixData) return;
    navigator.clipboard.writeText(pixData.qrCode);
    alert("Código Pix copiado! Cole no seu app do banco.");
  }

  // ==========================================
  // POLLING DO PIX
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
          clearInterval(interval);

          localStorage.setItem("flower-order-id", String(pixData.orderId));
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
      {/* HEADER */}
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
            <div
              className="account-message error"
              style={{ marginBottom: 20 }}
            >
              {error}
            </div>
          )}

          {!pixData && (
            <>
              {/* 01 — PIX */}
              <section className="payment-card payment-instructions">
                <div className="payment-card-heading">
                  <span>01</span>
                  <div>
                    <h2>Pix</h2>
                    <p>Pagamento instantâneo, sem sair do site</p>
                  </div>
                </div>

                <div className="pix-information">
                  <div className="pix-symbol">PIX</div>
                  <div>
                    <strong>Simples, rápido e seguro</strong>
                    <p>
                      Após finalizar, o QR Code será gerado pra você
                      escanear.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="finish-payment-button"
                  onClick={handlePixPayment}
                  disabled={isFinishing}
                  style={{ marginTop: 16 }}
                >
                  {isFinishing ? "Gerando Pix..." : "Pagar com Pix"}
                  {!isFinishing && <span>→</span>}
                </button>
              </section>

              {/* 02 — CARTÃO DE CRÉDITO VIA WHATSAPP */}
              <section className="payment-card payment-instructions">
                <div className="payment-card-heading">
                  <span>02</span>
                  <div>
                    <h2>Cartão de crédito</h2>
                    <p>Receba o link de pagamento pelo WhatsApp</p>
                  </div>
                </div>

                <div
                  className="pix-information"
                  style={{ background: "#dbeafe" }}
                >
                  <div
                    className="pix-symbol"
                    style={{
                      background: "#1e40af",
                      fontSize: 22,
                    }}
                  >
                    💳
                  </div>
                  <div>
                    <strong>Link seguro do Mercado Pago</strong>
                    <p>
                      Você será redirecionado pro WhatsApp do ateliê pra
                      receber o link.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="finish-payment-button"
                  onClick={() => handleCardWhatsApp("credito")}
                  disabled={isFinishing}
                  style={{
                    marginTop: 16,
                    background: "#1e40af",
                  }}
                >
                  {isFinishing
                    ? "Aguarde..."
                    : "Pagar com crédito via WhatsApp"}
                  {!isFinishing && <span>→</span>}
                </button>
              </section>

              {/* 03 — CARTÃO DE DÉBITO VIA WHATSAPP */}
              <section className="payment-card payment-instructions">
                <div className="payment-card-heading">
                  <span>03</span>
                  <div>
                    <h2>Cartão de débito</h2>
                    <p>Receba o link de pagamento pelo WhatsApp</p>
                  </div>
                </div>

                <div
                  className="pix-information"
                  style={{ background: "#fef3c7" }}
                >
                  <div
                    className="pix-symbol"
                    style={{
                      background: "#854d0e",
                      fontSize: 22,
                    }}
                  >
                    💳
                  </div>
                  <div>
                    <strong>Link seguro do Mercado Pago</strong>
                    <p>
                      Você será redirecionado pro WhatsApp do ateliê pra
                      receber o link.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="finish-payment-button"
                  onClick={() => handleCardWhatsApp("debito")}
                  disabled={isFinishing}
                  style={{
                    marginTop: 16,
                    background: "#854d0e",
                  }}
                >
                  {isFinishing
                    ? "Aguarde..."
                    : "Pagar com débito via WhatsApp"}
                  {!isFinishing && <span>→</span>}
                </button>
              </section>

              <p
                className="payment-note"
                style={{ marginTop: 24 }}
              >
                💡 Dica: o Pix é aprovado na hora. Para cartão, você será
                redirecionado pro WhatsApp do ateliê pra receber o link.
              </p>
            </>
          )}

          {/* QR CODE PIX ATIVO */}
          {pixData && (
            <>
              <section className="payment-card payment-instructions">
                <div className="payment-card-heading">
                  <span>✓</span>
                  <div>
                    <h2>Escaneie o QR Code</h2>
                    <p>
                      Abra o app do seu banco e escaneie o código abaixo.
                    </p>
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
                    Após o pagamento, seu pedido será confirmado
                    automaticamente.
                  </p>
                </div>
              </section>

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
            </>
          )}
        </section>

        {/* RESUMO */}
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