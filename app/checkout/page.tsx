"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CartItem = {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
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
  observation: string;
};

type FormErrors = Partial<
  Record<keyof FormData, string>
>;

const DELIVERY_FEE = 15;

export default function CheckoutPage() {
  const router = useRouter();

  const [cartItems, setCartItems] =
    useState<CartItem[]>([]);

  const [deliveryMethod, setDeliveryMethod] =
    useState<"delivery" | "pickup">(
      "delivery"
    );

  const [formData, setFormData] =
    useState<FormData>({
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
      observation: "",
    });

  const [errors, setErrors] =
    useState<FormErrors>({});

  const [showErrors, setShowErrors] =
    useState(false);

  const [isSearchingCep, setIsSearchingCep] =
    useState(false);

  /*
   * ================================
   * CARREGAR CARRINHO E CHECKOUT
   * ================================
   */

  useEffect(() => {
    const savedCart =
      localStorage.getItem("flower-cart");

    const savedCheckout =
      localStorage.getItem(
        "flower-checkout"
      );

    if (savedCart) {
      try {
        setCartItems(
          JSON.parse(savedCart)
        );
      } catch {
        localStorage.removeItem(
          "flower-cart"
        );
      }
    }

    if (savedCheckout) {
      try {
        const savedData =
          JSON.parse(savedCheckout);

        setFormData({
          name: savedData.name || "",
          phone: savedData.phone || "",
          email: savedData.email || "",
          cep: savedData.cep || "",
          street: savedData.street || "",
          number: savedData.number || "",
          complement:
            savedData.complement || "",
          neighborhood:
            savedData.neighborhood || "",
          city: savedData.city || "",
          state: savedData.state || "",
          observation:
            savedData.observation || "",
        });

        if (
          savedData.deliveryMethod ===
          "pickup"
        ) {
          setDeliveryMethod("pickup");
        }
      } catch {
        localStorage.removeItem(
          "flower-checkout"
        );
      }
    }
  }, []);

  /*
   * ================================
   * VALORES
   * ================================
   */

  const subtotal = cartItems.reduce(
    (total, item) =>
      total +
      item.price * item.quantity,
    0
  );

  const deliveryFee =
    deliveryMethod === "delivery"
      ? DELIVERY_FEE
      : 0;

  const total =
    subtotal + deliveryFee;

  const totalItems =
    cartItems.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );

  /*
   * ================================
   * FORMATAÇÃO DE PREÇO
   * ================================
   */

  function formatPrice(value: number) {
    return value.toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    );
  }

  /*
   * ================================
   * FORMATAÇÃO DO TELEFONE
   *
   * 2299114046
   * ↓
   * (22) 9911-4046
   * ================================
   */

  function formatPhone(value: string) {
    const numbers =
      value.replace(/\D/g, "").slice(0, 10);

    if (numbers.length <= 2) {
      return numbers.length
        ? `(${numbers}`
        : "";
    }

    if (numbers.length <= 6) {
      return `(${numbers.slice(
        0,
        2
      )}) ${numbers.slice(2)}`;
    }

    return `(${numbers.slice(
      0,
      2
    )}) ${numbers.slice(
      2,
      6
    )}-${numbers.slice(6)}`;
  }

  /*
   * ================================
   * FORMATAÇÃO DO CEP
   *
   * 27900100
   * ↓
   * 27900-100
   * ================================
   */

  function formatCep(value: string) {
    const numbers =
      value.replace(/\D/g, "").slice(0, 8);

    if (numbers.length <= 5) {
      return numbers;
    }

    return `${numbers.slice(
      0,
      5
    )}-${numbers.slice(5)}`;
  }

  /*
   * ================================
   * BUSCAR CEP
   * ================================
   */

  async function searchCep(cep: string) {
    const cleanCep =
      cep.replace(/\D/g, "");

    if (cleanCep.length !== 8) {
      return;
    }

    setIsSearchingCep(true);

    setErrors((current) => ({
      ...current,
      cep: "",
    }));

    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cleanCep}/json/`
      );

      if (!response.ok) {
        throw new Error(
          "Erro ao consultar CEP."
        );
      }

      const data = await response.json();

      if (data.erro) {
        setErrors((current) => ({
          ...current,
          cep: "CEP não encontrado.",
        }));

        setFormData((current) => ({
          ...current,
          street: "",
          neighborhood: "",
          city: "",
          state: "",
        }));

        return;
      }

      setFormData((current) => ({
        ...current,

        street:
          data.logradouro || "",

        neighborhood:
          data.bairro || "",

        city:
          data.localidade || "",

        state:
          data.uf || "",
      }));

    } catch (error) {
      console.error(
        "Erro ao buscar CEP:",
        error
      );

      setErrors((current) => ({
        ...current,
        cep:
          "Não foi possível consultar o CEP. Tente novamente.",
      }));

    } finally {
      setIsSearchingCep(false);
    }
  }

  /*
   * ================================
   * ALTERAR CAMPO
   * ================================
   */

  function handleChange(
    field: keyof FormData,
    value: string
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((current) => ({
        ...current,
        [field]: "",
      }));
    }
  }

  /*
   * ================================
   * ALTERAR TELEFONE
   * ================================
   */

  function handlePhoneChange(
    value: string
  ) {
    const formatted =
      formatPhone(value);

    handleChange(
      "phone",
      formatted
    );
  }

  /*
   * ================================
   * ALTERAR CEP
   * ================================
   */

  function handleCepChange(
    value: string
  ) {
    const formatted =
      formatCep(value);

    handleChange(
      "cep",
      formatted
    );

    const cleanCep =
      formatted.replace(/\D/g, "");

    if (cleanCep.length === 8) {
      searchCep(cleanCep);
    } else {
      setFormData((current) => ({
        ...current,
        street: "",
        neighborhood: "",
        city: "",
        state: "",
      }));
    }
  }

  /*
   * ================================
   * VALIDAR FORMULÁRIO
   * ================================
   */

  function validateForm() {
    const newErrors: FormErrors = {};

    const phoneNumbers =
      formData.phone.replace(
        /\D/g,
        ""
      );

    const cepNumbers =
      formData.cep.replace(
        /\D/g,
        ""
      );

    if (!formData.name.trim()) {
      newErrors.name =
        "Informe seu nome.";
    }

    if (!formData.phone.trim()) {
      newErrors.phone =
        "Informe seu telefone.";
    } else if (
      phoneNumbers.length !== 10
    ) {
      newErrors.phone =
        "Informe um telefone válido.";
    }

    if (!formData.email.trim()) {
      newErrors.email =
        "Informe seu e-mail.";
    } else if (
      !formData.email.includes("@")
    ) {
      newErrors.email =
        "Informe um e-mail válido.";
    }

    if (
      deliveryMethod === "delivery"
    ) {
      if (!formData.cep.trim()) {
        newErrors.cep =
          "Informe seu CEP.";
      } else if (
        cepNumbers.length !== 8
      ) {
        newErrors.cep =
          "Informe um CEP válido.";
      }

      if (!formData.street.trim()) {
        newErrors.street =
          "Informe sua rua.";
      }

      if (!formData.number.trim()) {
        newErrors.number =
          "Informe o número.";
      }

      if (
        !formData.neighborhood.trim()
      ) {
        newErrors.neighborhood =
          "Informe seu bairro.";
      }

      if (!formData.city.trim()) {
        newErrors.city =
          "Informe sua cidade.";
      }
    }

    setErrors(newErrors);
    setShowErrors(true);

    return (
      Object.keys(newErrors).length === 0
    );
  }

  /*
   * ================================
   * CONTINUAR
   * ================================
   */

  function handleContinue() {
    const isValid =
      validateForm();

    if (!isValid) {
      return;
    }

    const checkoutData = {
      ...formData,
      deliveryMethod,
    };

    localStorage.setItem(
      "flower-checkout",
      JSON.stringify(
        checkoutData
      )
    );

    router.push("/revisao");
  }

  return (
    <main className="checkout-page">

      {/* =========================
          HEADER
      ========================== */}

      <header className="checkout-header">

        <a
          href="/"
          className="checkout-logo"
        >
          FLOWER
        </a>

        <span>
          Finalização do pedido
        </span>

        <a
          href="/"
          className="checkout-back"
        >
          ← Voltar ao ateliê
        </a>

      </header>

      <div className="checkout-container">

        {/* =========================
            PRINCIPAL
        ========================== */}

        <div className="checkout-main">

          <div className="checkout-title">

            <span className="eyebrow">
              FLOWER PROPS
            </span>

            <h1>
              Como podemos entregar
              suas flores?
            </h1>

            <p>
              Preencha seus dados para
              continuarmos com seu pedido.
            </p>

          </div>

          {/* =========================
              DADOS
          ========================== */}

          <section className="checkout-section">

            <div className="checkout-section-title">

              <span>
                01
              </span>

              <div>

                <h2>
                  Seus dados
                </h2>

                <p>
                  Precisamos dessas informações
                  para o pedido.
                </p>

              </div>

            </div>

            <div className="checkout-form">

              <label>

                Nome completo

                <input
                  type="text"
                  value={
                    formData.name
                  }
                  onChange={(event) =>
                    handleChange(
                      "name",
                      event.target.value
                    )
                  }
                  placeholder="Digite seu nome"
                  className={
                    showErrors &&
                    errors.name
                      ? "input-error"
                      : ""
                  }
                />

                {showErrors &&
                  errors.name && (
                    <small className="field-error">
                      {errors.name}
                    </small>
                  )}

              </label>

              <div className="form-row">

                <label>

                  Telefone

                  <input
                    type="tel"
                    value={
                      formData.phone
                    }
                    onChange={(event) =>
                      handlePhoneChange(
                        event.target.value
                      )
                    }
                    placeholder="(00) 0000-0000"
                    inputMode="numeric"
                    maxLength={15}
                    className={
                      showErrors &&
                      errors.phone
                        ? "input-error"
                        : ""
                    }
                  />

                  {showErrors &&
                    errors.phone && (
                      <small className="field-error">
                        {errors.phone}
                      </small>
                    )}

                </label>

                <label>

                  E-mail

                  <input
                    type="email"
                    value={
                      formData.email
                    }
                    onChange={(event) =>
                      handleChange(
                        "email",
                        event.target.value
                      )
                    }
                    placeholder="seuemail@email.com"
                    className={
                      showErrors &&
                      errors.email
                        ? "input-error"
                        : ""
                    }
                  />

                  {showErrors &&
                    errors.email && (
                      <small className="field-error">
                        {errors.email}
                      </small>
                    )}

                </label>

              </div>

            </div>

          </section>

          {/* =========================
              RECEBIMENTO
          ========================== */}

          <section className="checkout-section">

            <div className="checkout-section-title">

              <span>
                02
              </span>

              <div>

                <h2>
                  Forma de recebimento
                </h2>

                <p>
                  Escolha como deseja receber
                  seu pedido.
                </p>

              </div>

            </div>

            <div className="delivery-options">

              <button
                type="button"
                className={
                  deliveryMethod ===
                  "delivery"
                    ? "delivery-option active"
                    : "delivery-option"
                }
                onClick={() =>
                  setDeliveryMethod(
                    "delivery"
                  )
                }
              >

                <div>

                  <strong>
                    Receber em casa
                  </strong>

                  <span>
                    Entrega local por
                    R$ 15,00.
                  </span>

                </div>

                <span className="radio" />

              </button>

              <button
                type="button"
                className={
                  deliveryMethod ===
                  "pickup"
                    ? "delivery-option active"
                    : "delivery-option"
                }
                onClick={() =>
                  setDeliveryMethod(
                    "pickup"
                  )
                }
              >

                <div>

                  <strong>
                    Retirar no ateliê
                  </strong>

                  <span>
                    Retirada no ateliê
                    FLOWER.
                  </span>

                </div>

                <span className="radio" />

              </button>

            </div>

          </section>

          {/* =========================
              ENDEREÇO
          ========================== */}

          {deliveryMethod ===
            "delivery" && (

            <section className="checkout-section">

              <div className="checkout-section-title">

                <span>
                  03
                </span>

                <div>

                  <h2>
                    Endereço de entrega
                  </h2>

                  <p>
                    Onde devemos entregar
                    suas flores?
                  </p>

                </div>

              </div>

              <div className="checkout-form">

                <div className="form-row">

                  <label>

                    CEP

                    <input
                      type="text"
                      value={
                        formData.cep
                      }
                      onChange={(event) =>
                        handleCepChange(
                          event.target.value
                        )
                      }
                      placeholder="00000-000"
                      inputMode="numeric"
                      maxLength={9}
                      className={
                        showErrors &&
                        errors.cep
                          ? "input-error"
                          : ""
                      }
                    />

                    {isSearchingCep && (
                      <small className="field-help">
                        Buscando endereço...
                      </small>
                    )}

                    {showErrors &&
                      errors.cep && (
                        <small className="field-error">
                          {errors.cep}
                        </small>
                      )}

                  </label>

                  <label>

                    Número

                    <input
                      type="text"
                      value={
                        formData.number
                      }
                      onChange={(event) =>
                        handleChange(
                          "number",
                          event.target.value
                        )
                      }
                      placeholder="000"
                      className={
                        showErrors &&
                        errors.number
                          ? "input-error"
                          : ""
                      }
                    />

                    {showErrors &&
                      errors.number && (
                        <small className="field-error">
                          {errors.number}
                        </small>
                      )}

                  </label>

                </div>

                <label>

                  Rua

                  <input
                    type="text"
                    value={
                      formData.street
                    }
                    onChange={(event) =>
                      handleChange(
                        "street",
                        event.target.value
                      )
                    }
                    placeholder="Nome da rua"
                    className={
                      showErrors &&
                      errors.street
                        ? "input-error"
                        : ""
                    }
                  />

                  {showErrors &&
                    errors.street && (
                      <small className="field-error">
                        {errors.street}
                      </small>
                    )}

                </label>

                <label>

                  Complemento

                  <input
                    type="text"
                    value={
                      formData.complement
                    }
                    onChange={(event) =>
                      handleChange(
                        "complement",
                        event.target.value
                      )
                    }
                    placeholder="Apartamento, bloco, referência..."
                  />

                </label>

                <div className="form-row">

                  <label>

                    Bairro

                    <input
                      type="text"
                      value={
                        formData.neighborhood
                      }
                      onChange={(event) =>
                        handleChange(
                          "neighborhood",
                          event.target.value
                        )
                      }
                      placeholder="Seu bairro"
                      className={
                        showErrors &&
                        errors.neighborhood
                          ? "input-error"
                          : ""
                      }
                    />

                    {showErrors &&
                      errors.neighborhood && (
                        <small className="field-error">
                          {
                            errors.neighborhood
                          }
                        </small>
                      )}

                  </label>

                  <label>

                    Cidade

                    <input
                      type="text"
                      value={
                        formData.city
                      }
                      onChange={(event) =>
                        handleChange(
                          "city",
                          event.target.value
                        )
                      }
                      placeholder="Sua cidade"
                      className={
                        showErrors &&
                        errors.city
                          ? "input-error"
                          : ""
                      }
                    />

                    {showErrors &&
                      errors.city && (
                        <small className="field-error">
                          {errors.city}
                        </small>
                      )}

                  </label>

                </div>

                <label>

                  Estado

                  <input
                    type="text"
                    value={
                      formData.state
                    }
                    readOnly
                    placeholder="Estado"
                  />

                </label>

              </div>

            </section>

          )}

          {/* =========================
              OBSERVAÇÕES
          ========================== */}

          <section className="checkout-section">

            <div className="checkout-section-title">

              <span>
                {deliveryMethod ===
                "delivery"
                  ? "04"
                  : "03"}
              </span>

              <div>

                <h2>
                  Observações
                </h2>

                <p>
                  Alguma informação especial
                  sobre seu pedido?
                </p>

              </div>

            </div>

            <textarea
              className="checkout-textarea"
              value={
                formData.observation
              }
              onChange={(event) =>
                handleChange(
                  "observation",
                  event.target.value
                )
              }
              placeholder="Ex.: entregar na portaria, tocar a campainha..."
            />

          </section>

          {/* =========================
              CONTINUAR
          ========================== */}

          <button
            type="button"
            className="checkout-continue"
            onClick={handleContinue}
          >

            Continuar para revisão

            <span>
              →
            </span>

          </button>

        </div>

        {/* =========================
            RESUMO
        ========================== */}

        <aside className="checkout-summary">

          <div className="summary-header">

            <span className="eyebrow">
              SEU PEDIDO
            </span>

            <h2>
              Resumo
            </h2>

          </div>

          {cartItems.length ===
          0 ? (

            <div className="summary-product">

              <div className="summary-product-image">

                <span>
                  ♡
                </span>

              </div>

              <div>

                <strong>
                  Seu carrinho está vazio
                </strong>

                <span>
                  Volte ao ateliê para
                  escolher suas flores.
                </span>

              </div>

            </div>

          ) : (

            <div className="checkout-products">

              {cartItems.map(
                (item) => (

                  <div
                    className="checkout-product"
                    key={item.id}
                  >

                    <div className="checkout-product-image">

                      <img
                        src={item.image}
                        alt={item.name}
                      />

                      <span>
                        {item.quantity}
                      </span>

                    </div>

                    <div className="checkout-product-info">

                      <strong>
                        {item.name}
                      </strong>

                      <span>
                        {item.quantity}{" "}
                        {item.quantity === 1
                          ? "unidade"
                          : "unidades"}
                      </span>

                    </div>

                    <strong>
                      {formatPrice(
                        item.price *
                          item.quantity
                      )}
                    </strong>

                  </div>

                )
              )}

            </div>

          )}

          <div className="summary-line">

            <span>
              Subtotal ({totalItems}{" "}
              {totalItems === 1
                ? "item"
                : "itens"})
            </span>

            <strong>
              {formatPrice(subtotal)}
            </strong>

          </div>

          <div className="summary-line">

            <span>
              {deliveryMethod ===
              "delivery"
                ? "Entrega"
                : "Retirada no ateliê"}
            </span>

            <strong>

              {deliveryFee === 0
                ? "Grátis"
                : formatPrice(
                    deliveryFee
                  )}

            </strong>

          </div>

          <div className="summary-total">

            <span>
              Total
            </span>

            <strong>
              {formatPrice(total)}
            </strong>

          </div>

          <p className="summary-security">
            Seus dados serão utilizados
            somente para processar seu
            pedido.
          </p>

        </aside>

      </div>

    </main>
  );
}
