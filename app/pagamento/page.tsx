
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type CartItem = {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
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
  const [customerData, setCustomerData] =
    useState<CustomerData | null>(null);

  const [paymentMethod, setPaymentMethod] =
    useState<"pix" | "card">("pix");

  const [isFinishing, setIsFinishing] =
    useState(false);

  useEffect(() => {
    const savedCart =
      localStorage.getItem("flower-cart");

    const savedCheckout =
      localStorage.getItem("flower-checkout");

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
    (total, item) =>
      total + item.price * item.quantity,
    0
  );

  const deliveryFee =
    customerData?.deliveryMethod === "delivery"
      ? DELIVERY_FEE
      : 0;

  const total = subtotal + deliveryFee;

  function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function goBack() {
    router.push("/revisao");
  }

  async function finishOrder() {
    if (cartItems.length === 0) {
      alert("Seu carrinho está vazio.");
      return;
    }

    if (!customerData) {
      alert("Os dados do cliente não foram encontrados.");
      return;
    }

    try {
      setIsFinishing(true);

      // ==========================================
      // 1. CRIAR O PEDIDO EM "orders"
      // ==========================================

      const { data: order, error: orderError } =
        await supabase
          .from("orders")
          .insert({
            customer_name: customerData.name,
            customer_phone: customerData.phone,
            customer_email: customerData.email,

            delivery_method:
              customerData.deliveryMethod,

            cep: customerData.cep,
            street: customerData.street,
            number: customerData.number,
            complement: customerData.complement,
            neighborhood: customerData.neighborhood,
            city: customerData.city,

            observation:
              customerData.observation,

            subtotal: subtotal,
            delivery_fee: deliveryFee,
            total: total,

            payment_method: paymentMethod,

            payment_status: "pending",
            order_status: "pending",
          })
          .select()
          .single();

      if (orderError) {
        console.error("ERRO AO CRIAR PEDIDO");
        console.error(
          "message:",
          orderError.message
        );
        console.error(
          "details:",
          orderError.details
        );
        console.error(
          "hint:",
          orderError.hint
        );
        console.error(
          "code:",
          orderError.code
        );

        throw new Error(
          orderError.message ||
            "Não foi possível criar o pedido."
        );
      }

      // ==========================================
      // 2. CRIAR OS ITENS EM "order_items"
      // ==========================================

      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        product_price: item.price,
        quantity: item.quantity,
        subtotal:
          item.price * item.quantity,
      }));

      const { error: itemsError } =
        await supabase
          .from("order_items")
          .insert(orderItems);

      if (itemsError) {
        console.error(
          "ERRO AO CRIAR ITENS DO PEDIDO"
        );
        console.error(
          "message:",
          itemsError.message
        );
        console.error(
          "details:",
          itemsError.details
        );
        console.error(
          "hint:",
          itemsError.hint
        );
        console.error(
          "code:",
          itemsError.code
        );

        throw new Error(
          itemsError.message ||
            "O pedido foi criado, mas não foi possível registrar os produtos."
        );
      }

      // ==========================================
      // 3. SALVAR O ID DO PEDIDO
      // ==========================================

      localStorage.setItem(
        "flower-order-id",
        String(order.id)
      );

      // ==========================================
      // 4. LIMPAR O CARRINHO
      // ==========================================

      localStorage.removeItem("flower-cart");

      // ==========================================
      // 5. IR PARA PEDIDO CONFIRMADO
      // ==========================================

      router.push("/pedido-confirmado");

    } catch (error) {
      console.error(
        "ERRO AO FINALIZAR PEDIDO:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Não foi possível finalizar o pedido."
      );

      setIsFinishing(false);
    }
  }

  return (
    <main className="payment-page">

      {/* =========================
          HEADER
      ========================== */}

      <header className="payment-header">

        <div className="payment-header-inner">

          <a
            href="/"
            className="payment-logo"
          >
            FLOWER
            <span>PROPS</span>
          </a>

          <div className="payment-header-title">
            Pagamento
          </div>

          <button
            type="button"
            onClick={goBack}
            className="payment-back"
          >
            ← Voltar à revisão
          </button>

        </div>

      </header>

      {/* =========================
          ETAPAS
      ========================== */}

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

      {/* =========================
          CONTEÚDO
      ========================== */}

      <div className="payment-container">

        {/* =========================
            PRINCIPAL
        ========================== */}

        <section className="payment-main">

          <div className="payment-intro">

            <span className="payment-eyebrow">
              FINALIZAÇÃO
            </span>

            <h1>
              Escolha como
              <br />
              <em>pagar.</em>
            </h1>

            <p>
              Selecione a forma de pagamento
              para concluir seu pedido.
            </p>

          </div>

          {/* =========================
              MÉTODOS DE PAGAMENTO
          ========================== */}

          <section className="payment-card">

            <div className="payment-card-heading">

              <span>01</span>

              <div>
                <h2>
                  Forma de pagamento
                </h2>

                <p>
                  Escolha uma opção
                </p>
              </div>

            </div>

            <div className="payment-methods">

              {/* PIX */}

              <button
                type="button"
                className={`payment-method ${
                  paymentMethod === "pix"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setPaymentMethod("pix")
                }
              >

                <div className="payment-method-icon">
                  PIX
                </div>

                <div className="payment-method-content">

                  <strong>
                    Pix
                  </strong>

                  <span>
                    Pagamento instantâneo
                  </span>

                </div>

                <div className="payment-radio">

                  {paymentMethod === "pix" && "✓"}

                </div>

              </button>

              {/* CARTÃO */}

              <button
                type="button"
                className={`payment-method ${
                  paymentMethod === "card"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setPaymentMethod("card")
                }
              >

                <div className="payment-method-icon card-icon">
                  CARD
                </div>

                <div className="payment-method-content">

                  <strong>
                    Cartão
                  </strong>

                  <span>
                    Crédito ou débito
                  </span>

                </div>

                <div className="payment-radio">

                  {paymentMethod === "card" && "✓"}

                </div>

              </button>

            </div>

          </section>

          {/* =========================
              PIX
          ========================== */}

          {paymentMethod === "pix" && (

            <section className="payment-card payment-instructions">

              <div className="payment-card-heading">

                <span>02</span>

                <div>

                  <h2>
                    Pagamento via Pix
                  </h2>

                  <p>
                    Você receberá o código Pix
                    após confirmar o pedido.
                  </p>

                </div>

              </div>

              <div className="pix-information">

                <div className="pix-symbol">
                  PIX
                </div>

                <div>

                  <strong>
                    Simples, rápido e seguro
                  </strong>

                  <p>
                    Após finalizar, seu pedido
                    será preparado para pagamento
                    via Pix.
                  </p>

                </div>

              </div>

            </section>

          )}

          {/* =========================
              CARTÃO
          ========================== */}

          {paymentMethod === "card" && (

            <section className="payment-card payment-instructions">

              <div className="payment-card-heading">

                <span>02</span>

                <div>

                  <h2>
                    Pagamento com cartão
                  </h2>

                  <p>
                    O pagamento será realizado
                    de forma segura.
                  </p>

                </div>

              </div>

              <div className="card-information">

                <span>💳</span>

                <div>

                  <strong>
                    Pagamento seguro
                  </strong>

                  <p>
                    Os dados do seu cartão serão
                    processados de forma segura.
                  </p>

                </div>

              </div>

            </section>

          )}

          {/* =========================
              FINALIZAR
          ========================== */}

          <button
            type="button"
            className="finish-payment-button"
            onClick={finishOrder}
            disabled={isFinishing}
          >

            {isFinishing
              ? "Criando pedido..."
              : "Finalizar pedido"}

            {!isFinishing && (
              <span>
                →
              </span>
            )}

          </button>

          <p className="payment-note">

            Ao finalizar, você confirma seu pedido
            com a FLOWER PROPS.

          </p>

        </section>

        {/* =========================
            RESUMO
        ========================== */}

        <aside className="payment-summary">

          <div className="payment-summary-heading">

            <span>
              RESUMO
            </span>

            <h2>
              Seu pedido
            </h2>

          </div>

          {/* PRODUTOS */}

          <div className="payment-summary-products">

            {cartItems.map((item) => (

              <div
                className="payment-summary-product"
                key={item.id}
              >

                <div className="payment-summary-image">

                  <img
                    src={item.image}
                    alt={item.name}
                  />

                  <span>
                    {item.quantity}
                  </span>

                </div>

                <div>

                  <strong>
                    {item.name}
                  </strong>

                  <p>
                    {formatPrice(item.price)}
                  </p>

                </div>

              </div>

            ))}

          </div>

          {/* VALORES */}

          <div className="payment-values">

            <div>

              <span>
                Produtos
              </span>

              <strong>
                {formatPrice(subtotal)}
              </strong>

            </div>

            <div>

              <span>
                {customerData?.deliveryMethod ===
                "pickup"
                  ? "Retirada no ateliê"
                  : "Entrega"}
              </span>

              <strong>

                {deliveryFee === 0
                  ? "Grátis"
                  : formatPrice(
                      deliveryFee
                    )}

              </strong>

            </div>

          </div>

          {/* TOTAL */}

          <div className="payment-total">

            <span>
              Total
            </span>

            <strong>
              {formatPrice(total)}
            </strong>

          </div>

          {/* RECEBIMENTO */}

          <div className="payment-summary-receiving">

            <span>
              RECEBIMENTO
            </span>

            <strong>

              {customerData?.deliveryMethod ===
              "pickup"
                ? "Retirada no ateliê"
                : "Entrega"}

            </strong>

          </div>

          {/* VOLTAR */}

          <button
            type="button"
            className="payment-summary-back"
            onClick={goBack}
          >

            ← Voltar à revisão

          </button>

        </aside>

      </div>

    </main>
  );
}
