"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type SubscriptionOrder = {
  id: number;
  user_id: string | null;
  plan_name: string;
  plan_frequency: string;
  plan_price: number;
  deliveries_per_month: number;
  delivery_day: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  delivery_method: string;
  cep: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  payment_method: string;
  payment_status: string;
  payment_id: string | null;
  created_at: string;
  updated_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  paid: "Pago",
  pending: "Pendente",
  cancelled: "Cancelado",
  rejected: "Recusado",
};

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  paid: { bg: "#dcfce7", color: "#166534" },
  pending: { bg: "#fef3c7", color: "#854d0e" },
  cancelled: { bg: "#fee2e2", color: "#991b1b" },
  rejected: { bg: "#fee2e2", color: "#991b1b" },
};

export default function AdminAssinaturasPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSubscription, setSelectedSubscription] =
    useState<SubscriptionOrder | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // ==========================================
  // CARREGA ASSINATURAS
  // ==========================================

  async function loadSubscriptions() {
    setIsLoading(true);

    const { data, error } = await supabase
      .from("subscription_orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar assinaturas:", error);
      setSubscriptions([]);
    } else {
      setSubscriptions(data ?? []);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadSubscriptions();
  }, []);

  // ==========================================
  // FILTRO
  // ==========================================

  const filtered = subscriptions.filter((sub) => {
    // Filtro de status
    if (statusFilter !== "all" && sub.payment_status !== statusFilter) {
      return false;
    }

    // Busca por nome ou email
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      const matchesName = sub.customer_name.toLowerCase().includes(search);
      const matchesEmail = sub.customer_email.toLowerCase().includes(search);
      if (!matchesName && !matchesEmail) return false;
    }

    return true;
  });

  // ==========================================
  // MARCAR COMO PAGO
  // ==========================================

  async function markAsPaid(id: number) {
    if (!confirm("Marcar essa assinatura como PAGA?")) return;

    setIsUpdating(true);

    const { error } = await supabase
      .from("subscription_orders")
      .update({
        payment_status: "paid",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    setIsUpdating(false);

    if (error) {
      alert("Erro ao atualizar: " + error.message);
      return;
    }

    // Atualiza a lista
    setSubscriptions((current) =>
      current.map((sub) =>
        sub.id === id ? { ...sub, payment_status: "paid" } : sub
      )
    );

    // Atualiza o painel aberto
    if (selectedSubscription?.id === id) {
      setSelectedSubscription((current) =>
        current ? { ...current, payment_status: "paid" } : null
      );
    }
  }

  // ==========================================
  // FORMATAR PREÇO
  // ==========================================

  function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  // ==========================================
  // FORMATAR DATA
  // ==========================================

  function formatDate(value: string) {
    const date = new Date(value);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // ==========================================
  // CALCULAR PRÓXIMA ENTREGA
  // ==========================================

  function getNextDelivery(sub: SubscriptionOrder): string {
    const now = new Date();
    const created = new Date(sub.created_at);

    // Baseado no dia da semana
    const targetDay = sub.delivery_day === "saturday" ? 6 : 0;

    // Próxima data no dia escolhido
    const next = new Date(now);
    const currentDay = next.getDay();
    let daysToAdd = (targetDay - currentDay + 7) % 7;
    if (daysToAdd === 0) daysToAdd = 7; // Sempre a próxima, não a de hoje
    next.setDate(next.getDate() + daysToAdd);

    return next.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
    });
  }

  // ==========================================
  // FREQUÊNCIA EM PORTUGUÊS
  // ==========================================

  function formatFrequency(freq: string) {
    const map: Record<string, string> = {
      weekly: "Semanal",
      biweekly: "Quinzenal",
      monthly: "Mensal",
    };
    return map[freq] || freq;
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
            Assinaturas
          </h1>
          <p style={{ margin: 0, color: "#7a7a72", fontSize: 13 }}>
            {filtered.length}{" "}
            {filtered.length === 1 ? "assinatura" : "assinaturas"}
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {/* BUSCA */}
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou email..."
            style={{
              height: 38,
              padding: "0 12px",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: 13,
              outline: "none",
              minWidth: 260,
            }}
          />

          {/* FILTRO STATUS */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              height: 38,
              padding: "0 12px",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: 13,
              outline: "none",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            <option value="all">Todos os status</option>
            <option value="paid">Pago</option>
            <option value="pending">Pendente</option>
            <option value="cancelled">Cancelado</option>
            <option value="rejected">Recusado</option>
          </select>

          {/* RECARREGAR */}
          <button
            type="button"
            onClick={loadSubscriptions}
            disabled={isLoading}
            style={{
              height: 38,
              padding: "0 14px",
              background: "#fff",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: 13,
              cursor: isLoading ? "wait" : "pointer",
            }}
          >
            {isLoading ? "..." : "↻"}
          </button>
        </div>
      </div>

      {/* TABELA */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e0e0dc",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        {isLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#7a7a72" }}>
            Carregando assinaturas...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#7a7a72" }}>
            Nenhuma assinatura encontrada.
          </div>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
            }}
          >
            <thead>
              <tr style={{ background: "#f9f9f7" }}>
                <th style={thStyle}>Cliente</th>
                <th style={thStyle}>Plano</th>
                <th style={thStyle}>Frequência</th>
                <th style={thStyle}>Dia</th>
                <th style={thStyle}>Valor</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Próxima entrega</th>
                <th style={thStyle}>Criado em</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sub) => {
                const statusStyle =
                  STATUS_COLOR[sub.payment_status] || STATUS_COLOR.pending;

                return (
                  <tr
                    key={sub.id}
                    onClick={() => setSelectedSubscription(sub)}
                    style={{
                      borderTop: "1px solid #f0f0ec",
                      cursor: "pointer",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f9f9f7")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500 }}>
                        {sub.customer_name}
                      </div>
                      <div style={{ fontSize: 11, color: "#7a7a72" }}>
                        {sub.customer_email}
                      </div>
                    </td>
                    <td style={tdStyle}>{sub.plan_name}</td>
                    <td style={tdStyle}>
                      {formatFrequency(sub.plan_frequency)}
                    </td>
                    <td style={tdStyle}>
                      {sub.delivery_day === "saturday" ? "Sábado" : "Domingo"}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>
                      {formatPrice(sub.plan_price)}
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          background: statusStyle.bg,
                          color: statusStyle.color,
                        }}
                      >
                        {STATUS_LABEL[sub.payment_status] ||
                          sub.payment_status}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: "#7a7a72" }}>
                      {getNextDelivery(sub)}
                    </td>
                    <td style={{ ...tdStyle, color: "#7a7a72", fontSize: 12 }}>
                      {formatDate(sub.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* PAINEL LATERAL — DETALHES */}
      {selectedSubscription && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setSelectedSubscription(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.3)",
              zIndex: 40,
            }}
          />

          {/* Painel */}
          <aside
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "min(480px, 100%)",
              background: "#fff",
              zIndex: 50,
              overflowY: "auto",
              boxShadow: "-4px 0 24px rgba(0,0,0,0.1)",
            }}
          >
            {/* Header */}
            <div
              style={{
                position: "sticky",
                top: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 24px",
                background: "#2f2a26",
                color: "#fff",
                zIndex: 1,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                Assinatura #{selectedSubscription.id}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedSubscription(null)}
                style={{
                  background: "transparent",
                  border: 0,
                  color: "#fff",
                  fontSize: 24,
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {/* Conteúdo */}
            <div style={{ padding: 24 }}>
              {/* Status + ações */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 24,
                  padding: 16,
                  background: "#f9f9f7",
                  borderRadius: 8,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#7a7a72",
                      marginBottom: 4,
                    }}
                  >
                    STATUS
                  </div>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      background:
                        STATUS_COLOR[selectedSubscription.payment_status]
                          ?.bg || "#fef3c7",
                      color:
                        STATUS_COLOR[selectedSubscription.payment_status]
                          ?.color || "#854d0e",
                    }}
                  >
                    {STATUS_LABEL[selectedSubscription.payment_status] ||
                      selectedSubscription.payment_status}
                  </span>
                </div>

                {selectedSubscription.payment_status !== "paid" && (
                  <button
                    type="button"
                    onClick={() => markAsPaid(selectedSubscription.id)}
                    disabled={isUpdating}
                    style={{
                      padding: "8px 16px",
                      background: "#166534",
                      color: "#fff",
                      border: 0,
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: isUpdating ? "wait" : "pointer",
                    }}
                  >
                    {isUpdating ? "..." : "Marcar como pago"}
                  </button>
                )}
              </div>

              {/* Cliente */}
              <Section title="Cliente">
                <Field label="Nome" value={selectedSubscription.customer_name} />
                <Field
                  label="Email"
                  value={selectedSubscription.customer_email}
                />
                <Field
                  label="Telefone"
                  value={selectedSubscription.customer_phone}
                />
              </Section>

              {/* Plano */}
              <Section title="Plano">
                <Field label="Nome" value={selectedSubscription.plan_name} />
                <Field
                  label="Frequência"
                  value={formatFrequency(selectedSubscription.plan_frequency)}
                />
                <Field
                  label="Entregas por mês"
                  value={String(selectedSubscription.deliveries_per_month)}
                />
                <Field
                  label="Dia da entrega"
                  value={
                    selectedSubscription.delivery_day === "saturday"
                      ? "Sábado"
                      : "Domingo"
                  }
                />
                <Field
                  label="Valor"
                  value={formatPrice(selectedSubscription.plan_price)}
                />
              </Section>

              {/* Pagamento */}
              <Section title="Pagamento">
                <Field
                  label="Método"
                  value={selectedSubscription.payment_method}
                />
                {selectedSubscription.payment_id && (
                  <Field
                    label="ID do pagamento"
                    value={selectedSubscription.payment_id}
                  />
                )}
              </Section>

              {/* Entrega */}
              {selectedSubscription.delivery_method === "delivery" && (
                <Section title="Endereço de entrega">
                  <Field
                    label="CEP"
                    value={selectedSubscription.cep || "—"}
                  />
                  <Field
                    label="Rua"
                    value={selectedSubscription.street || "—"}
                  />
                  <Field
                    label="Número"
                    value={selectedSubscription.number || "—"}
                  />
                  {selectedSubscription.complement && (
                    <Field
                      label="Complemento"
                      value={selectedSubscription.complement}
                    />
                  )}
                  <Field
                    label="Bairro"
                    value={selectedSubscription.neighborhood || "—"}
                  />
                  <Field
                    label="Cidade"
                    value={`${selectedSubscription.city || "—"} ${
                      selectedSubscription.state
                        ? `/ ${selectedSubscription.state}`
                        : ""
                    }`}
                  />
                </Section>
              )}

              {selectedSubscription.delivery_method === "pickup" && (
                <Section title="Entrega">
                  <Field label="Método" value="Retirada no ateliê" />
                </Section>
              )}

              {/* Datas */}
              <Section title="Histórico">
                <Field
                  label="Criado em"
                  value={formatDate(selectedSubscription.created_at)}
                />
                <Field
                  label="Atualizado em"
                  value={formatDate(selectedSubscription.updated_at)}
                />
                <Field
                  label="Próxima entrega"
                  value={getNextDelivery(selectedSubscription)}
                />
              </Section>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

// ==========================================
// COMPONENTES AUXILIARES
// ==========================================

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
  padding: "14px 16px",
  color: "#2f2a26",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3
        style={{
          margin: "0 0 12px",
          fontSize: 11,
          fontWeight: 700,
          color: "#7a7a72",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {title}
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
      <span style={{ fontSize: 13, color: "#7a7a72" }}>{label}</span>
      <span
        style={{
          fontSize: 13,
          color: "#2f2a26",
          fontWeight: 500,
          textAlign: "right",
          wordBreak: "break-word",
        }}
      >
        {value}
      </span>
    </div>
  );
}