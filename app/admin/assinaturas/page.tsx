"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// ==========================================
// TIPOS
// ==========================================

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
  last_payment_at: string | null;
  next_renewal_at: string | null;
  created_at: string;
  updated_at: string;
};

type TabType = "vencendo" | "recentes" | "controle";

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

const FREQUENCY_LABEL: Record<string, string> = {
  weekly: "Semanal",
  biweekly: "Quinzenal",
  monthly: "Mensal",
};

function buildWhatsAppMessage(name: string) {
  return `Olá, ${name}! 🌸

Sua assinatura FLOWER em Casa está perto de vencer.

Acesse o site e renove pra continuar recebendo suas flores frescas:

www.flowerprops.com.br/assinaturas

Qualquer dúvida, é só chamar! 💐`;
}

// ==========================================
// PÁGINA
// ==========================================

export default function AdminAssinaturasPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("vencendo");
  const [selectedSubscription, setSelectedSubscription] =
    useState<SubscriptionOrder | null>(null);

  // Filtros da sub-aba Controle
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [frequencyFilter, setFrequencyFilter] = useState<string>("all");

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
  // CÁLCULOS
  // ==========================================

  function getDaysUntilRenewal(sub: SubscriptionOrder): number | null {
    if (!sub.next_renewal_at) return null;
    const now = new Date();
    const renewal = new Date(sub.next_renewal_at);
    return Math.ceil(
      (renewal.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  function isExpiringSoon(sub: SubscriptionOrder): boolean {
    const days = getDaysUntilRenewal(sub);
    return days !== null && days >= 0 && days <= 7;
  }

  function isRecentlyRenewed(sub: SubscriptionOrder): boolean {
    if (!sub.last_payment_at) return false;
    const now = new Date();
    const last = new Date(sub.last_payment_at);
    const diffDays =
      (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 30;
  }

  // ==========================================
  // LISTAS
  // ==========================================

  const expiringSoon = subscriptions
    .filter(isExpiringSoon)
    .sort((a, b) => {
      const dA = getDaysUntilRenewal(a) ?? 999;
      const dB = getDaysUntilRenewal(b) ?? 999;
      return dA - dB;
    });

  const recentlyRenewed = subscriptions
    .filter((s) => isRecentlyRenewed(s) && !isExpiringSoon(s))
    .sort((a, b) => {
      const dA = new Date(a.last_payment_at!).getTime();
      const dB = new Date(b.last_payment_at!).getTime();
      return dB - dA;
    });

  const filtered = subscriptions.filter((sub) => {
    if (statusFilter !== "all" && sub.payment_status !== statusFilter)
      return false;
    if (
      frequencyFilter !== "all" &&
      sub.plan_frequency !== frequencyFilter
    )
      return false;

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      const matchesName = sub.customer_name.toLowerCase().includes(search);
      const matchesEmail = sub.customer_email.toLowerCase().includes(search);
      if (!matchesName && !matchesEmail) return false;
    }

    return true;
  });

  // ==========================================
  // HELPERS
  // ==========================================

  function getWhatsAppLink(phone: string, name: string) {
    const digits = phone.replace(/\D/g, "");
    const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
    const message = encodeURIComponent(buildWhatsAppMessage(name));
    return `https://wa.me/${withCountry}?text=${message}`;
  }

  function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatDate(value: string | null) {
    if (!value) return "—";
    const date = new Date(value);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatFrequency(freq: string) {
    return FREQUENCY_LABEL[freq] || freq;
  }

  function exportCSV() {
    const headers = [
      "Cliente",
      "Email",
      "Telefone",
      "Plano",
      "Frequência",
      "Valor",
      "Último pagamento",
      "Próxima renovação",
      "Status",
    ];

    const rows = filtered.map((s) => [
      s.customer_name,
      s.customer_email,
      s.customer_phone,
      s.plan_name,
      formatFrequency(s.plan_frequency),
      formatPrice(s.plan_price),
      formatDate(s.last_payment_at),
      formatDate(s.next_renewal_at),
      STATUS_LABEL[s.payment_status] || s.payment_status,
    ]);

    downloadCSV(headers, rows, "flower-assinaturas.csv");
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
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
        <p style={{ margin: "0 0 16px", color: "#7a7a72", fontSize: 13 }}>
          {subscriptions.length}{" "}
          {subscriptions.length === 1 ? "assinatura" : "assinaturas"} no total
        </p>

        <div
          style={{
            display: "flex",
            gap: 4,
            borderBottom: "1px solid #e0e0dc",
          }}
        >
          <SubTab
            active={activeTab === "vencendo"}
            onClick={() => setActiveTab("vencendo")}
            count={expiringSoon.length}
            countColor="#dc2626"
          >
            🔴 Vencendo
          </SubTab>
          <SubTab
            active={activeTab === "recentes"}
            onClick={() => setActiveTab("recentes")}
            count={recentlyRenewed.length}
            countColor="#16a34a"
          >
            🟢 Recentes
          </SubTab>
          <SubTab
            active={activeTab === "controle"}
            onClick={() => setActiveTab("controle")}
            count={subscriptions.length}
            countColor="#2f2a26"
          >
            📋 Controle
          </SubTab>
        </div>
      </div>

      {isLoading ? (
        <div style={emptyStyle}>Carregando assinaturas...</div>
      ) : (
        <>
          {activeTab === "vencendo" && (
            <VencendoTab
              subscriptions={expiringSoon}
              onSelect={setSelectedSubscription}
              getDaysUntilRenewal={getDaysUntilRenewal}
              getWhatsAppLink={getWhatsAppLink}
              formatPrice={formatPrice}
              formatFrequency={formatFrequency}
              formatDate={formatDate}
            />
          )}

          {activeTab === "recentes" && (
            <RecentesTab
              subscriptions={recentlyRenewed}
              onSelect={setSelectedSubscription}
              formatPrice={formatPrice}
              formatFrequency={formatFrequency}
              formatDate={formatDate}
            />
          )}

          {activeTab === "controle" && (
            <ControleTab
              subscriptions={filtered}
              totalCount={subscriptions.length}
              onSelect={setSelectedSubscription}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              frequencyFilter={frequencyFilter}
              setFrequencyFilter={setFrequencyFilter}
              onExportCSV={exportCSV}
              onReload={loadSubscriptions}
              formatPrice={formatPrice}
              formatFrequency={formatFrequency}
              formatDate={formatDate}
            />
          )}
        </>
      )}

      {selectedSubscription && (
        <SubscriptionDetailPanel
          subscription={selectedSubscription}
          onClose={() => setSelectedSubscription(null)}
          getWhatsAppLink={getWhatsAppLink}
          formatDate={formatDate}
          formatPrice={formatPrice}
          formatFrequency={formatFrequency}
          getDaysUntilRenewal={getDaysUntilRenewal}
        />
      )}
    </div>
  );
}

// ==========================================
// SUB-ABA
// ==========================================

function SubTab({
  active,
  onClick,
  count,
  countColor,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  countColor: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
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
      <span
        style={{
          padding: "1px 7px",
          borderRadius: 10,
          fontSize: 10,
          fontWeight: 700,
          background: countColor,
          color: "#fff",
        }}
      >
        {count}
      </span>
    </button>
  );
}

// ==========================================
// SUB-ABA: VENCENDO
// ==========================================

function VencendoTab({
  subscriptions,
  onSelect,
  getDaysUntilRenewal,
  getWhatsAppLink,
  formatPrice,
  formatFrequency,
  formatDate,
}: {
  subscriptions: SubscriptionOrder[];
  onSelect: (s: SubscriptionOrder) => void;
  getDaysUntilRenewal: (s: SubscriptionOrder) => number | null;
  getWhatsAppLink: (phone: string, name: string) => string;
  formatPrice: (v: number) => string;
  formatFrequency: (f: string) => string;
  formatDate: (v: string | null) => string;
}) {
  if (subscriptions.length === 0) {
    return (
      <div style={emptyStyle}>
        ✅ Nenhuma assinatura vencendo nos próximos 7 dias.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {subscriptions.map((sub) => {
        const days = getDaysUntilRenewal(sub) ?? 0;
        const urgency = days <= 3 ? "#dc2626" : "#f59e0b";

        return (
          <div
            key={sub.id}
            style={{
              background: "#fff",
              border: `2px solid ${urgency}`,
              borderRadius: 8,
              padding: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{ flex: 1, minWidth: 200, cursor: "pointer" }}
              onClick={() => onSelect(sub)}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#2f2a26",
                }}
              >
                {sub.customer_name}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#7a7a72",
                  marginTop: 2,
                }}
              >
                {sub.plan_name} · {formatFrequency(sub.plan_frequency)} ·{" "}
                {formatPrice(sub.plan_price)}
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: urgency,
                }}
              >
                {days} {days === 1 ? "dia" : "dias"}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "#7a7a72",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Vence {formatDate(sub.next_renewal_at)}
              </div>
            </div>

            <a
              href={getWhatsAppLink(sub.customer_phone, sub.customer_name)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "10px 20px",
                background: "#25D366",
                color: "#fff",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              💬 Cobrar renovação
            </a>
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// SUB-ABA: RECENTES
// ==========================================

function RecentesTab({
  subscriptions,
  onSelect,
  formatPrice,
  formatFrequency,
  formatDate,
}: {
  subscriptions: SubscriptionOrder[];
  onSelect: (s: SubscriptionOrder) => void;
  formatPrice: (v: number) => string;
  formatFrequency: (f: string) => string;
  formatDate: (v: string | null) => string;
}) {
  if (subscriptions.length === 0) {
    return (
      <div style={emptyStyle}>
        Nenhuma assinatura renovada nos últimos 30 dias.
      </div>
    );
  }

  return (
    <div style={tableWrapperStyle}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#f9f9f7" }}>
            <th style={thStyle}>Cliente</th>
            <th style={thStyle}>Plano</th>
            <th style={thStyle}>Valor</th>
            <th style={thStyle}>Último pagamento</th>
            <th style={thStyle}>Próxima renovação</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map((sub) => (
            <tr
              key={sub.id}
              onClick={() => onSelect(sub)}
              style={{
                borderTop: "1px solid #f0f0ec",
                cursor: "pointer",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#f9f9f7")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <td style={tdStyle}>
                <div style={{ fontWeight: 500 }}>{sub.customer_name}</div>
                <div style={{ fontSize: 11, color: "#7a7a72" }}>
                  {sub.customer_email}
                </div>
              </td>
              <td style={tdStyle}>
                {sub.plan_name} · {formatFrequency(sub.plan_frequency)}
              </td>
              <td style={tdStyle}>{formatPrice(sub.plan_price)}</td>
              <td style={{ ...tdStyle, color: "#166534", fontWeight: 600 }}>
                {formatDate(sub.last_payment_at)}
              </td>
              <td style={{ ...tdStyle, color: "#7a7a72" }}>
                {formatDate(sub.next_renewal_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ==========================================
// SUB-ABA: CONTROLE
// ==========================================

function ControleTab({
  subscriptions,
  totalCount,
  onSelect,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  frequencyFilter,
  setFrequencyFilter,
  onExportCSV,
  onReload,
  formatPrice,
  formatFrequency,
  formatDate,
}: {
  subscriptions: SubscriptionOrder[];
  totalCount: number;
  onSelect: (s: SubscriptionOrder) => void;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  frequencyFilter: string;
  setFrequencyFilter: (v: string) => void;
  onExportCSV: () => void;
  onReload: () => void;
  formatPrice: (v: number) => string;
  formatFrequency: (f: string) => string;
  formatDate: (v: string | null) => string;
}) {
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
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nome ou email..."
          style={inputStyle}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={selectStyle}
        >
          <option value="all">Todos os status</option>
          <option value="paid">Pago</option>
          <option value="pending">Pendente</option>
          <option value="cancelled">Cancelado</option>
          <option value="rejected">Recusado</option>
        </select>

        <select
          value={frequencyFilter}
          onChange={(e) => setFrequencyFilter(e.target.value)}
          style={selectStyle}
        >
          <option value="all">Todas as frequências</option>
          <option value="weekly">Semanal</option>
          <option value="biweekly">Quinzenal</option>
          <option value="monthly">Mensal</option>
        </select>

        <button type="button" onClick={onReload} style={refreshBtnStyle}>
          ↻
        </button>

        <button type="button" onClick={onExportCSV} style={exportBtnStyle}>
          📄 Exportar CSV
        </button>
      </div>

      <p
        style={{
          margin: "0 0 12px",
          fontSize: 12,
          color: "#7a7a72",
        }}
      >
        Mostrando {subscriptions.length} de {totalCount}{" "}
        {totalCount === 1 ? "assinatura" : "assinaturas"}
      </p>

      <div style={tableWrapperStyle}>
        {subscriptions.length === 0 ? (
          <div style={emptyStyle}>Nenhuma assinatura encontrada.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f9f9f7" }}>
                <th style={thStyle}>Cliente</th>
                <th style={thStyle}>Plano</th>
                <th style={thStyle}>Valor</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Renovação</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => {
                const statusStyle =
                  STATUS_COLOR[sub.payment_status] || STATUS_COLOR.pending;

                return (
                  <tr
                    key={sub.id}
                    onClick={() => onSelect(sub)}
                    style={{
                      borderTop: "1px solid #f0f0ec",
                      cursor: "pointer",
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
                    <td style={tdStyle}>
                      {sub.plan_name} · {formatFrequency(sub.plan_frequency)}
                    </td>
                    <td style={tdStyle}>{formatPrice(sub.plan_price)}</td>
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
                      {sub.next_renewal_at
                        ? formatDate(sub.next_renewal_at)
                        : "—"}
                    </td>
                    <td style={{ ...tdStyle, color: "#9ca3af" }}>→</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

// ==========================================
// PAINEL DE DETALHES
// ==========================================

function SubscriptionDetailPanel({
  subscription,
  onClose,
  getWhatsAppLink,
  formatDate,
  formatPrice,
  formatFrequency,
  getDaysUntilRenewal,
}: {
  subscription: SubscriptionOrder;
  onClose: () => void;
  getWhatsAppLink: (phone: string, name: string) => string;
  formatDate: (v: string | null) => string;
  formatPrice: (v: number) => string;
  formatFrequency: (v: string) => string;
  getDaysUntilRenewal: (s: SubscriptionOrder) => number | null;
}) {
  const daysUntilRenewal = getDaysUntilRenewal(subscription);

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.3)",
          zIndex: 40,
        }}
      />

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
            Assinatura #{subscription.id}
          </h2>
          <button
            type="button"
            onClick={onClose}
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

        <div style={{ padding: 24 }}>
          <div
            style={{
              marginBottom: 24,
              padding: 16,
              background: "#f9f9f7",
              borderRadius: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: "#7a7a72", marginBottom: 4 }}>
                  STATUS
                </div>
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    background:
                      STATUS_COLOR[subscription.payment_status]?.bg ||
                      "#fef3c7",
                    color:
                      STATUS_COLOR[subscription.payment_status]?.color ||
                      "#854d0e",
                  }}
                >
                  {STATUS_LABEL[subscription.payment_status] ||
                    subscription.payment_status}
                </span>
              </div>

              {daysUntilRenewal !== null && (
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#7a7a72",
                      marginBottom: 4,
                    }}
                  >
                    RENOVA EM
                  </div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color:
                        daysUntilRenewal <= 3
                          ? "#dc2626"
                          : daysUntilRenewal <= 7
                          ? "#f59e0b"
                          : "#166534",
                    }}
                  >
                    {daysUntilRenewal}{" "}
                    {daysUntilRenewal === 1 ? "dia" : "dias"}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#7a7a72",
                      marginTop: 2,
                    }}
                  >
                    {formatDate(subscription.next_renewal_at)}
                  </div>
                </div>
              )}
            </div>

            {daysUntilRenewal !== null && daysUntilRenewal <= 7 && (
              <a
                href={getWhatsAppLink(
                  subscription.customer_phone,
                  subscription.customer_name
                )}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  width: "100%",
                  padding: "12px 16px",
                  background: "#25D366",
                  color: "#fff",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none",
                  marginTop: 8,
                }}
              >
                💬 Cobrar renovação via WhatsApp
              </a>
            )}
          </div>

          <Section title="Contato">
            <Field label="Nome" value={subscription.customer_name} />
            <Field
              label="Email"
              value={subscription.customer_email}
              link={`mailto:${subscription.customer_email}`}
            />
            <Field
              label="Telefone"
              value={subscription.customer_phone}
              link={`tel:${subscription.customer_phone.replace(/\D/g, "")}`}
            />
          </Section>

          <Section title="Plano">
            <Field label="Nome" value={subscription.plan_name} />
            <Field
              label="Frequência"
              value={formatFrequency(subscription.plan_frequency)}
            />
            <Field
              label="Entregas por mês"
              value={String(subscription.deliveries_per_month)}
            />
            <Field
              label="Dia da entrega"
              value={
                subscription.delivery_day === "saturday" ? "Sábado" : "Domingo"
              }
            />
            <Field label="Valor" value={formatPrice(subscription.plan_price)} />
          </Section>

          <Section title="Pagamento">
            <Field label="Método" value={subscription.payment_method} />
            <Field
              label="Último pagamento"
              value={formatDate(subscription.last_payment_at)}
            />
            <Field
              label="Próxima renovação"
              value={formatDate(subscription.next_renewal_at)}
            />
            {subscription.payment_id && (
              <Field label="ID do pagamento" value={subscription.payment_id} />
            )}
          </Section>

          {subscription.delivery_method === "delivery" && (
            <Section title="Endereço de entrega">
              {subscription.cep && <Field label="CEP" value={subscription.cep} />}
              {subscription.street && (
                <Field label="Rua" value={subscription.street} />
              )}
              {subscription.number && (
                <Field label="Número" value={subscription.number} />
              )}
              {subscription.complement && (
                <Field label="Complemento" value={subscription.complement} />
              )}
              {subscription.neighborhood && (
                <Field label="Bairro" value={subscription.neighborhood} />
              )}
              {subscription.city && (
                <Field label="Cidade" value={subscription.city} />
              )}
              {subscription.state && (
                <Field label="Estado" value={subscription.state} />
              )}
            </Section>
          )}

          {subscription.delivery_method === "pickup" && (
            <Section title="Entrega">
              <Field label="Método" value="Retirada no ateliê" />
            </Section>
          )}
        </div>
      </aside>
    </>
  );
}

// ==========================================
// AUXILIARES
// ==========================================

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

const inputStyle: React.CSSProperties = {
  height: 38,
  padding: "0 12px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 13,
  outline: "none",
  minWidth: 220,
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
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
  background: "#fff",
  border: "1px solid #e0e0dc",
  borderRadius: 8,
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

function Field({
  label,
  value,
  link,
}: {
  label: string;
  value: string;
  link?: string;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
      <span style={{ fontSize: 13, color: "#7a7a72", flexShrink: 0 }}>
        {label}
      </span>
      {link ? (
        <a
          href={link}
          target={link.startsWith("http") ? "_blank" : undefined}
          rel={link.startsWith("http") ? "noopener noreferrer" : undefined}
          style={{
            fontSize: 13,
            color: "#2563eb",
            fontWeight: 500,
            textAlign: "right",
            wordBreak: "break-word",
            textDecoration: "none",
          }}
        >
          {value}
        </a>
      ) : (
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
      )}
    </div>
  );
}