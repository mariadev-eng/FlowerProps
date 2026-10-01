"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { validateCep, type DeliveryMethod } from "@/lib/checkcep";

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

type FormData = {
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

export default function AssinaturaCheckoutPage() {
  const router = useRouter();

  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );
  const [isLoadingSub, setIsLoadingSub] = useState(true);

  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("delivery");

  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    email: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );

  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");

  // ==========================================
  // CARREGA A ASSINATURA ESCOLHIDA
  // ==========================================

  useEffect(() => {
    const saved = localStorage.getItem("flower-subscription-checkout");

    if (!saved) {
      router.push("/assinaturas");
      return;
    }

    try {
      setSubscription(JSON.parse(saved));
    } catch {
      router.push("/assinaturas");
    }

    setIsLoadingSub(false);
  }, [router]);

  // ==========================================
  // PRÉ-PREENCHE SE LOGADO
  // ==========================================

  useEffect(() => {
    async function loadUserData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setFormData((current) => ({
        ...current,
        name: user.user_metadata?.name || "",
        email: user.email || "",
      }));

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setFormData((current) => ({
          ...current,
          name: profile.name || current.name,
          phone: profile.phone || current.phone,
          cep: profile.cep || current.cep,
          street: profile.street || current.street,
          number: profile.number || current.number,
          complement: profile.complement || current.complement,
          neighborhood: profile.neighborhood || current.neighborhood,
          city: profile.city || current.city,
          state: profile.state || current.state,
        }));
      }
    }

    loadUserData();
  }, []);

  // ==========================================
  // FORMATAÇÃO
  // ==========================================

  function formatPhone(value: string) {
    const n = value.replace(/\D/g, "").slice(0, 11);

    if (n.length <= 2) return n.length ? `(${n}` : "";
    if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
    if (n.length <= 10)
      return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;

    return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
  }

  function formatCep(value: string) {
    const n = value.replace(/\D/g, "").slice(0, 8);
    if (n.length <= 5) return n;
    return `${n.slice(0, 5)}-${n.slice(5)}`;
  }

  function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  // ==========================================
  // BUSCA CEP
  // ==========================================

  async function searchCep(cep: string) {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return;

    setIsSearchingCep(true);
    setErrors((c) => ({ ...c, cep: "" }));

    const result = await validateCep(clean, deliveryMethod);

    if (!result.valid) {
      setErrors((c) => ({ ...c, cep: result.error || "CEP inválido" }));
      setFormData((c) => ({
        ...c,
        street: "",
        neighborhood: "",
        city: "",
        state: "",
      }));
      setIsSearchingCep(false);
      return;
    }

    setFormData((c) => ({
      ...c,
      street: result.data?.street || "",
      neighborhood: result.data?.neighborhood || "",
      city: result.data?.city || "",
      state: result.data?.state || "",
    }));

    setIsSearchingCep(false);
  }

  // ==========================================
  // HANDLERS
  // ==========================================

  function handleChange(field: keyof FormData, value: string) {
    setFormData((c) => ({ ...c, [field]: value }));
    if (errors[field]) {
      setErrors((c) => ({ ...c, [field]: "" }));
    }
  }

  function handlePhoneChange(value: string) {
    handleChange("phone", formatPhone(value));
  }

  function handleCepChange(value: string) {
    const formatted = formatCep(value);
    handleChange("cep", formatted);

    const clean = formatted.replace(/\D/g, "");
    if (clean.length === 8) {
      searchCep(clean);
    } else {
      setFormData((c) => ({
        ...c,
        street: "",
        neighborhood: "",
        city: "",
        state: "",
      }));
    }
  }

  // ==========================================
  // VALIDA FORMULÁRIO
  // ==========================================

  function validateForm(): boolean {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) newErrors.name = "Informe seu nome.";
    if (!formData.phone.trim()) newErrors.phone = "Informe seu telefone.";
    if (!formData.email.trim()) newErrors.email = "Informe seu e-mail.";
    else if (!formData.email.includes("@"))
      newErrors.email = "E-mail inválido.";

    if (deliveryMethod === "delivery") {
      if (!formData.cep.trim()) newErrors.cep = "Informe o CEP.";
      if (!formData.street.trim()) newErrors.street = "Informe a rua.";
      if (!formData.number.trim()) newErrors.number = "Informe o número.";
      if (!formData.neighborhood.trim())
        newErrors.neighborhood = "Informe o bairro.";
      if (!formData.city.trim()) newErrors.city = "Informe a cidade.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ==========================================
  // CONTINUA PRO PAGAMENTO
  // ==========================================

  function handleContinue() {
    setGeneralError("");

    if (!validateForm()) {
      setGeneralError("Preencha os campos destacados.");
      return;
    }

    setLoading(true);

    const checkoutData = {
      subscription,
      customer: formData,
      deliveryMethod,
    };

    localStorage.setItem(
      "flower-subscription-customer",
      JSON.stringify(checkoutData)
    );

    router.push("/assinatura/pagamento");
  }

  // ==========================================
  // LOADING INICIAL
  // ==========================================

  if (isLoadingSub || !subscription) {
    return (
      <main className="checkout-page">
        <div className="checkout-container">
          <p>Carregando...</p>
        </div>
      </main>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <main className="checkout-page">
      <header className="checkout-header">
        <div className="checkout-header-inner">
          <Link href="/" className="checkout-logo">
            FLOWER
          </Link>

          <span className="checkout-header-title">
            Assinatura — Passo 1 de 2
          </span>

          <Link href="/assinaturas" className="checkout-back">
            ← Voltar
          </Link>
        </div>
      </header>

      <div className="checkout-container">
        {/* ==================== FORMULÁRIO ==================== */}

        <div className="checkout-main">
          <div className="checkout-title">
            <span className="eyebrow">ASSINATURA FLORAL</span>

            <h1>
              Vamos entregar suas
              <br />
              <em>flores.</em>
            </h1>

            <p>Preencha seus dados para continuarmos com a assinatura.</p>
          </div>

          {generalError && (
            <div
              className="account-message error"
              style={{ marginBottom: 20 }}
            >
              {generalError}
            </div>
          )}

          {/* DADOS */}
          <section className="checkout-section">
            <div className="checkout-section-title">
              <span>01</span>
              <div>
                <h2>Seus dados</h2>
                <p>Precisamos dessas informações para o pedido.</p>
              </div>
            </div>

            <div className="checkout-form">
              <label>
                Nome completo
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Digite seu nome"
                  className={errors.name ? "input-error" : ""}
                />
                {errors.name && (
                  <small className="field-error">{errors.name}</small>
                )}
              </label>

              <div className="form-row">
                <label>
                  Telefone
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="(22) 99999-9999"
                    inputMode="numeric"
                    maxLength={15}
                    className={errors.phone ? "input-error" : ""}
                  />
                  {errors.phone && (
                    <small className="field-error">{errors.phone}</small>
                  )}
                </label>

                <label>
                  E-mail
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="seuemail@email.com"
                    className={errors.email ? "input-error" : ""}
                  />
                  {errors.email && (
                    <small className="field-error">{errors.email}</small>
                  )}
                </label>
              </div>
            </div>
          </section>

          {/* RECEBIMENTO */}
          <section className="checkout-section">
            <div className="checkout-section-title">
              <span>02</span>
              <div>
                <h2>Forma de recebimento</h2>
                <p>Escolha como deseja receber suas flores.</p>
              </div>
            </div>

            <div className="delivery-options">
              <button
                type="button"
                className={
                  deliveryMethod === "delivery"
                    ? "delivery-option active"
                    : "delivery-option"
                }
                onClick={() => setDeliveryMethod("delivery")}
              >
                <div>
                  <strong>Receber em casa</strong>
                  <span>Entrega em Macaé-RJ (grátis para assinantes)</span>
                </div>
                <span className="radio" />
              </button>

              <button
                type="button"
                className={
                  deliveryMethod === "pickup"
                    ? "delivery-option active"
                    : "delivery-option"
                }
                onClick={() => setDeliveryMethod("pickup")}
              >
                <div>
                  <strong>Retirar no ateliê</strong>
                  <span>Disponível para clientes do RJ</span>
                </div>
                <span className="radio" />
              </button>
            </div>
          </section>

          {/* ENDEREÇO */}
          {deliveryMethod === "delivery" && (
            <section className="checkout-section">
              <div className="checkout-section-title">
                <span>03</span>
                <div>
                  <h2>Endereço de entrega</h2>
                  <p>Onde devemos entregar suas flores?</p>
                </div>
              </div>

              <div className="checkout-form">
                <div className="form-row">
                  <label>
                    CEP
                    <input
                      type="text"
                      value={formData.cep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      placeholder="27900-000"
                      inputMode="numeric"
                      maxLength={9}
                      className={errors.cep ? "input-error" : ""}
                    />
                    {isSearchingCep && (
                      <small className="field-help">
                        Buscando endereço...
                      </small>
                    )}
                    {errors.cep && (
                      <small className="field-error">{errors.cep}</small>
                    )}
                  </label>

                  <label>
                    Número
                    <input
                      type="text"
                      value={formData.number}
                      onChange={(e) => handleChange("number", e.target.value)}
                      placeholder="123"
                      className={errors.number ? "input-error" : ""}
                    />
                    {errors.number && (
                      <small className="field-error">{errors.number}</small>
                    )}
                  </label>
                </div>

                <label>
                  Rua
                  <input
                    type="text"
                    value={formData.street}
                    onChange={(e) => handleChange("street", e.target.value)}
                    placeholder="Nome da rua"
                    className={errors.street ? "input-error" : ""}
                  />
                  {errors.street && (
                    <small className="field-error">{errors.street}</small>
                  )}
                </label>

                <label>
                  Complemento
                  <input
                    type="text"
                    value={formData.complement}
                    onChange={(e) =>
                      handleChange("complement", e.target.value)
                    }
                    placeholder="Apartamento, bloco, referência..."
                  />
                </label>

                <div className="form-row">
                  <label>
                    Bairro
                    <input
                      type="text"
                      value={formData.neighborhood}
                      onChange={(e) =>
                        handleChange("neighborhood", e.target.value)
                      }
                      placeholder="Seu bairro"
                      className={errors.neighborhood ? "input-error" : ""}
                    />
                    {errors.neighborhood && (
                      <small className="field-error">
                        {errors.neighborhood}
                      </small>
                    )}
                  </label>

                  <label>
                    Cidade
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleChange("city", e.target.value)}
                      placeholder="Sua cidade"
                      className={errors.city ? "input-error" : ""}
                    />
                    {errors.city && (
                      <small className="field-error">{errors.city}</small>
                    )}
                  </label>
                </div>

                <label>
                  Estado
                  <input
                    type="text"
                    value={formData.state}
                    readOnly
                    placeholder="Estado"
                  />
                </label>
              </div>
            </section>
          )}

          {/* CONTINUAR */}
          <button
            type="button"
            className="checkout-continue"
            onClick={handleContinue}
            disabled={loading}
          >
            {loading ? "Aguarde..." : "Ir para pagamento"}
            {!loading && <span>→</span>}
          </button>
        </div>

        {/* ==================== RESUMO ==================== */}

        <aside className="checkout-summary">
          <div className="summary-header">
            <span className="eyebrow">SUA ASSINATURA</span>
            <h2>Resumo</h2>
          </div>

          <div className="checkout-products">
            <div className="checkout-product">
              <div className="checkout-product-image">
                {subscription.image && (
                  <img src={subscription.image} alt={subscription.name} />
                )}
              </div>

              <div className="checkout-product-info">
                <strong>Assinatura {subscription.name}</strong>
                <span>
                  {subscription.deliveries_per_month}{" "}
                  {subscription.deliveries_per_month === 1
                    ? "entrega por mês"
                    : "entregas por mês"}
                </span>
                <span>
                  {subscription.delivery_day === "saturday"
                    ? "Sábado"
                    : "Domingo"}
                </span>
              </div>

              <strong>{formatPrice(subscription.price)}</strong>
            </div>
          </div>

          <div className="summary-line">
            <span>Entrega</span>
            <strong>
              {deliveryMethod === "pickup" ? "Retirada no ateliê" : "Grátis"}
            </strong>
          </div>

          <div className="summary-total">
            <span>Total</span>
            <strong>{formatPrice(subscription.price)}</strong>
          </div>

          <p className="summary-security">
            Seus dados serão utilizados somente para processar sua assinatura.
          </p>
        </aside>
      </div>
    </main>
  );
}