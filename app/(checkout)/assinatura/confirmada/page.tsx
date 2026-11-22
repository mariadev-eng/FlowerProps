"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type SubscriptionData = {
  id: number;
  name: string;
  description: string;
  price: number;
  frequency: string;
  deliveries_per_month: number;
  image: string | null;
  delivery_day: "saturday" | "sunday";
};

type CustomerData = {
  name: string;
  phone: string;
  email: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

export default function AssinaturaConfirmadaPage() {
  const router = useRouter();

  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [orderId, setOrderId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedSub = localStorage.getItem("flower-subscription-checkout");
    const savedCustomer = localStorage.getItem(
      "flower-subscription-customer"
    );
    const savedOrderId = localStorage.getItem("flower-subscription-order-id");

    if (!savedSub) {
      router.push("/assinaturas");
      return;
    }

    try {
      const sub = JSON.parse(savedSub);
      setSubscription(sub.subscription || sub);

      if (savedCustomer) {
        const parsed = JSON.parse(savedCustomer);
        setCustomer(parsed.customer || null);
      }

      if (savedOrderId) {
        setOrderId(savedOrderId);
      }
    } catch {
      router.push("/assinaturas");
    }

    setIsLoading(false);
  }, [router]);

  function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function goToHome() {
    localStorage.removeItem("flower-subscription-checkout");
    localStorage.removeItem("flower-subscription-customer");
    localStorage.removeItem("flower-subscription-order-id");

    router.push("/");
  }

  if (isLoading || !subscription) {
    return (
      <main className="confirmed-page">
        <div className="confirmed-container">
          <p>Carregando...</p>
        </div>
      </main>
    );
  }

  const orderNumber = orderId
    ? `#${String(orderId).padStart(6, "0")}`
    : "#000000";

  return (
    <main className="confirmed-page">
      <header className="confirmed-header">
        <Link href="/" className="confirmed-logo">
          FLOWER
          <span>PROPS</span>
        </Link>

        <span className="confirmed-header-label">Assinatura</span>

        <div className="confirmed-header-secure">✓ Ativada</div>
      </header>

      <section className="confirmed-container">
        <div className="confirmed-icon">✓</div>

        <span className="confirmed-eyebrow">ASSINATURA ATIVADA</span>

        <h1>
          Bem-vinda ao
          <br />
          <em>Flower em casa.</em>
        </h1>

        <p className="confirmed-description">
          Sua assinatura foi ativada com sucesso. Em breve você receberá as
          primeiras flores no dia escolhido.
        </p>

        <div className="confirmed-number">
          <span>NÚMERO DO PEDIDO</span>
          <strong>{orderNumber}</strong>
        </div>

        <div className="confirmed-content">
          {/* PLANO */}
          <section className="confirmed-card">
            <div className="confirmed-card-heading">
              <span>01</span>
              <div>
                <h2>Sua assinatura</h2>
                <p>
                  {subscription.deliveries_per_month}{" "}
                  {subscription.deliveries_per_month === 1
                    ? "entrega por mês"
                    : "entregas por mês"}
                </p>
              </div>
            </div>

            <div className="confirmed-products">
              <div className="confirmed-product">
                {subscription.image && (
                  <div className="confirmed-product-image">
                    <img
                      src={subscription.image}
                      alt={subscription.name}
                    />
                    <span>1</span>
                  </div>
                )}

                <div className="confirmed-product-info">
                  <strong>Assinatura {subscription.name}</strong>
                  <p>
                    Entrega toda{" "}
                    {subscription.delivery_day === "saturday"
                      ? "sábado"
                      : "domingo"}
                  </p>
                </div>

                <strong className="confirmed-product-price">
                  {formatPrice(subscription.price)}
                </strong>
              </div>
            </div>

            <div className="confirmed-total">
              <span>Total mensal</span>
              <strong>{formatPrice(subscription.price)}</strong>
            </div>
          </section>

          {/* RECEBIMENTO */}
          <section className="confirmed-card">
            <div className="confirmed-card-heading">
              <span>02</span>
              <div>
                <h2>Recebimento</h2>
                <p>Informações sobre suas entregas</p>
              </div>
            </div>

            <div className="confirmed-receiving">
              <div className="confirmed-receiving-icon">✿</div>

              <div>
                <span>
                  {customer?.street
                    ? "ENTREGA"
                    : "RETIRADA"}
                </span>

                <strong>
                  {customer?.street
                    ? "Receber em casa"
                    : "Retirar no ateliê"}
                </strong>

                <p>
                  {customer?.street
                    ? `Entregamos toda ${
                        subscription.delivery_day === "saturday"
                          ? "sábado"
                          : "domingo"
                      } no endereço informado.`
                    : `Sua assinatura fica disponível para retirada toda ${
                        subscription.delivery_day === "saturday"
                          ? "sábado"
                          : "domingo"
                      }.`}
                </p>
              </div>
            </div>

            {customer && (
              <div className="confirmed-address">
                <span>ENDEREÇO</span>
                <p>
                  {customer.street}, {customer.number}
                  {customer.complement && ` — ${customer.complement}`}
                  <br />
                  {customer.neighborhood} — {customer.city}/{customer.state}
                  <br />
                  CEP: {customer.cep}
                </p>
              </div>
            )}
          </section>
        </div>

        <div className="confirmed-next">
          <div>
            <span>PRÓXIMO PASSO</span>
            <p>
              Em breve você receberá um contato pelo WhatsApp para confirmar
              os detalhes da sua assinatura.
            </p>
          </div>

          <button type="button" onClick={goToHome}>
            Voltar para a home
            <span>→</span>
          </button>
        </div>
      </section>
    </main>
  );
}