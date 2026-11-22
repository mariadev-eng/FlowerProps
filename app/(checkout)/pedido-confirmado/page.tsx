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
deliveryMethod: "delivery" | "pickup";
};

export default function OrderConfirmedPage() {
const router = useRouter();

const [cartItems, setCartItems] = useState<CartItem[]>([]);
const [customerData, setCustomerData] =
useState<CustomerData | null>(null);

const [orderNumber, setOrderNumber] = useState("");

useEffect(() => {
const savedCart = localStorage.getItem("flower-cart");
const savedCheckout =
localStorage.getItem("flower-checkout");


if (savedCart) {
  try {
    setCartItems(JSON.parse(savedCart));
  } catch {
    setCartItems([]);
  }
}

if (savedCheckout) {
  try {
    setCustomerData(JSON.parse(savedCheckout));
  } catch {
    setCustomerData(null);
  }
}

const savedOrderNumber =
  localStorage.getItem("flower-order-number");

if (savedOrderNumber) {
  setOrderNumber(savedOrderNumber);
} else {
  const generatedNumber =
    Math.floor(100000 + Math.random() * 900000).toString();

  localStorage.setItem(
    "flower-order-number",
    generatedNumber
  );

  setOrderNumber(generatedNumber);
}


}, []);

const totalItems = cartItems.reduce(
(total, item) => total + item.quantity,
0
);

function formatPrice(value: number) {
return value.toLocaleString("pt-BR", {
style: "currency",
currency: "BRL",
});
}

const subtotal = cartItems.reduce(
(total, item) =>
total + item.price * item.quantity,
0
);

const deliveryFee =
customerData?.deliveryMethod === "delivery"
? 15
: 0;

const total = subtotal + deliveryFee;

function goToHome() {
localStorage.removeItem("flower-cart");
localStorage.removeItem("flower-checkout");
localStorage.removeItem("flower-order-number");


router.push("/");


}

return ( <main className="confirmed-page">


  <header className="confirmed-header">

    <a
      href="/"
      className="confirmed-logo"
    >
      FLOWER
      <span>PROPS</span>
    </a>

    <span className="confirmed-header-label">
      Pedido
    </span>

    <div className="confirmed-header-secure">
      ✓ Compra segura
    </div>

  </header>

  <div className="confirmed-progress">

    <div className="confirmed-progress-step done">
      <span>✓</span>
      <p>Carrinho</p>
    </div>

    <div className="confirmed-progress-line done" />

    <div className="confirmed-progress-step done">
      <span>✓</span>
      <p>Dados</p>
    </div>

    <div className="confirmed-progress-line done" />

    <div className="confirmed-progress-step done">
      <span>✓</span>
      <p>Revisão</p>
    </div>

    <div className="confirmed-progress-line done" />

    <div className="confirmed-progress-step done">
      <span>✓</span>
      <p>Concluído</p>
    </div>

  </div>

  <section className="confirmed-container">

    <div className="confirmed-icon">
      ✓
    </div>

    <span className="confirmed-eyebrow">
      PEDIDO RECEBIDO
    </span>

    <h1>
      Obrigada por escolher
      <br />
      <em>a FLOWER.</em>
    </h1>

    <p className="confirmed-description">
      Seu pedido foi recebido com sucesso.
      Estamos preparando tudo com cuidado
      para você.
    </p>

    <div className="confirmed-number">

      <span>
        NÚMERO DO PEDIDO
      </span>

      <strong>
        #{orderNumber || "000000"}
      </strong>

    </div>

    <div className="confirmed-content">

      <section className="confirmed-card">

        <div className="confirmed-card-heading">

          <span>01</span>

          <div>
            <h2>
              Resumo do pedido
            </h2>

            <p>
              {totalItems}{" "}
              {totalItems === 1
                ? "item"
                : "itens"}
            </p>
          </div>

        </div>

        <div className="confirmed-products">

          {cartItems.map((item) => (

            <div
              className="confirmed-product"
              key={item.id}
            >

              <div className="confirmed-product-image">

                <img
                  src={item.image}
                  alt={item.name}
                />

                <span>
                  {item.quantity}
                </span>

              </div>

              <div className="confirmed-product-info">

                <strong>
                  {item.name}
                </strong>

                <p>
                  {item.quantity}{" "}
                  {item.quantity === 1
                    ? "unidade"
                    : "unidades"}
                </p>

              </div>

              <strong className="confirmed-product-price">
                {formatPrice(
                  item.price * item.quantity
                )}
              </strong>

            </div>

          ))}

        </div>

        <div className="confirmed-total">

          <span>
            Total
          </span>

          <strong>
            {formatPrice(total)}
          </strong>

        </div>

      </section>

      <section className="confirmed-card">

        <div className="confirmed-card-heading">

          <span>02</span>

          <div>
            <h2>
              Recebimento
            </h2>

            <p>
              Informações sobre seu pedido
            </p>
          </div>

        </div>

        <div className="confirmed-receiving">

          <div className="confirmed-receiving-icon">
            ✿
          </div>

          <div>

            <span>
              {customerData?.deliveryMethod ===
              "pickup"
                ? "RETIRADA"
                : "ENTREGA"}
            </span>

            <strong>
              {customerData?.deliveryMethod ===
              "pickup"
                ? "Retirar no ateliê"
                : "Receber em casa"}
            </strong>

            <p>
              {customerData?.deliveryMethod ===
              "pickup"
                ? "Seu pedido ficará disponível para retirada no ateliê FLOWER."
                : "Seu pedido será entregue no endereço informado."}
            </p>

          </div>

        </div>

      </section>

    </div>

    <div className="confirmed-next">

      <div>
        <span>
          PRÓXIMO PASSO
        </span>

        <p>
          {customerData?.deliveryMethod ===
          "pickup"
            ? "Aguarde a confirmação de que seu pedido está pronto para retirada."
            : "Acompanhe seu pedido e aguarde a confirmação da entrega."}
        </p>
      </div>

      <button
        type="button"
        onClick={goToHome}
      >
        Voltar ao ateliê
        <span>→</span>
      </button>

    </div>

  </section>

</main>

);
}
