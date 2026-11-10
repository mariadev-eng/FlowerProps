"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase"; // 👈 Ajuste o caminho se o seu for diferente

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
  type?: string;
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

  // ==========================================
  // ESTADOS DO CUPOM
  // ==========================================
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState("");

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const totalItems = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  // ==========================================
  // CÁLCULO DO DESCONTO
  // ==========================================
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === "percentage") {
      discountAmount = (subtotal * appliedCoupon.discount_value) / 100;
    } else {
      discountAmount = appliedCoupon.discount_value;
    }
  }

  const total = subtotal - discountAmount;

  // ==========================================
  // FUNÇÕES
  // ==========================================
  function formatPrice(price: number) {
    return price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return;

    setIsValidatingCoupon(true);
    setCouponError("");

    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", couponCode.trim().toUpperCase())
      .eq("is_active", true)
      .single();

    if (error || !data) {
      setCouponError("Cupom inválido ou inativo.");
      setAppliedCoupon(null);
      setIsValidatingCoupon(false);
      return;
    }

    // Verifica validade
    if (data.valid_until && new Date(data.valid_until) < new Date()) {
      setCouponError("Este cupom já expirou.");
      setAppliedCoupon(null);
      setIsValidatingCoupon(false);
      return;
    }

    // Verifica valor mínimo
    if (subtotal < data.min_order_value) {
      setCouponError(`Valor mínimo para este cupom: ${formatPrice(data.min_order_value)}`);
      setAppliedCoupon(null);
      setIsValidatingCoupon(false);
      return;
    }

    setAppliedCoupon(data);
    setIsValidatingCoupon(false);
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  }

  function handleCheckout() {
    if (items.length === 0) return;

    // Salva o cupom no localStorage para o Checkout ler
    if (appliedCoupon) {
      localStorage.setItem("flower-applied-coupon", JSON.stringify(appliedCoupon));
      localStorage.setItem("flower-discount-amount", String(discountAmount));
    } else {
      localStorage.removeItem("flower-applied-coupon");
      localStorage.removeItem("flower-discount-amount");
    }

    onClose();
    router.push("/checkout");
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
            <span className="eyebrow">SEU PEDIDO</span>

            <h2>Carrinho</h2>

            {totalItems > 0 && (
              <span className="cart-items-count">
                {totalItems} {totalItems === 1 ? "item" : "itens"}
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
            <div className="cart-empty-icon">♡</div>

            <h3>Seu carrinho está vazio</h3>

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
                <div className="cart-item" key={item.id}>
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
                          {item.type === "subscription"
                            ? "ASSINATURA"
                            : "FLOWER"}
                        </span>

                        <h3>{item.name}</h3>
                      </div>

                      <button
                        type="button"
                        className="remove-item"
                        onClick={() => onRemove(item.id)}
                        aria-label={`Remover ${item.name}`}
                      >
                        ×
                      </button>
                    </div>

                    <strong>{formatPrice(item.price)}</strong>

                    {item.type === "subscription" ? (
                      <span className="cart-subscription-note">
                        Assinatura mensal
                      </span>
                    ) : (
                      <div className="quantity">
                        <button
                          type="button"
                          onClick={() => onDecrease(item.id)}
                          aria-label={`Diminuir quantidade de ${item.name}`}
                        >
                          −
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          type="button"
                          onClick={() => onIncrease(item.id)}
                          aria-label={`Aumentar quantidade de ${item.name}`}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-footer">
              {/* ========================================== */}
              {/* CAMPO DE CUPOM */}
              {/* ========================================== */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Código do cupom"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={!!appliedCoupon}
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: 13,
                      textTransform: "uppercase",
                    }}
                  />
                  {appliedCoupon ? (
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      style={{
                        padding: "10px 16px",
                        background: "transparent",
                        color: "#991b1b",
                        border: "1px solid #fecaca",
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Remover
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isValidatingCoupon}
                      style={{
                        padding: "10px 16px",
                        background: "#2f2a26",
                        color: "#fff",
                        border: 0,
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: isValidatingCoupon ? "wait" : "pointer",
                      }}
                    >
                      {isValidatingCoupon ? "..." : "Aplicar"}
                    </button>
                  )}
                </div>
                {couponError && (
                  <p style={{ color: "#dc2626", fontSize: 12, marginTop: 6 }}>
                    {couponError}
                  </p>
                )}
                {appliedCoupon && (
                  <p style={{ color: "#166534", fontSize: 12, marginTop: 6, fontWeight: 600 }}>
                    ✅ Cupom "{appliedCoupon.code}" aplicado!
                  </p>
                )}
              </div>

              {/* ========================================== */}
              {/* RESUMO DE VALORES */}
              {/* ========================================== */}
              <div className="cart-summary">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>

                {appliedCoupon && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13, color: "#166534" }}>
                    <span>Desconto ({appliedCoupon.code})</span>
                    <span>- {formatPrice(discountAmount)}</span>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontWeight: 700, fontSize: 16 }}>
                  <span>Total</span>
                  <strong>{formatPrice(total)}</strong>
                </div>

                <p style={{ fontSize: 11, color: "#7a7a72", marginTop: 8 }}>
                  O valor da entrega será calculado na próxima etapa.
                </p>
              </div>

              <button
                type="button"
                className="button cart-checkout"
                onClick={handleCheckout}
              >
                <span>Finalizar pedido</span>
                <span>→</span>
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}