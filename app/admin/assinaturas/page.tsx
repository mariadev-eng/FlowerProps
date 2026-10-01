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

// WhatsApp template
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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSubscription, setSelectedSubscription] =
    useState<SubscriptionOrder | null>(null);

  // ==========================================
  // CARREGA
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
  // CÁLCULOS DE VENCIMENTO
  // ==========================================

  function getDaysUntilRenewal(sub: SubscriptionOrder): number | null {
    if (!sub.next_renewal_at) return null;
    const now = new Date();
    const renewal = new Date(sub.next_renewal_at);
    const diffMs = renewal.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  function isExpiringSoon(sub: SubscriptionOrder): boolean {
    const days = getDaysUntilRenewal(sub);
    if (days === null) return false;
    return days >= 0 && days <= 7;
  }

  function isRenewedRecently(sub: SubscriptionOrder): boolean {
    if (!sub.last_payment_at) return false;
    const now = new Date();
    const last = new Date(sub.last_payment_at);
    const diffDays =
      (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 30 && diffDays >= 0;
  }

  // ==========================================
  // LISTAS SEPARADAS
  // ==========================================

  const expiringSoon = subscriptions
    .filter((s) => isExpiringSoon(s))
    .sort((a, b) => {
      const dA = getDaysUntilRenewal(a) ?? 999;
      const dB = getDaysUntilRenewal(b) ?? 999;
      return dA - dB;
    });

  const recentlyRenewed = subscriptions
    .filter((s) => isRenewedRecently(s) && !isExpiringSoon(s))
    .sort((a, b) => {
      const dA = new Date(a.last_payment_at!).getTime();
      const dB = new Date(b.last_payment_at!).getTime();
      return dB - dA;
    });

  // ==========================================
  // LISTA COMPLETA (com filtros)
  // ==========================================

  const filtered = subscriptions.filter((sub) => {
    if (statusFilter !== "all" && sub.payment_status !== statusFilter) {
      return false;
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      const matchesName = sub.customer_name.toLowerCase().includes(search);
      const matchesEmail = sub.customer_email.toLowerCase().includes(search);
      if (!matchesName && !matchesEmail) return false;
    }

    return true;
  });

  // ==========================================
  // WHATSAPP
  // ==========================================

  function getWhatsAppLink(phone: string, name: string) {
  const digits = phone.replace(/\D/g, "");
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  const message = encodeURIComponent(buildWhatsAppMessage(name));
  
  // 🆕 Usa o protocolo whatsapp:// que força o app desktop
  return `whatsapp://send?phone=${withCountry}&text=${message}`;
}

  // ==========================================
  // HELPERS
  // ==========================================

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
    const map: Record<string, string> = {
      weekly: "Semanal",
      biweekly: "Quinzenal",
      monthly: "Mensal",
    };
    return map[freq] || freq;
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div>
      {/* HEADER */}
      <div style={{ marginBottom: 24 }}>
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
          {subscriptions.length}{" "}
          {subscriptions.length === 1 ? "assinatura" : "assinaturas"} no total
        </p>
      </div>

      {isLoading ? (
        <div style={emptyStyle}>Carregando assinaturas...</div>
      ) : (
        <>
          {/* ==========================================
              🔴 RENOVANDO EM BREVE
          ========================================== */}
          {expiringSoon.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#dc2626",
                  }}
                />
                <h2
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#991b1b",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Renovando em breve ({expiringSoon.length})
                </h2>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {expiringSoon.map((sub) => {
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
                      <div style={{ flex: 1, minWidth: 200 }}>
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
                          {sub.plan_name} ·{" "}
                          {formatFrequency(sub.plan_frequency)} ·{" "}
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
                        href={getWhatsAppLink(
                          sub.customer_phone,
                          sub.customer_name
                        )}
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
            </div>
          )}

          {/* ==========================================
              🟢 ASSINATURAS RECENTES
          ========================================== */}
          {recentlyRenewed.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#16a34a",
                  }}
                />
                <h2
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#166534",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Assinaturas recentes ({recentlyRenewed.length})
                </h2>
              </div>

              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e0e0dc",
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
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
                    {recentlyRenewed.map((sub) => (
                      <tr
                        key={sub.id}
                        onClick={() => setSelectedSubscription(sub)}
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
            </div>
          )}

          {/* ==========================================
              📋 TODAS AS ASSINATURAS
          ========================================== */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                marginBottom: 12,
                flexWrap: "wrap",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#2f2a26",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Todas as assinaturas ({filtered.length})
              </h2>

              <div style={{ display: "flex", gap: 8 }}>
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

                <button
                  type="button"
                  onClick={loadSubscriptions}
                  style={refreshBtnStyle}
                >
                  ↻
                </button>
              </div>
            </div>

            <div style={tableWrapperStyle}>
              {filtered.length === 0 ? (
                <div style={emptyStyle}>Nenhuma assinatura encontrada.</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f9f9f7" }}>
                      <th style={thStyle}>Cliente</th>
                      <th style={thStyle}>Plano</th>
                      <th style={thStyle}>Frequência</th>
                      <th style={thStyle}>Dia</th>
                      <th style={thStyle}>Valor</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Próxima renovação</th>
                      <th style={thStyle}>Criado em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((sub) => {
                      const statusStyle =
                        STATUS_COLOR[sub.payment_status] ||
                        STATUS_COLOR.pending;

                      return (
                        <tr
                          key={sub.id}
                          onClick={() => setSelectedSubscription(sub)}
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
                          <td style={tdStyle}>{sub.plan_name}</td>
                          <td style={tdStyle}>
                            {formatFrequency(sub.plan_frequency)}
                          </td>
                          <td style={tdStyle}>
                            {sub.delivery_day === "saturday"
                              ? "Sábado"
                              : "Domingo"}
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
                            {sub.next_renewal_at
                              ? formatDate(sub.next_renewal_at)
                              : "—"}
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
          </div>
        </>
      )}

      {/* ==========================================
          PAINEL LATERAL — DETALHES
      ========================================== */}
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
          {/* STATUS + RENOVAÇÃO */}
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

          {/* CONTATO */}
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

          {/* PLANO */}
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
              value={subscription.delivery_day === "saturday" ? "Sábado" : "Domingo"}
            />
            <Field
              label="Valor"
              value={formatPrice(subscription.plan_price)}
            />
          </Section>

          {/* PAGAMENTO */}
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

          {/* ENDEREÇO */}
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

const tableWrapperStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e0e0dc",
  borderRadius: 8,
  overflow: "hidden",
};

const emptyStyle: React.CSSProperties = {
  padding: 40,
  textAlign: "center",
  color: "#7a7a72",
  fontSize: 13,
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