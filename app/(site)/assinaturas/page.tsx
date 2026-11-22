"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Subscription = {
  id: number;
  name: string;
  description: string;
  price: number;
  black_friday_price?: number | null;
  frequency: string;
  deliveries_per_month: number;
  image: string | null;
  available: boolean;
  display_order: number;
};

type DeliveryDay = "saturday" | "sunday";

const fallbackImage =
  "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=900&q=85";

function AssinaturasContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const renovacaoId = searchParams.get("renovacao");

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDays, setSelectedDays] = useState<
    Record<number, DeliveryDay | null>
  >({});

  useEffect(() => {
    async function loadSubscriptions() {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("available", true)
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Erro ao carregar assinaturas:", error);
        setSubscriptions([]);
      } else {
        setSubscriptions(data ?? []);
      }

      setLoading(false);
    }

    loadSubscriptions();
  }, []);

  function handleSelectDay(subscriptionId: number, day: DeliveryDay) {
    setSelectedDays((current) => ({
      ...current,
      [subscriptionId]: day,
    }));
  }

  function handleSubscribe(subscription: Subscription) {
    const selectedDay = selectedDays[subscription.id];

    if (!selectedDay) {
      alert("Escolha o dia da entrega (sábado ou domingo) antes de assinar.");
      return;
    }

    const hasPromo = subscription.black_friday_price && subscription.black_friday_price > 0;
    const finalPrice = hasPromo ? subscription.black_friday_price! : subscription.price;

    const subscriptionCheckout = {
      id: subscription.id,
      name: subscription.name,
      description: subscription.description,
      price: finalPrice, 
      frequency: subscription.frequency,
      deliveries_per_month: subscription.deliveries_per_month,
      image: subscription.image || fallbackImage,
      delivery_day: selectedDay,
      is_renewal: !!renovacaoId,
      renewal_subscription_id: renovacaoId ? Number(renovacaoId) : null,
    };

    localStorage.setItem(
      "flower-subscription-checkout",
      JSON.stringify(subscriptionCheckout)
    );

    router.push("/assinatura/checkout");
  }

  function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  return (
    <main className="subscriptions-page">
      {/* HEADER ANTIGO REMOVIDO */}
      
      <section 
        className="subscriptions-intro section" 
        style={{ 
          background: "#f2ece6", 
          padding: "80px 20px", 
          borderRadius: "0 0 12px 12px" 
        }}
      >
        <span className="eyebrow" style={{ color: "#b88a44" }}>
          {renovacaoId ? "RENOVAÇÃO DE ASSINATURA" : "ESPÍRITO DE NATAL · BLACK FRIDAY"}
        </span>

        <h1 style={{ fontFamily: "var(--serif)", color: "#1e3a29" }}>
          {renovacaoId ? "Renove sua" : "Escolha sua"}
          <br />
          <em style={{ color: "#b88a44", fontStyle: "italic" }}>assinatura.</em>
        </h1>

        <p style={{ color: "#7a7a72", maxWidth: 600, margin: "20px auto", fontSize: "15px", lineHeight: 1.8 }}>
          {renovacaoId 
            ? "Que bom ter você de volta! Escolha seu plano para renovar sua assinatura e continuar recebendo flores frescas."
            : "Receba flores frescas, selecionadas especialmente para cada entrega. Aproveite as condições exclusivas de Black Friday e ilumine seu fim de ano."
          }
        </p>

        <p style={{ color: "#b88a44", fontSize: 13, fontWeight: 600, letterSpacing: "0.05em" }}>
          {renovacaoId 
            ? "Após a renovação, suas flores continuam chegando na mesma frequência."
            : "Após a contratação, suas flores chegam na semana seguinte."
          }
        </p>
      </section>

      <section className="subscriptions-grid section" style={{ paddingTop: 60 }}>
        {loading ? (
          <div className="subscriptions-loading">
            <p>Carregando planos...</p>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="subscriptions-empty">
            <p>Nenhum plano disponível no momento.</p>
            <Link href="/" className="button button-outline dark">
              Voltar para a home
            </Link>
          </div>
        ) : (
          <div className="subscriptions-cards">
            {subscriptions.map((sub) => {
              const hasPromo = sub.black_friday_price && sub.black_friday_price > 0;
              const finalPrice = hasPromo ? sub.black_friday_price! : sub.price;

              return (
                <div key={sub.id} className="subscription-card">
                  <div className="subscription-card-image">
                    <img src={sub.image || fallbackImage} alt={sub.name} />
                  </div>

                  <div className="subscription-card-content">
                    <span className="eyebrow">
                      {sub.deliveries_per_month}{" "}
                      {sub.deliveries_per_month === 1
                        ? "entrega por mês"
                        : "entregas por mês"}
                    </span>

                    <h2>{sub.name}</h2>

                    <p>{sub.description}</p>

                    <div className="subscription-card-price">
                      {hasPromo && (
                        <span style={{ textDecoration: "line-through", color: "#999", fontSize: 14, display: "block", marginBottom: 4 }}>
                          De {formatPrice(sub.price)}
                        </span>
                      )}
                      <strong style={hasPromo ? { color: "#b88a44" } : {}}>
                        {formatPrice(finalPrice)}
                      </strong>
                      <span>por mês</span>
                    </div>

                    <div className="subscription-delivery-day">
                      <span className="subscription-delivery-label">
                        Escolha o dia da entrega:
                      </span>

                      <div className="subscription-day-options">
                        <button
                          type="button"
                          className={`subscription-day-option ${
                            selectedDays[sub.id] === "saturday" ? "active" : ""
                          }`}
                          onClick={() => handleSelectDay(sub.id, "saturday")}
                        >
                          <span className="subscription-day-radio" />
                          <span>Sábado</span>
                        </button>

                        <button
                          type="button"
                          className={`subscription-day-option ${
                            selectedDays[sub.id] === "sunday" ? "active" : ""
                          }`}
                          onClick={() => handleSelectDay(sub.id, "sunday")}
                        >
                          <span className="subscription-day-radio" />
                          <span>Domingo</span>
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSubscribe(sub)}
                      style={{
                        width: "100%",
                        minHeight: 48,
                        marginTop: 24,
                        padding: "0 24px",
                        background: hasPromo ? "#b88a44" : "#2f2a26",
                        color: "#ffffff",
                        border: 0,
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "background 0.2s ease"
                      }}
                    >
                      {renovacaoId ? "Renovar" : "Assinar"} {sub.name}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <footer className="footer">
        <div className="footer-brand">
          <img
            src="/images/logofooternew.png" 
            alt="FLOWER Buquês & Acessórios"
            className="footer-logo"
          />
        </div>

        <div className="footer-links">
          <a href="https://instagram.com/_flowerprops_" target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href="https://wa.me/5522992298475" target="_blank" rel="noopener noreferrer">WhatsApp</a>
          <a href="#">Contato</a>
          <a href="#">Política de privacidade</a>
        </div>

        <p>© 2026 FLOWER. Todos os direitos reservados.</p>
      </footer>
    </main>
  );
}

export default function AssinaturasPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>Carregando...</div>}>
      <AssinaturasContent />
    </Suspense>
  );
}