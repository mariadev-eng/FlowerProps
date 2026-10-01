"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserRound } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Subscription = {
  id: number;
  name: string;
  description: string;
  price: number;
  frequency: string;
  deliveries_per_month: number;
  image: string | null;
  available: boolean;
  display_order: number;
};

type DeliveryDay = "saturday" | "sunday";

const fallbackImage =
  "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=900&q=85";

export default function AssinaturasPage() {
  const router = useRouter();

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

    const subscriptionCheckout = {
      id: subscription.id,
      name: subscription.name,
      description: subscription.description,
      price: subscription.price,
      frequency: subscription.frequency,
      deliveries_per_month: subscription.deliveries_per_month,
      image: subscription.image || fallbackImage,
      delivery_day: selectedDay,
    };

    localStorage.setItem(
      "flower-subscription-checkout",
      JSON.stringify(subscriptionCheckout)
    );

    // 🆕 CORRIGIDO: vai pro checkout da assinatura
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
      <header className="site-header">
        <div className="header-content">
          <Link href="/" className="brand" aria-label="FLOWER">
            <img
              src="/images/logoflowerprops.png"
              alt="FLOWER Buquês & Acessórios"
              className="brand-logo"
            />
          </Link>

          <nav className="desktop-nav">
            <Link href="/">Início</Link>
            <Link href="/#produtos">Buquês</Link>
            <Link href="/#categorias">Categorias</Link>
            <Link href="/#assinaturas">Assinaturas</Link>
            <Link href="/#sobre">Sobre nós</Link>
          </nav>

          <div className="header-actions">
            <button
              type="button"
              aria-label="Minha conta"
              onClick={() => router.push("/conta")}
            >
              <UserRound size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      <section className="subscriptions-intro section">
        <span className="eyebrow">FLOWER EM CASA</span>

        <h1>
          Escolha seu
          <br />
          <em>plano de assinatura.</em>
        </h1>

        <p>
          Receba flores frescas, selecionadas especialmente para cada entrega.
          Sem escolher as flores — a gente monta a composição da semana pra
          você.
        </p>

        <p className="subscriptions-note">
          Após a contratação, suas flores chegam na semana seguinte.
        </p>
      </section>

      <section className="subscriptions-grid section">
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
            {subscriptions.map((sub) => (
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
                    <strong>{formatPrice(sub.price)}</strong>
                    <span>por mês</span>
                  </div>

                  {/* SELETOR DE DIA */}
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

                  {/* BOTÃO ASSINAR */}
                  <button
                    type="button"
                    onClick={() => handleSubscribe(sub)}
                    style={{
                      width: "100%",
                      minHeight: 48,
                      marginTop: 24,
                      padding: "0 24px",
                      background: "#2f2a26",
                      color: "#ffffff",
                      border: 0,
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Assinar {sub.name}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="footer">
        <div className="footer-brand">
          <img
            src="/images/logoflowerprops.png"
            alt="FLOWER Buquês & Acessórios"
            className="footer-logo"
          />
        </div>

        <div className="footer-links">
          <a
            href="https://instagram.com/_flowerprops_"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram
          </a>

          <a
            href="https://wa.me/5522992298475"
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp
          </a>

          <a href="#">Contato</a>
          <a href="#">Política de privacidade</a>
        </div>

        <p>© 2026 FLOWER. Todos os direitos reservados.</p>
      </footer>
    </main>
  );
}