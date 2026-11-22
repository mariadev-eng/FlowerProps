"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";

type SubscriptionOrder = {
  id: number;
  plan_name: string;
  plan_frequency: string;
  plan_price: number;
  deliveries_per_month: number;
  delivery_day: string;
  customer_name: string;
  customer_email: string;
  delivery_method: string;
  payment_method: string;
  payment_status: string;
  last_payment_at: string | null;
  next_renewal_at: string | null;
  created_at: string;
};

const STATUS_LABELS: Record<string, string> = {
  paid: "Ativa",
  pending: "Aguardando pagamento",
  cancelled: "Cancelada",
  rejected: "Recusada",
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  paid: { bg: "#dcfce7", color: "#166534" },
  pending: { bg: "#fef3c7", color: "#854d0e" },
  cancelled: { bg: "#fee2e2", color: "#991b1b" },
  rejected: { bg: "#fee2e2", color: "#991b1b" },
};

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: "Semanal",
  biweekly: "Quinzenal",
  monthly: "Mensal",
};

export default function MinhasAssinaturasPage() {
  const router = useRouter();
  const { user, loading: loadingUser } = useUser();
  const [subscriptions, setSubscriptions] = useState<SubscriptionOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loadingUser) return;

    if (!user) {
      router.replace("/conta");
      return;
    }

    async function loadSubscriptions() {
      const { data, error } = await supabase
        .from("subscription_orders")
        .select("*")
        .eq("customer_email", user!.email)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar assinaturas:", error);
        setSubscriptions([]);
      } else {
        setSubscriptions(data ?? []);
      }

      setIsLoading(false);
    }

    loadSubscriptions();
  }, [user, loadingUser, router]);

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

  function isExpired(sub: SubscriptionOrder): boolean {
    const days = getDaysUntilRenewal(sub);
    return days !== null && days < 0;
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
          Carregando assinaturas...
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
          width: "min(800px, calc(100% - 40px))",
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
            Minhas assinaturas
          </h1>
          <p style={{ color: "#7a7a72", fontSize: 13, margin: 0 }}>
            Acompanhe o status das suas assinaturas FLOWER em Casa.
          </p>
        </div>

        {subscriptions.length === 0 ? (
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
            <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
            <p style={{ margin: "0 0 8px", fontSize: 15, color: "#2f2a26" }}>
              Você ainda não tem assinaturas.
            </p>
            <p style={{ margin: "0 0 24px", fontSize: 13 }}>
              Assine e receba flores frescas toda semana em casa.
            </p>
            <Link
              href="/assinaturas"
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
              Ver planos
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {subscriptions.map((sub) => {
              const statusStyle =
                STATUS_COLORS[sub.payment_status] || STATUS_COLORS.pending;
              const days = getDaysUntilRenewal(sub);
              const expiring = isExpiringSoon(sub);
              const expired = isExpired(sub);
              const isActive = sub.payment_status === "paid" && !expired;

              return (
                <div
                  key={sub.id}
                  style={{
                    background: "#fff",
                    border: expiring
                      ? "2px solid #f59e0b"
                      : expired
                      ? "2px solid #dc2626"
                      : "1px solid #e0e0dc",
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
                      flexWrap: "wrap",
                      marginBottom: 16,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontFamily: "var(--serif)",
                          fontSize: 24,
                          fontWeight: 500,
                          color: "#3f493b",
                          marginBottom: 4,
                        }}
                      >
                        {sub.plan_name}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#7a7a72",
                        }}
                      >
                        {FREQUENCY_LABELS[sub.plan_frequency] ||
                          sub.plan_frequency}{" "}
                        ·{" "}
                        {sub.deliveries_per_month}{" "}
                        {sub.deliveries_per_month === 1
                          ? "entrega/mês"
                          : "entregas/mês"}{" "}
                        ·{" "}
                        {sub.delivery_day === "saturday"
                          ? "Sábado"
                          : "Domingo"}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 8,
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
                        {STATUS_LABELS[sub.payment_status] ||
                          sub.payment_status}
                      </span>
                      <strong
                        style={{
                          fontFamily: "var(--serif)",
                          fontSize: 20,
                          fontWeight: 500,
                          color: "#3f493b",
                        }}
                      >
                        {formatPrice(sub.plan_price)}
                      </strong>
                    </div>
                  </div>

                  {/* DATAS */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                      gap: 12,
                      padding: 12,
                      background: "#f9f9f7",
                      borderRadius: 6,
                      marginBottom: 16,
                      fontSize: 12,
                    }}
                  >
                    <div>
                      <div style={{ color: "#7a7a72", marginBottom: 2 }}>
                        Último pagamento
                      </div>
                      <strong style={{ color: "#2f2a26" }}>
                        {formatDate(sub.last_payment_at)}
                      </strong>
                    </div>

                    <div>
                      <div style={{ color: "#7a7a72", marginBottom: 2 }}>
                        Próxima renovação
                      </div>
                      <strong style={{ color: "#2f2a26" }}>
                        {formatDate(sub.next_renewal_at)}
                      </strong>
                    </div>

                    {days !== null && (
                      <div>
                        <div style={{ color: "#7a7a72", marginBottom: 2 }}>
                          Status
                        </div>
                        <strong
                          style={{
                            color: expired
                              ? "#dc2626"
                              : expiring
                              ? "#f59e0b"
                              : "#166534",
                          }}
                        >
                          {expired
                            ? `Expirou há ${Math.abs(days)} dia${
                                Math.abs(days) === 1 ? "" : "s"
                              }`
                            : days === 0
                            ? "Vence hoje"
                            : `Renova em ${days} dia${days === 1 ? "" : "s"}`}
                        </strong>
                      </div>
                    )}
                  </div>

                  {/* BOTÃO DE RENOVAR */}
                  {isActive && days !== null && days <= 7 && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: 12,
                        background: "#fef3c7",
                        borderRadius: 6,
                        marginBottom: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          color: "#854d0e",
                          fontWeight: 500,
                        }}
                      >
                        ⚠️ Sua assinatura vence em {days}{" "}
                        {days === 1 ? "dia" : "dias"}
                      </span>
                      <Link
                        href="/assinaturas"
                        style={{
                          padding: "10px 18px",
                          background: "#166534",
                          color: "#fff",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                          textDecoration: "none",
                          whiteSpace: "nowrap",
                        }}
                      >
                        🔄 Renovar assinatura
                      </Link>
                    </div>
                  )}

                  {expired && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: 12,
                        background: "#fee2e2",
                        borderRadius: 6,
                        marginBottom: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          color: "#991b1b",
                          fontWeight: 500,
                        }}
                      >
                        ❌ Sua assinatura expirou. Renove para continuar
                        recebendo.
                      </span>
                      <Link
                        href="/assinaturas"
                        style={{
                          padding: "10px 18px",
                          background: "#166534",
                          color: "#fff",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                          textDecoration: "none",
                          whiteSpace: "nowrap",
                        }}
                      >
                        🔄 Renovar agora
                      </Link>
                    </div>
                  )}

                  {/* INFO DO MÉTODO DE PAGAMENTO */}
                  <div
                    style={{
                      fontSize: 11,
                      color: "#9ca3af",
                      marginTop: 8,
                    }}
                  >
                    Pagamento via {sub.payment_method}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}