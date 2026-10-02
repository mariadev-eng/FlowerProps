"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";

// ==========================================
// TIPOS
// ==========================================

type Order = {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  delivery_method: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  created_at: string;
  delivered_at: string | null;
  cancelled_at: string | null;
  order_items?: OrderItem[];
};

type OrderItem = {
  id: number;
  order_id: number;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
};

type SubscriptionOrder = {
  id: number;
  plan_name: string;
  plan_frequency: string;
  plan_price: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  payment_status: string;
  payment_method: string;
  last_payment_at: string | null;
  next_renewal_at: string | null;
  created_at: string;
};

type TabType = "geral" | "pedidos" | "assinaturas";

type PeriodType = "today" | "7days" | "30days" | "thisMonth" | "lastMonth" | "all";

const PERIOD_LABELS: Record<PeriodType, string> = {
  today: "Hoje",
  "7days": "Últimos 7 dias",
  "30days": "Últimos 30 dias",
  thisMonth: "Este mês",
  lastMonth: "Mês passado",
  all: "Todo o período",
};

const STATUS_LABELS: Record<string, string> = {
  paid: "Pago",
  pending: "Pendente",
  cancelled: "Cancelado",
  rejected: "Recusado",
  confirmed: "Confirmado",
  delivered: "Entregue",
  failed: "Falhou",
};

const PAYMENT_LABELS: Record<string, string> = {
  pix: "Pix",
  card: "Cartão",
  boleto: "Boleto",
  checkout_pro: "Checkout Pro",
  dinheiro: "Dinheiro",
};

// ==========================================
// PÁGINA
// ==========================================

export default function ContabilPage() {
  const [activeTab, setActiveTab] = useState<TabType>("geral");

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{
            margin: "0 0 16px",
            fontSize: 22,
            fontWeight: 600,
            color: "#2f2a26",
          }}
        >
          Contábil
        </h1>

        <div
          style={{
            display: "flex",
            gap: 4,
            borderBottom: "1px solid #e0e0dc",
          }}
        >
          <SubTab
            active={activeTab === "geral"}
            onClick={() => setActiveTab("geral")}
          >
            📊 Geral
          </SubTab>
          <SubTab
            active={activeTab === "pedidos"}
            onClick={() => setActiveTab("pedidos")}
          >
            📦 Pedidos
          </SubTab>
          <SubTab
            active={activeTab === "assinaturas"}
            onClick={() => setActiveTab("assinaturas")}
          >
            📅 Assinaturas
          </SubTab>
        </div>
      </div>

      {activeTab === "geral" && <GeralTab />}
      {activeTab === "pedidos" && <PedidosTab />}
      {activeTab === "assinaturas" && <AssinaturasTab />}
    </div>
  );
}

// ==========================================
// SUB-ABA
// ==========================================

function SubTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "10px 16px",
        background: "transparent",
        border: 0,
        borderBottom: active ? "2px solid #2f2a26" : "2px solid transparent",
        color: active ? "#2f2a26" : "#7a7a72",
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        cursor: "pointer",
        marginBottom: -1,
      }}
    >
      {children}
    </button>
  );
}

// ==========================================
// HELPERS DE PERÍODO
// ==========================================

function getPeriodDates(period: PeriodType): { start: Date | null; end: Date } {
  const now = new Date();
  const end = new Date(now);

  if (period === "all") return { start: null, end };

  const start = new Date(now);

  switch (period) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "7days":
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case "30days":
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      break;
    case "thisMonth":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case "lastMonth":
      start.setMonth(start.getMonth() - 1);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
}

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ==========================================
// ABA: GERAL
// ==========================================

function GeralTab() {
  const [period, setPeriod] = useState<PeriodType>("thisMonth");
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);

      const { start, end } = getPeriodDates(period);

      // Pedidos pagos
      let ordersQuery = supabase
        .from("orders")
        .select("*")
        .eq("payment_status", "paid")
        .order("created_at", { ascending: false });

      if (start) ordersQuery = ordersQuery.gte("created_at", start.toISOString());
      ordersQuery = ordersQuery.lte("created_at", end.toISOString());

      const { data: ordersData } = await ordersQuery;
      setOrders(ordersData ?? []);

      // Assinaturas pagas
      let subsQuery = supabase
        .from("subscription_orders")
        .select("*")
        .eq("payment_status", "paid")
        .order("last_payment_at", { ascending: false });

      if (start) subsQuery = subsQuery.gte("last_payment_at", start.toISOString());
      subsQuery = subsQuery.lte("last_payment_at", end.toISOString());

      const { data: subsData } = await subsQuery;
      setSubscriptions(subsData ?? []);

      setIsLoading(false);
    }

    loadData();
  }, [period]);

  // ==========================================
  // CÁLCULOS
  // ==========================================

  const ordersTotal = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const subsTotal = subscriptions.reduce(
    (sum, s) => sum + Number(s.plan_price),
    0
  );
  const totalGeral = ordersTotal + subsTotal;
  const ticketMedio =
    orders.length + subscriptions.length > 0
      ? totalGeral / (orders.length + subscriptions.length)
      : 0;

  // ==========================================
  // GRÁFICO — FATURAMENTO POR DIA (30 dias)
  // ==========================================

  const chartData = useMemo(() => {
    const days: { date: string; label: string; orders: number; subs: number }[] = [];
    const now = new Date();
    const numDays = period === "7days" ? 7 : 30;

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const dateStr = d.toISOString().split("T")[0];

      const ordersTotal = orders
        .filter((o) => o.created_at.startsWith(dateStr))
        .reduce((sum, o) => sum + Number(o.total), 0);

      const subsTotal = subscriptions
        .filter((s) => s.last_payment_at?.startsWith(dateStr))
        .reduce((sum, s) => sum + Number(s.plan_price), 0);

      days.push({
        date: dateStr,
        label: d.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        }),
        orders: ordersTotal,
        subs: subsTotal,
      });
    }

    return days;
  }, [orders, subscriptions, period]);

  const maxValue = Math.max(
    ...chartData.map((d) => d.orders + d.subs),
    1
  );

  return (
    <>
      {/* FILTRO */}
      <div style={{ marginBottom: 20 }}>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as PeriodType)}
          style={selectStyle}
        >
          {Object.entries(PERIOD_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div style={emptyStyle}>Carregando dados...</div>
      ) : (
        <>
          {/* CARDS DE RESUMO */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
              marginBottom: 32,
            }}
          >
            <StatCard
              title="Faturamento Total"
              value={formatPrice(totalGeral)}
              color="#166534"
            />
            <StatCard
              title="Pedidos"
              value={`${orders.length} (${formatPrice(ordersTotal)})`}
              color="#1e40af"
            />
            <StatCard
              title="Assinaturas"
              value={`${subscriptions.length} (${formatPrice(subsTotal)})`}
              color="#854d0e"
            />
            <StatCard
              title="Ticket Médio"
              value={formatPrice(ticketMedio)}
              color="#7c3aed"
            />
          </div>

          {/* GRÁFICO */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #e0e0dc",
              borderRadius: 8,
              padding: 24,
              marginBottom: 24,
            }}
          >
            <h3
              style={{
                margin: "0 0 20px",
                fontSize: 14,
                fontWeight: 600,
                color: "#2f2a26",
              }}
            >
              Faturamento por dia
            </h3>

            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 2,
                height: 200,
                overflowX: "auto",
                paddingBottom: 30,
                position: "relative",
              }}
            >
              {chartData.map((day) => {
                const total = day.orders + day.subs;
                const height = (total / maxValue) * 160;

                return (
                  <div
                    key={day.date}
                    style={{
                      flex: "1 0 auto",
                      minWidth: 24,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: `${height}px`,
                        background: total > 0 ? "#166534" : "#e5e7eb",
                        borderRadius: "2px 2px 0 0",
                        minHeight: 2,
                        transition: "height 0.2s",
                        position: "relative",
                      }}
                      title={`${day.label}: ${formatPrice(total)}`}
                    />

                    {total > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          top: -18,
                          fontSize: 9,
                          color: "#166534",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatPrice(total).replace("R$ ", "")}
                      </div>
                    )}

                    <div
                      style={{
                        position: "absolute",
                        bottom: -22,
                        fontSize: 9,
                        color: "#7a7a72",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {day.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}

function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: string;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e0e0dc",
        borderRadius: 8,
        padding: 20,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#7a7a72",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          color,
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ==========================================
// ABA: PEDIDOS
// ==========================================

function PedidosTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodType>("thisMonth");
  const [searchTerm, setSearchTerm] = useState("");

  async function loadOrders() {
    setIsLoading(true);

    const { start, end } = getPeriodDates(period);

    let query = supabase
      .from("orders")
      .select(`*, order_items:order_items(*)`)
      .eq("payment_status", "paid")
      .order("created_at", { ascending: false });

    if (start) query = query.gte("created_at", start.toISOString());
    query = query.lte("created_at", end.toISOString());

    const { data, error } = await query;

    if (error) {
      console.error("Erro:", error);
      setOrders([]);
    } else {
      setOrders(data ?? []);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadOrders();
  }, [period]);

  const filtered = orders.filter((o) => {
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      return (
        o.customer_name.toLowerCase().includes(search) ||
        o.customer_email.toLowerCase().includes(search) ||
        String(o.id).includes(search)
      );
    }
    return true;
  });

  function exportCSV() {
    const headers = [
      "Data",
      "Pedido",
      "Cliente",
      "Telefone",
      "Email",
      "Itens",
      "Forma de pagamento",
      "Valor total",
      "Status",
    ];

    const rows = filtered.map((o) => {
      const items = (o.order_items || [])
        .map((item) => `${item.quantity}x ${item.product_name}`)
        .join(" | ");

      return [
        formatDateTime(o.created_at),
        `#${o.id}`,
        o.customer_name,
        o.customer_phone,
        o.customer_email,
        items,
        PAYMENT_LABELS[o.payment_method] || o.payment_method,
        formatPrice(o.total),
        STATUS_LABELS[o.order_status] || o.order_status,
      ];
    });

    downloadCSV(headers, rows, "flower-pedidos.csv");
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as PeriodType)}
          style={selectStyle}
        >
          {Object.entries(PERIOD_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por cliente ou #pedido..."
          style={inputStyle}
        />

        <button type="button" onClick={exportCSV} style={exportBtnStyle}>
          📄 Exportar CSV
        </button>
      </div>

      <div style={tableWrapperStyle}>
        {isLoading ? (
          <div style={emptyStyle}>Carregando pedidos...</div>
        ) : filtered.length === 0 ? (
          <div style={emptyStyle}>Nenhum pedido encontrado.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f9f9f7" }}>
                <th style={thStyle}>Data</th>
                <th style={thStyle}>#</th>
                <th style={thStyle}>Cliente</th>
                <th style={thStyle}>Itens</th>
                <th style={thStyle}>Pagamento</th>
                <th style={thStyle}>Total</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} style={{ borderTop: "1px solid #f0f0ec" }}>
                  <td style={tdStyle}>{formatDateTime(o.created_at)}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>#{o.id}</td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 500 }}>{o.customer_name}</div>
                    <div style={{ fontSize: 11, color: "#7a7a72" }}>
                      {o.customer_email}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, fontSize: 12, color: "#7a7a72" }}>
                    {(o.order_items || []).map((item) => (
                      <div key={item.id}>
                        {item.quantity}x {item.product_name}
                      </div>
                    ))}
                  </td>
                  <td style={tdStyle}>
                    {PAYMENT_LABELS[o.payment_method] || o.payment_method}
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: "#166534" }}>
                    {formatPrice(o.total)}
                  </td>
                  <td style={tdStyle}>
                    <StatusBadge status={o.order_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

// ==========================================
// ABA: ASSINATURAS
// ==========================================

function AssinaturasTab() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodType>("thisMonth");
  const [searchTerm, setSearchTerm] = useState("");

  async function loadSubscriptions() {
    setIsLoading(true);

    const { start, end } = getPeriodDates(period);

    let query = supabase
      .from("subscription_orders")
      .select("*")
      .eq("payment_status", "paid")
      .order("last_payment_at", { ascending: false });

    if (start) query = query.gte("last_payment_at", start.toISOString());
    query = query.lte("last_payment_at", end.toISOString());

    const { data, error } = await query;

    if (error) {
      console.error("Erro:", error);
      setSubscriptions([]);
    } else {
      setSubscriptions(data ?? []);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadSubscriptions();
  }, [period]);

  const filtered = subscriptions.filter((s) => {
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      return (
        s.customer_name.toLowerCase().includes(search) ||
        s.customer_email.toLowerCase().includes(search)
      );
    }
    return true;
  });

  function exportCSV() {
    const headers = [
      "Cliente",
      "Telefone",
      "Email",
      "Plano",
      "Frequência",
      "Último pagamento",
      "Valor",
      "Próxima renovação",
      "Forma de pagamento",
    ];

    const rows = filtered.map((s) => [
      s.customer_name,
      s.customer_phone,
      s.customer_email,
      s.plan_name,
      s.plan_frequency,
      formatDateTime(s.last_payment_at),
      formatPrice(s.plan_price),
      formatDate(s.next_renewal_at),
      PAYMENT_LABELS[s.payment_method] || s.payment_method,
    ]);

    downloadCSV(headers, rows, "flower-assinaturas.csv");
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as PeriodType)}
          style={selectStyle}
        >
          {Object.entries(PERIOD_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por cliente..."
          style={inputStyle}
        />

        <button type="button" onClick={exportCSV} style={exportBtnStyle}>
          📄 Exportar CSV
        </button>
      </div>

      <div style={tableWrapperStyle}>
        {isLoading ? (
          <div style={emptyStyle}>Carregando assinaturas...</div>
        ) : filtered.length === 0 ? (
          <div style={emptyStyle}>Nenhuma assinatura encontrada.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f9f9f7" }}>
                <th style={thStyle}>Cliente</th>
                <th style={thStyle}>Plano</th>
                <th style={thStyle}>Frequência</th>
                <th style={thStyle}>Último pagamento</th>
                <th style={thStyle}>Valor</th>
                <th style={thStyle}>Próxima renovação</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} style={{ borderTop: "1px solid #f0f0ec" }}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 500 }}>{s.customer_name}</div>
                    <div style={{ fontSize: 11, color: "#7a7a72" }}>
                      {s.customer_email}
                    </div>
                  </td>
                  <td style={tdStyle}>{s.plan_name}</td>
                  <td style={tdStyle}>{s.plan_frequency}</td>
                  <td style={tdStyle}>{formatDateTime(s.last_payment_at)}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: "#166534" }}>
                    {formatPrice(s.plan_price)}
                  </td>
                  <td style={{ ...tdStyle, color: "#7a7a72" }}>
                    {formatDate(s.next_renewal_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

// ==========================================
// COMPONENTES AUXILIARES
// ==========================================

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    delivered: { bg: "#dcfce7", color: "#166534" },
    confirmed: { bg: "#dbeafe", color: "#1e40af" },
    pending: { bg: "#fef3c7", color: "#854d0e" },
    cancelled: { bg: "#fee2e2", color: "#991b1b" },
    rejected: { bg: "#fee2e2", color: "#991b1b" },
  };

  const c = colors[status] || { bg: "#f3f4f6", color: "#6b7280" };

  return (
    <span
      style={{
        padding: "3px 8px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        background: c.bg,
        color: c.color,
      }}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function downloadCSV(headers: string[], rows: string[][], filename: string) {
  const escapeCSV = (value: string) => {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const csv = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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

const inputStyle: React.CSSProperties = {
  height: 38,
  padding: "0 12px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 13,
  outline: "none",
  minWidth: 240,
};

const exportBtnStyle: React.CSSProperties = {
  height: 38,
  padding: "0 16px",
  background: "#166534",
  color: "#fff",
  border: 0,
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const thStyle: React.CSSProperties = {
  padding: "12px 16px",
  textAlign: "left",
  fontSize: 11,
  fontWeight: 600,
  color: "#7a7a72",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 16px",
  color: "#2f2a26",
};

const tableWrapperStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e0e0dc",
  borderRadius: 8,
  overflow: "auto",
};

const emptyStyle: React.CSSProperties = {
  padding: 40,
  textAlign: "center",
  color: "#7a7a72",
  fontSize: 13,
};