"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

export default function ReviewPage() {
  const router = useRouter();

  const [cartItems, setCartItems] =
    useState<CartItem[]>([]);

  const [customerData, setCustomerData] =
    useState<CustomerData | null>(null);

  useEffect(() => {
    const savedCart =
      localStorage.getItem("flower-cart");

    const savedCheckout =
      localStorage.getItem(
        "flower-checkout"
      );

    if (savedCart) {
      try {
        setCartItems(
          JSON.parse(savedCart)
        );
      } catch {
        localStorage.removeItem(
          "flower-cart"
        );
      }
    }

    if (savedCheckout) {
      try {
        setCustomerData(
          JSON.parse(savedCheckout)
        );
      } catch {
        localStorage.removeItem(
          "flower-checkout"
        );
      }
    }
  }, []);

  const subtotal = cartItems.reduce(
    (total, item) =>
      total +
      item.price * item.quantity,
    0
  );

  const deliveryFee =
    customerData?.deliveryMethod ===
    "delivery"
      ? DELIVERY_FEE
      : 0;

  const total =
    subtotal + deliveryFee;

  const totalItems =
    cartItems.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );

  function formatPrice(value: number) {
    return value.toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    );
  }

  function goToCheckout() {
    router.push("/checkout");
  }

  function continueToPayment() {
    router.push("/pagamento");
  }

  return (
    <main className="review-page">

      {/* =================================
          HEADER
      ================================= */}

      <header className="checkout-header">

        <div className="checkout-header-inner">

          <a
            href="/"
            className="checkout-logo"
          >
            FLOWER
          </a>

          <div className="checkout-header-title">
            Revisão do pedido
          </div>

          <a
            href="/"
            className="checkout-back"
          >
            ← Voltar ao ateliê
          </a>

        </div>

      </header>

      {/* =================================
          ETAPAS
      ================================= */}

      <div className="checkout-steps">

        <div className="checkout-step completed">

          <span>
            ✓
          </span>

          <p>
            Carrinho
          </p>

        </div>

        <div className="step-line active" />

        <div className="checkout-step completed">

          <span>
            ✓
          </span>

          <p>
            Dados
          </p>

        </div>

        <div className="step-line active" />

        <div className="checkout-step current">

          <span>
            3
          </span>

          <p>
            Revisão
          </p>

        </div>

        <div className="step-line" />

        <div className="checkout-step">

          <span>
            4
          </span>

          <p>
            Pagamento
          </p>

        </div>

      </div>

      {/* =================================
          CONTEÚDO
      ================================= */}

      <div className="review-container">

        {/* =================================
            COLUNA PRINCIPAL
        ================================= */}

        <div className="review-main">

          {/* TÍTULO */}

          <div className="review-intro">

            <span className="eyebrow">
              FLOWER PROPS
            </span>

            <h1>
              Confira tudo antes
              de finalizar
            </h1>

            <p>
              Revise seu pedido e confirme
              se todas as informações estão
              corretas.
            </p>

          </div>

          {/* =================================
              PRODUTOS
          ================================= */}

          <section className="review-card">

            <div className="review-card-header">

              <div>

                <span className="review-number">
                  01
                </span>

                <div>

                  <h2>
                    Seu pedido
                  </h2>

                  <p>
                    {totalItems}{" "}
                    {totalItems === 1
                      ? "item selecionado"
                      : "itens selecionados"}
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={goToCheckout}
                className="review-edit"
              >
                Editar pedido
              </button>

            </div>

            <div className="review-products">

              {cartItems.length === 0 ? (

                <div className="review-empty">

                  <span>
                    ♡
                  </span>

                  <p>
                    Seu carrinho está vazio.
                  </p>

                  <a href="/">
                    Voltar ao ateliê
                  </a>

                </div>

              ) : (

                cartItems.map(
                  (item) => (

                    <div
                      className="review-product"
                      key={item.id}
                    >

                      <div className="review-product-image">

                        <img
                          src={item.image}
                          alt={item.name}
                        />

                        <span>
                          {item.quantity}
                        </span>

                      </div>

                      <div className="review-product-details">

                        <span>
                          FLOWER
                        </span>

                        <h3>
                          {item.name}
                        </h3>

                        <p>
                          {item.quantity}{" "}
                          {item.quantity === 1
                            ? "unidade"
                            : "unidades"}
                        </p>

                      </div>

                      <strong>
                        {formatPrice(
                          item.price *
                            item.quantity
                        )}
                      </strong>

                    </div>

                  )
                )

              )}

            </div>

          </section>

          {/* =================================
              CLIENTE
          ================================= */}

          <section className="review-card">

            <div className="review-card-header">

              <div>

                <span className="review-number">
                  02
                </span>

                <div>

                  <h2>
                    Seus dados
                  </h2>

                  <p>
                    Informações para o pedido
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={goToCheckout}
                className="review-edit"
              >
                Editar
              </button>

            </div>

            <div className="review-data-grid">

              <div className="review-data">

                <span>
                  Nome
                </span>

                <strong>
                  {customerData?.name ||
                    "Não informado"}
                </strong>

              </div>

              <div className="review-data">

                <span>
                  Telefone
                </span>

                <strong>
                  {customerData?.phone ||
                    "Não informado"}
                </strong>

              </div>

              <div className="review-data">

                <span>
                  E-mail
                </span>

                <strong>
                  {customerData?.email ||
                    "Não informado"}
                </strong>

              </div>

            </div>

          </section>

          {/* =================================
              ENTREGA
          ================================= */}

          <section className="review-card">

            <div className="review-card-header">

              <div>

                <span className="review-number">
                  03
                </span>

                <div>

                  <h2>
                    Recebimento
                  </h2>

                  <p>
                    Como você receberá suas flores
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={goToCheckout}
                className="review-edit"
              >
                Alterar
              </button>

            </div>

            {customerData?.deliveryMethod ===
            "pickup" ? (

              <div className="review-method">

                <div className="review-method-icon">
                  ✿
                </div>

                <div className="review-method-content">

                  <span>
                    RETIRADA
                  </span>

                  <h3>
                    Retirar no ateliê
                  </h3>

                  <p>
                    Seu pedido ficará disponível
                    para retirada no ateliê FLOWER.
                  </p>

                </div>

                <strong>
                  Grátis
                </strong>

              </div>

            ) : (

              <div>

                <div className="review-method">

                  <div className="review-method-icon">
                    ♧
                  </div>

                  <div className="review-method-content">

                    <span>
                      ENTREGA
                    </span>

                    <h3>
                      Receber em casa
                    </h3>

                    <p>
                      Entrega fixa de R$ 15,00.
                    </p>

                  </div>

                  <strong>
                    R$ 15,00
                  </strong>

                </div>

                <div className="review-address">

                  <span>
                    ENDEREÇO
                  </span>

                  <p>

                    {customerData?.street ||
                      "Rua não informada"}

                    {customerData?.number
                      ? `, ${customerData.number}`
                      : ""}

                    {customerData?.complement
                      ? ` — ${customerData.complement}`
                      : ""}

                    <br />

                    {customerData?.neighborhood ||
                      "Bairro não informado"}

                    {customerData?.city
                      ? ` · ${customerData.city}`
                      : ""}

                    {customerData?.cep
                      ? ` · CEP ${customerData.cep}`
                      : ""}

                  </p>

                </div>

              </div>

            )}

          </section>

          {/* =================================
              OBSERVAÇÕES
          ================================= */}

          {customerData?.observation && (

            <section className="review-card">

              <div className="review-card-header">

                <div>

                  <span className="review-number">
                    04
                  </span>

                  <div>

                    <h2>
                      Observações
                    </h2>

                    <p>
                      Informações adicionais
                    </p>

                  </div>

                </div>

              </div>

              <div className="review-note">

                <span>
                  “
                </span>

                <p>
                  {customerData.observation}
                </p>

              </div>

            </section>

          )}

        </div>

        {/* =================================
            RESUMO
        ================================= */}

        <aside className="review-summary">

          <div className="review-summary-top">

            <span className="eyebrow">
              RESUMO
            </span>

            <h2>
              Seu pedido
            </h2>

          </div>

          {/* MINI PRODUTOS */}

          <div className="summary-mini-products">

            {cartItems.map(
              (item) => (

                <div
                  className="summary-mini-product"
                  key={item.id}
                >

                  <div className="summary-mini-image">

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

                    <span>
                      {formatPrice(
                        item.price
                      )}
                    </span>

                  </div>

                </div>

              )
            )}

          </div>

          {/* VALORES */}

          <div className="summary-prices">

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

          <div className="summary-final-total">

            <span>
              Total
            </span>

            <strong>
              {formatPrice(total)}
            </strong>

          </div>

          {/* PAGAMENTO */}

          <button
            type="button"
            className="review-payment-button"
            onClick={continueToPayment}
          >

            Continuar para pagamento

            <span>
              →
            </span>

          </button>

          {/* SEGURANÇA */}

          <div className="review-trust">

            <span>
              ✓
            </span>

            <p>
              Compra segura e atendimento
              personalizado pelo ateliê FLOWER.
            </p>

          </div>

          <div className="review-back">

            <button
              type="button"
              onClick={goToCheckout}
            >
              ← Voltar e editar dados
            </button>

          </div>

        </aside>

      </div>

    </main>
  );
}