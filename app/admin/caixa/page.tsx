"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type OrderItem = {
  id: number;
  order_id: number;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
  item_type: string;
};

type Order = {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  delivery_method: string;
  delivery_day: string | null;
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

export default function CaixaPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deliveryFilter, setDeliveryFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("today");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  async function loadOrders() {
    setIsLoading(true);

    // Filtra por data
    let dateCondition = "";
    const now = new Date();

    if (dateFilter === "today") {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      dateCondition = start.toISOString();
    } else if (dateFilter === "week") {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      dateCondition = start.toISOString();
    }

    let query = supabase
      .from("orders")
      .select(
        `
        *,
        order_items:order_items(*)
      `
      )
      .eq("payment_status", "paid")
      .eq("order_status", "confirmed")
      .order("created_at", { ascending: true });

    if (dateCondition) {
      query = query.gte("created_at", dateCondition);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao carregar pedidos:", error);
      setOrders([]);
    } else {
      setOrders(data ?? []);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadOrders();
  }, [dateFilter]);

  // ==========================================
  // FILTRO POR TIPO DE ENTREGA
  // ==========================================

  const filtered = orders.filter((o) => {
    if (deliveryFilter !== "all" && o.delivery_method !== deliveryFilter) {
      return false;
    }
    return true;
  });

  // ==========================================
  // MARCAR COMO ENTREGUE
  // ==========================================

  async function markAsDelivered(id: number) {
    if (!confirm("Marcar esse pedido como ENTREGUE?")) return;

    setActionLoading(id);

    const { error } = await supabase
      .from("orders")
      .update({
        order_status: "delivered",
        delivered_at: new Date().toISOString(),
      })
      .eq("id", id);

    setActionLoading(null);

    if (error) {
      alert("Erro: " + error.message);
      return;
    }

    setOrders((current) => current.filter((o) => o.id !== id));
  }

  // ==========================================
  // CANCELAR PEDIDO
  // ==========================================

  async function cancelOrder(id: number) {
    if (!confirm("Cancelar esse pedido? Essa ação não pode ser desfeita."))
      return;

    setActionLoading(id);

    const { error } = await supabase
      .from("orders")
      .update({
        order_status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", id);

    setActionLoading(null);

    if (error) {
      alert("Erro: " + error.message);
      return;
    }

    setOrders((current) => current.filter((o) => o.id !== id));
  }

  // ==========================================
  // IMPRIMIR
  // ==========================================

  function handlePrint(orderId: number) {
    window.open(`/admin/caixa/imprimir/${orderId}`, "_blank");
  }

  function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatDate(value: string) {
    const date = new Date(value);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div>
      {/* HEADER */}
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              margin: "0 0 4px",
              fontSize: 22,
              fontWeight: 600,
              color: "#2f2a26",
            }}
          >
            Caixa — Fila de Saída
          </h1>
          <p style={{ margin: 0, color: "#7a7a72", fontSize: 13 }}>
            {filtered.length}{" "}
            {filtered.length === 1 ? "pedido aguardando" : "pedidos aguardando"}{" "}
            entrega
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="today">Hoje</option>
            <option value="week">Últimos 7 dias</option>
            <option value="all">Todos</option>
          </select>

          <select
            value={deliveryFilter}
            onChange={(e) => setDeliveryFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="all">Todos os tipos</option>
            <option value="delivery">Entrega</option>
            <option value="pickup">Retirada</option>
          </select>

          <button
            type="button"
            onClick={loadOrders}
            disabled={isLoading}
            style={refreshBtnStyle}
          >
            {isLoading ? "..." : "↻"}
          </button>
        </div>
      </div>

      {/* LISTA */}
      {isLoading ? (
        <div style={emptyStyle}>Carregando pedidos...</div>
      ) : filtered.length === 0 ? (
        <div style={emptyStyle}>
          🎉 Nenhum pedido aguardando entrega.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((order) => (
            <div
              key={order.id}
              style={{
                background: "#fff",
                border: "1px solid #e0e0dc",
                borderRadius: 8,
                padding: 16,
              }}
            >
              {/* Topo */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 16,
                  marginBottom: 12,
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#7a7a72",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Pedido #{order.id}
                    </span>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 600,
                        background:
                          order.delivery_method === "delivery"
                            ? "#dbeafe"
                            : "#fef3c7",
                        color:
                          order.delivery_method === "delivery"
                            ? "#1e40af"
                            : "#854d0e",
                      }}
                    >
                      {order.delivery_method === "delivery"
                        ? "🚚 Entrega"
                        : "🏪 Retirada"}
                    </span>
                    {order.delivery_day && (
                      <span
                        style={{
                          fontSize: 11,
                          color: "#7a7a72",
                        }}
                      >
                        {order.delivery_day === "saturday"
                          ? "Sábado"
                          : "Domingo"}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: "#2f2a26",
                    }}
                  >
                    {order.customer_name}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: "#7a7a72",
                      marginTop: 2,
                    }}
                  >
                    {order.customer_phone} · {formatDate(order.created_at)}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#166534",
                    }}
                  >
                    {formatPrice(order.total)}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "#7a7a72",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginTop: 2,
                    }}
                  >
                    {order.payment_method}
                  </div>
                </div>
              </div>

              {/* Itens resumidos */}
              {order.order_items && order.order_items.length > 0 && (
                <div
                  style={{
                    padding: "8px 12px",
                    background: "#f9f9f7",
                    borderRadius: 6,
                    marginBottom: 12,
                    fontSize: 12,
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

              {/* Ações */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={() => handlePrint(order.id)}
                  disabled={actionLoading === order.id}
                  style={btnSecondaryStyle}
                >
                  🖨️ Imprimir
                </button>

                <button
                  type="button"
                  onClick={() => cancelOrder(order.id)}
                  disabled={actionLoading === order.id}
                  style={btnDangerStyle}
                >
                  {actionLoading === order.id ? "..." : "❌ Cancelar"}
                </button>

                <button
                  type="button"
                  onClick={() => markAsDelivered(order.id)}
                  disabled={actionLoading === order.id}
                  style={btnSuccessStyle}
                >
                  {actionLoading === order.id ? "..." : "✅ Entregue"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================
// ESTILOS
// ==========================================

const selectStyle: React.CSSProperties = {
  height: 38,
  padding: "0 12px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 13,
  outline: "none",
  background: "#fff",
  cursor: "pointer",
};

const refreshBtnStyle: React.CSSProperties = {
  height: 38,
  padding: "0 14px",
  background: "#fff",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 13,
  cursor: "pointer",
};

const emptyStyle: React.CSSProperties = {
  padding: 40,
  textAlign: "center",
  color: "#7a7a72",
  fontSize: 13,
  background: "#fff",
  border: "1px solid #e0e0dc",
  borderRadius: 8,
};

const btnSecondaryStyle: React.CSSProperties = {
  padding: "8px 16px",
  background: "#fff",
  color: "#2f2a26",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

const btnDangerStyle: React.CSSProperties = {
  padding: "8px 16px",
  background: "#fff",
  color: "#991b1b",
  border: "1px solid #fecaca",
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

const btnSuccessStyle: React.CSSProperties = {
  padding: "8px 16px",
  background: "#166534",
  color: "#fff",
  border: 0,
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};