
"use client";

import { useRouter } from "next/navigation";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: number;
  image: string | null;
  available: boolean;
};

type CartItem = Product & {
  quantity: number;
};

type CartProps = {
  items: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  onRemove: (id: number) => void;
  onIncrease: (id: number) => void;
  onDecrease: (id: number) => void;
};

export default function Cart({
  items,
  isOpen,
  onClose,
  onRemove,
  onIncrease,
  onDecrease,
}: CartProps) {
  const router = useRouter();

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const totalItems = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  function formatPrice(price: number) {
    return price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function handleCheckout() {
    if (items.length === 0) return;

    onClose();
    router.push("/revisao");
  }

  return (
    <>
      <div
        className={`cart-overlay ${isOpen ? "active" : ""}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      <aside
        className={`cart-drawer ${isOpen ? "active" : ""}`}
        aria-label="Carrinho de compras"
      >
        <div className="cart-header">
          <div>
            <span className="eyebrow">
              SEU PEDIDO
            </span>

            <h2>
              Carrinho
            </h2>

            {totalItems > 0 && (
              <span className="cart-items-count">
                {totalItems}{" "}
                {totalItems === 1 ? "item" : "itens"}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar carrinho"
            className="cart-close"
          >
            ×
          </button>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty-icon">
              ♡
            </div>

            <h3>
              Seu carrinho está vazio
            </h3>

            <p>
              Escolha suas flores favoritas e elas aparecerão aqui.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="button button-primary"
            >
              Continuar comprando
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map((item) => (
                <div
                  className="cart-item"
                  key={item.id}
                >
                  <div className="cart-item-image">
                    <img
                      src={
                        item.image ||
                        "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=300&q=80"
                      }
                      alt={item.name}
                    />
                  </div>

                  <div className="cart-item-info">
                    <div className="cart-item-top">
                      <div>
                        <span className="cart-category">
                          FLOWER
                        </span>

                        <h3>
                          {item.name}
                        </h3>
                      </div>

                      <button
                        type="button"
                        className="remove-item"
                        onClick={() =>
                          onRemove(item.id)
                        }
                        aria-label={`Remover ${item.name}`}
                      >
                        ×
                      </button>
                    </div>

                    <strong>
                      {formatPrice(item.price)}
                    </strong>

                    <div className="quantity">
                      <button
                        type="button"
                        onClick={() =>
                          onDecrease(item.id)
                        }
                        aria-label={`Diminuir quantidade de ${item.name}`}
                      >
                        −
                      </button>

                      <span>
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          onIncrease(item.id)
                        }
                        aria-label={`Aumentar quantidade de ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-footer">
              <div className="cart-summary">
                <div>
                  <span>
                    Total
                  </span>

                  <strong>
                    {formatPrice(total)}
                  </strong>
                </div>

                <p>
                  O valor da entrega será calculado na próxima etapa.
                </p>
              </div>

              <button
                type="button"
                className="button cart-checkout"
                onClick={handleCheckout}
              >
                <span>
                  Finalizar pedido
                </span>

                <span>
                  →
                </span>
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

