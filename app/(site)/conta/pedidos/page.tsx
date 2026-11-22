"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";

type OrderItem = {
  id: number;
  product_name: string;
  quantity: number;
  product_price: number;
  subtotal: number;
};

type Order = {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  delivery_method: string;
  delivery_day: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  cep: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  observation: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  created_at: string;
  order_items?: OrderItem[];
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Aguardando",
  confirmed: "Confirmado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: "#fef3c7", color: "#854d0e" },
  confirmed: { bg: "#dbeafe", color: "#1e40af" },
  delivered: { bg: "#dcfce7", color: "#166534" },
  cancelled: { bg: "#fee2e2", color: "#991b1b" },
};

const PAYMENT_LABELS: Record<string, string> = {
  pix: "Pix",
  card: "Cartão",
  card_credito: "Cartão de crédito",
  card_debito: "Cartão de débito",
  boleto: "Boleto",
  checkout_pro: "Checkout Pro",
  dinheiro: "Dinheiro",
};

export default function MeusPedidosPage() {
  const router = useRouter();
  const { user, loading: loadingUser } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loadingUser) return;

    if (!user) {
      router.replace("/conta");
      return;
    }

    async function loadOrders() {
      const { data, error } = await supabase
        .from("orders")
        .select(`*, order_items:order_items(*)`)
        .eq("customer_email", user!.email)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar pedidos:", error);
        setOrders([]);
      } else {
        setOrders(data ?? []);
      }

      setIsLoading(false);
    }

    loadOrders();
  }, [user, loadingUser, router]);

  function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatDate(value: string) {
    const d = new Date(value);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatScheduled(dateStr: string | null, timeStr: string | null) {
    if (!dateStr && !timeStr) return null;
    const parts = [];
    if (dateStr) {
      const d = new Date(dateStr + "T12:00:00");
      parts.push(
        d.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          weekday: "long",
        })
      );
    }
    if (timeStr) parts.push(`às ${timeStr}`);
    return parts.join(" ");
  }

  if (loadingUser || isLoading) {
    return (
      <main className="account-page">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            color: "#7a7a72",
          }}
        >
          Carregando pedidos...
        </div>
      </main>
    );
  }

  return (
    <main className="account-page">
      <header className="account-header">
        <Link href="/" className="account-logo">
          FLOWER
        </Link>

        <Link href="/conta" className="account-back">
          ← Minha conta
        </Link>
      </header>

      <div
        style={{
          width: "min(900px, calc(100% - 40px))",
          margin: "0 auto",
          padding: "40px 0 80px",
        }}
      >
        <div style={{ marginBottom: 32 }}>
          <span className="eyebrow">MINHA CONTA</span>
          <h1
            style={{
              fontFamily: "var(--serif)",
              fontSize: "clamp(36px, 5vw, 52px)",
              fontWeight: 500,
              margin: "12px 0 8px",
              color: "#3f493b",
              lineHeight: 1,
            }}
          >
            Meus pedidos
          </h1>
          <p style={{ color: "#7a7a72", fontSize: 13, margin: 0 }}>
            Acompanhe suas compras e o status de cada pedido.
          </p>
        </div>

        {orders.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 60,
              background: "#fff",
              border: "1px solid #e0e0dc",
              borderRadius: 8,
              color: "#7a7a72",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
            <p style={{ margin: "0 0 8px", fontSize: 15, color: "#2f2a26" }}>
              Você ainda não fez nenhum pedido.
            </p>
            <p style={{ margin: "0 0 24px", fontSize: 13 }}>
              Quando comprar, seus pedidos vão aparecer aqui.
            </p>
            <Link
              href="/"
              style={{
                display: "inline-block",
                padding: "12px 24px",
                background: "#2f2a26",
                color: "#fff",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              Ver produtos
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {orders.map((order) => {
              const statusStyle =
                STATUS_COLORS[order.order_status] || STATUS_COLORS.pending;

              return (
                <div
                  key={order.id}
                  style={{
                    background: "#fff",
                    border: "1px solid #e0e0dc",
                    borderRadius: 8,
                    padding: 20,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 16,
                      marginBottom: 16,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#7a7a72",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          marginBottom: 4,
                        }}
                      >
                        Pedido #{order.id}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#7a7a72",
                        }}
                      >
                        {formatDate(order.created_at)}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {STATUS_LABELS[order.order_status] ||
                          order.order_status}
                      </span>
                      <strong
                        style={{
                          fontFamily: "var(--serif)",
                          fontSize: 20,
                          fontWeight: 500,
                          color: "#166534",
                        }}
                      >
                        {formatPrice(order.total)}
                      </strong>
                    </div>
                  </div>

                  {/* ITENS */}
                  {order.order_items && order.order_items.length > 0 && (
                    <div
                      style={{
                        padding: 12,
                        background: "#f9f9f7",
                        borderRadius: 6,
                        marginBottom: 12,
                        fontSize: 13,
                        color: "#2f2a26",
                      }}
                    >
                      {order.order_items.map((item, i) => (
                        <div key={item.id}>
                          {i > 0 && " · "}
                          <strong>{item.quantity}x</strong> {item.product_name}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ENTREGA + PAGAMENTO */}
                  <div
                    style={{
                      display: "flex",
                      gap: 24,
                      fontSize: 12,
                      color: "#7a7a72",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <strong style={{ color: "#2f2a26" }}>Entrega:</strong>{" "}
                      {order.delivery_method === "pickup"
                        ? "Retirada no ateliê"
                        : "Delivery"}
                      {order.delivery_method === "delivery" &&
                        formatScheduled(
                          order.scheduled_date,
                          order.scheduled_time
                        ) &&
                        ` — ${formatScheduled(
                          order.scheduled_date,
                          order.scheduled_time
                        )}`}
                    </div>

                    <div>
                      <strong style={{ color: "#2f2a26" }}>Pagamento:</strong>{" "}
                      {PAYMENT_LABELS[order.payment_method] ||
                        order.payment_method}
                    </div>
                  </div>

                  {/* ENDEREÇO */}
                  {order.delivery_method === "delivery" && order.street && (
                    <div
                      style={{
                        marginTop: 12,
                        paddingTop: 12,
                        borderTop: "1px solid #f0f0ec",
                        fontSize: 12,
                        color: "#7a7a72",
                        lineHeight: 1.6,
                      }}
                    >
                      <strong style={{ color: "#2f2a26" }}>
                        Endereço de entrega:
                      </strong>
                      <br />
                      {order.street}, {order.number}
                      {order.complement && ` — ${order.complement}`}
                      <br />
                      {order.neighborhood} — {order.city}
                      {order.cep && ` · CEP ${order.cep}`}
                    </div>
                  )}

                  {/* OBSERVAÇÃO */}
                  {order.observation && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: 10,
                        background: "#f9f9f7",
                        borderRadius: 6,
                        fontSize: 12,
                        color: "#7a7a72",
                        fontStyle: "italic",
                      }}
                    >
                      💬 {order.observation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}