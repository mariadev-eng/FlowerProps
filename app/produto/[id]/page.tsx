"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { UserRound } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import UserMenu from "../../components/UserMenu";

type ProductColor = {
  name: string;
  hex: string;
  image: string;
  active: boolean;
};

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: number;
  image: string | null;
  available: boolean;
  requires_flower_selection: boolean;
  colors: ProductColor[] | null;
  included_complements?: string[] | null;
  is_complement?: boolean;
  complement_order?: number;
  max_flowers?: number | null;
  requires_packaging?: boolean | null;
  flower_1_name: string | null;
  flower_1_image: string | null;
  flower_2_name: string | null;
  flower_2_image: string | null;
  flower_3_name: string | null;
  flower_3_image: string | null;
  flower_4_name: string | null;
  flower_4_image: string | null;
  flower_5_name: string | null;
  flower_5_image: string | null;
  flower_6_name: string | null;
  flower_6_image: string | null;
  flower_7_name: string | null;
  flower_7_image: string | null;
  flower_8_name: string | null;
  flower_8_image: string | null;
  flower_9_name: string | null;
  flower_9_image: string | null;
  flower_10_name: string | null;
  flower_10_image: string | null;
};

type CartItem = Product & {
  quantity: number;
  selected_flowers?: Array<{ name: string; image: string; extra_price?: number }>;
  selected_color?: string;
  extra_from_flowers?: number;
  custom_message?: string;
  selected_papers?: Array<{
    id: string;
    name: string;
    model: string | null;
    image: string | null;
  }>;
  selected_ribbon?: {
    id: string;
    name: string;
    image: string | null;
  } | null;
};

type Flower = {
  name: string;
  image: string;
  extra_price?: number;
};

type PackagingOption = {
  id: string;
  type: "paper" | "ribbon";
  name: string;
  model: string | null;
  packaging_unit: string | null;
  description: string | null;
  image: string | null;
  active: boolean;
  display_order: number;
};

export default function ProdutoPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Number(params?.id);

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedFlowers, setSelectedFlowers] = useState<Flower[]>([]);
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(
    null
  );
  const [currentImage, setCurrentImage] = useState<string>("");
  const [error, setError] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const MESSAGE_MAX = 100;

  const [complements, setComplements] = useState<Product[]>([]);
  const [weeklyFlowers, setWeeklyFlowers] = useState<Flower[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 🆕 Finalização
  const [packagingPapers, setPackagingPapers] = useState<PackagingOption[]>([]);
  const [packagingRibbons, setPackagingRibbons] = useState<PackagingOption[]>([]);
  const [selectedPapers, setSelectedPapers] = useState<PackagingOption[]>([]);
  const [selectedRibbon, setSelectedRibbon] = useState<PackagingOption | null>(
    null
  );

  // 🆕 Controle dos drawers
  const [isFlowersDrawerOpen, setIsFlowersDrawerOpen] = useState(false);
  const [isFinalizationDrawerOpen, setIsFinalizationDrawerOpen] =
    useState(false);

  useEffect(() => {
    async function loadProduct() {
      if (!productId) {
        router.push("/");
        return;
      }

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (error || !data) {
        console.error("Erro ao carregar produto:", error);
        router.push("/");
        return;
      }

      setProduct(data);

      const activeColors = (data.colors || []).filter(
        (c: ProductColor) => c.active
      );

      if (activeColors.length > 0) {
        setSelectedColor(activeColors[0]);
        setCurrentImage(activeColors[0].image);
      } else {
        setCurrentImage(data.image || "");
      }

      const { data: flowersData } = await supabase
        .from("weekly_flowers")
        .select("*")
        .eq("active", true)
        .order("position", { ascending: true });

      if (flowersData) {
        const filtered = flowersData.filter((f) => {
          const allowed: string[] = f.allowed_products || [];
          return allowed.includes(data.name);
        });

        setWeeklyFlowers(
          filtered.map((f) => ({
            name: f.name,
            image: f.image || "",
            extra_price: Number(f.extra_price) || 0,
          }))
        );
      }

      // PAPELARIA E FITAS
      if (data.requires_packaging) {
        const { data: packagingData } = await supabase
          .from("packaging_options")
          .select("*")
          .eq("active", true)
          .order("display_order", { ascending: true });

        if (packagingData) {
          setPackagingPapers(
            packagingData.filter((p) => p.type === "paper")
          );
          setPackagingRibbons(
            packagingData.filter((p) => p.type === "ribbon")
          );
        }
      }

      if (data.category_id !== 4) {
        const { data: complementsData, error: complementsError } =
          await supabase
            .from("products")
            .select("*")
            .eq("is_complement", true)
            .order("complement_order", { ascending: true });

        if (complementsError) {
          console.error("Erro ao carregar complementos:", complementsError);
          setComplements([]);
        } else {
          const alreadyIncluded = (data.included_complements || []).map(
            (s: string) => s.toLowerCase().trim()
          );

          const filteredComp = (complementsData ?? []).filter(
            (c: Product) =>
              !alreadyIncluded.includes(c.name.toLowerCase().trim())
          );

          setComplements(filteredComp);
        }
      } else {
        setComplements([]);
      }

      setIsLoading(false);
    }

    loadProduct();
  }, [productId, router]);

  useEffect(() => {
    const savedCart = localStorage.getItem("flower-cart");

    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch {
        localStorage.removeItem("flower-cart");
      }
    }

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("flower-cart", JSON.stringify(cartItems));
  }, [cartItems, isLoaded]);

  function getAvailableFlowers(): Flower[] {
    return weeklyFlowers;
  }

  function getFlowersExtra(): number {
    return selectedFlowers.reduce(
      (sum, f) => sum + (f.extra_price || 0),
      0
    );
  }

  function handleSelectColor(color: ProductColor) {
    setSelectedColor(color);
    setCurrentImage(color.image);
  }

  function getActiveColors(): ProductColor[] {
    if (!product?.colors) return [];
    return product.colors.filter((c) => c.active);
  }

  function toggleFlower(flower: Flower) {
    let blocked = false;

    setSelectedFlowers((current) => {
      const exists = current.find((f) => f.name === flower.name);

      if (exists) {
        return current.filter((f) => f.name !== flower.name);
      }

      if (product?.max_flowers && current.length >= product.max_flowers) {
        blocked = true;
        return current;
      }

      return [...current, flower];
    });

    if (blocked) {
      setError(
        `Você pode escolher no máximo ${product?.max_flowers} ${
          product?.max_flowers === 1 ? "flor" : "flores"
        }.`
      );
    } else {
      setError("");
    }
  }

  function isSelected(flower: Flower): boolean {
    return selectedFlowers.some((f) => f.name === flower.name);
  }

  function isFlowerBlocked(flower: Flower): boolean {
    if (!product?.max_flowers) return false;
    if (isSelected(flower)) return false;
    return selectedFlowers.length >= product.max_flowers;
  }

  // ==========================================
  // 🆕 FINALIZAÇÃO — PAPELARIA E FITA
  // ==========================================

  function togglePaper(paper: PackagingOption) {
    setSelectedPapers((current) => {
      const exists = current.find((p) => p.id === paper.id);

      if (exists) {
        return current.filter((p) => p.id !== paper.id);
      }

      if (current.length >= 2) {
        setError("Você pode escolher no máximo 2 papéis.");
        return current;
      }

      return [...current, paper];
    });
  }

  function toggleRibbon(ribbon: PackagingOption) {
    setSelectedRibbon((current) =>
      current?.id === ribbon.id ? null : ribbon
    );
  }

  function addComplementToCart(complement: Product) {
    const cartItem: CartItem = {
      ...complement,
      quantity: 1,
      image: complement.image,
    };

    setCartItems((current) => {
      const existingIndex = current.findIndex(
        (item) => item.id === complement.id && !item.selected_flowers
      );

      if (existingIndex >= 0) {
        return current.map((item, i) =>
          i === existingIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...current, cartItem];
    });
  }

  function addToCart() {
    if (!product) return;

    const activeColors = getActiveColors();

    if (activeColors.length > 0 && !selectedColor) {
      setError("Escolha uma cor para continuar.");
      return;
    }

    if (product.requires_flower_selection) {
      if (selectedFlowers.length === 0) {
        setError("Escolha pelo menos 1 flor para continuar.");
        return;
      }
    }

    // 🆕 Valida finalização
    if (product.requires_packaging) {
      if (selectedPapers.length === 0) {
        setError("Escolha a finalização do seu produto (papelaria).");
        return;
      }

      if (!selectedRibbon) {
        setError("Escolha a finalização do seu produto (fita).");
        return;
      }
    }

    const extraFromFlowers = getFlowersExtra();

    const cartItem: CartItem = {
      ...product,
      quantity: 1,
      price: product.price + extraFromFlowers,
      selected_flowers:
        selectedFlowers.length > 0 ? selectedFlowers : undefined,
      selected_color: selectedColor?.name,
      image: currentImage || product.image,
      extra_from_flowers: extraFromFlowers,
      custom_message: customMessage.trim() || undefined,
      selected_papers:
        selectedPapers.length > 0
          ? selectedPapers.map((p) => ({
              id: p.id,
              name: p.name,
              model: p.model,
              image: p.image,
            }))
          : undefined,
      selected_ribbon: selectedRibbon
        ? {
            id: selectedRibbon.id,
            name: selectedRibbon.name,
            image: selectedRibbon.image,
          }
        : null,
    };

    setCartItems((current) => {
      const existingIndex = current.findIndex(
        (item) =>
          item.id === product.id &&
          item.selected_color === cartItem.selected_color &&
          JSON.stringify(item.selected_flowers) ===
            JSON.stringify(cartItem.selected_flowers)
      );

      if (existingIndex >= 0) {
        return current.map((item, i) =>
          i === existingIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...current, cartItem];
    });

    router.push("/checkout");
  }

  function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  if (isLoading || !product) {
    return (
      <main className="product-page">
        <div className="checkout-container">
          <p>Carregando produto...</p>
        </div>
      </main>
    );
  }

  const availableFlowers = getAvailableFlowers();
  const hasFlowers = availableFlowers.length > 0;
  const activeColors = getActiveColors();
  const hasColors = activeColors.length > 0;
  const flowersExtra = getFlowersExtra();
  const finalPrice = product.price + flowersExtra;

  return (
    <main className="product-page">
      <header className="site-header">
        <div className="header-content">
          <Link href="/" className="brand" aria-label="FLOWER">
            <img
              src="/images/logoflowerprops.png"
              alt="FLOWER"
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
            <UserMenu />
          </div>
        </div>
      </header>

      <section className="product-detail section">
        <Link href="/" className="product-back">
          ← Voltar
        </Link>

        <div className="product-detail-grid">
          <div className="product-detail-top">
            <span className="eyebrow">FLOWER PROPS</span>
            <h1>{product.name}</h1>
            <div className="product-detail-price">
              {formatPrice(finalPrice)}
            </div>
          </div>

          {/* 🖼️ IMAGEM + MENSAGEM */}
          <div className="product-detail-image-wrapper">
            <div className="product-detail-image">
              {currentImage ? (
                <img src={currentImage} alt={product.name} />
              ) : (
                <div className="product-detail-placeholder">🌸</div>
              )}
            </div>

            {/* 💌 MENSAGEM PERSONALIZADA */}
            {product.requires_flower_selection && (
              <div className="product-message">
                <div className="product-message-header">
                  <div>
                    <span className="product-message-label">
                      Uma mensagem especial
                    </span>
                    <span className="product-message-sublabel">
                      Escreva algo pro destinatário (opcional)
                    </span>
                  </div>
                </div>

                <textarea
                  id="custom-message"
                  value={customMessage}
                  onChange={(e) => {
                    if (e.target.value.length <= MESSAGE_MAX) {
                      setCustomMessage(e.target.value);
                    }
                  }}
                  placeholder="Ex: Feliz aniversário, te amo!"
                  maxLength={MESSAGE_MAX}
                  rows={3}
                  className="product-message-input"
                />

                <span
                  className={`product-message-count ${
                    customMessage.length >= MESSAGE_MAX ? "limit" : ""
                  }`}
                >
                  {customMessage.length}/{MESSAGE_MAX}
                </span>
              </div>
            )}
          </div>

          {/* INFO */}
          <div className="product-detail-info">
            <span className="eyebrow">FLOWER PROPS</span>
            <h1>{product.name}</h1>
            <p className="product-detail-description">
              {product.description}
            </p>

            <div className="product-detail-price">
              {formatPrice(finalPrice)}
              {flowersExtra > 0 && (
                <span
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#166534",
                    marginTop: 6,
                    fontFamily: "system-ui",
                    letterSpacing: 0,
                  }}
                >
                  (inclui {formatPrice(flowersExtra)} de flores adicionais)
                </span>
              )}
            </div>

            {hasColors && (
              <div className="product-colors">
                <div className="product-colors-dots">
                  {activeColors.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      className={`product-color-dot ${
                        selectedColor?.name === color.name ? "active" : ""
                      }`}
                      onClick={() => handleSelectColor(color)}
                      aria-label={`Cor ${color.name}`}
                      title={color.name}
                    >
                      <span
                        className="product-color-swatch"
                        style={{ background: color.hex }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.requires_flower_selection && (
              <p className="product-detail-note">
                Imagem ilustrativa — sua composição será feita com as flores
                escolhidas por você.
              </p>
            )}

            {/* 🌸 BOTÃO: ESCOLHA SUAS FLORES */}
            {product.requires_flower_selection && (
              <div style={{ marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => setIsFlowersDrawerOpen(true)}
                  disabled={!hasFlowers}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "16px 20px",
                    background: "#fff",
                    border:
                      selectedFlowers.length > 0
                        ? "2px solid #166534"
                        : "1px solid #d1d5db",
                    borderRadius: 8,
                    cursor: !hasFlowers ? "not-allowed" : "pointer",
                    textAlign: "left",
                    fontFamily: "inherit",
                    opacity: !hasFlowers ? 0.5 : 1,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#7a7a72",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: 4,
                      }}
                    >
                      {selectedFlowers.length > 0
                        ? "✓ Escolhidas"
                        : "Passo 2"}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--serif)",
                        fontSize: 18,
                        fontWeight: 500,
                        color: "#3f493b",
                      }}
                    >
                      Escolha suas flores
                    </div>
                    {selectedFlowers.length > 0 && (
                      <div
                        style={{
                          fontSize: 12,
                          color: "#166534",
                          marginTop: 4,
                        }}
                      >
                        {selectedFlowers.length}{" "}
                        {selectedFlowers.length === 1
                          ? "flor escolhida"
                          : "flores escolhidas"}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 20, color: "#9ca3af" }}>→</span>
                </button>
              </div>
            )}

            {/* 🎀 BOTÃO: ESCOLHA A FINALIZAÇÃO */}
            {product.requires_packaging && (
              <div style={{ marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setIsFinalizationDrawerOpen(true)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "16px 20px",
                    background: "#fff",
                    border:
                      selectedPapers.length > 0 && selectedRibbon
                        ? "2px solid #166534"
                        : "1px solid #d1d5db",
                    borderRadius: 8,
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "inherit",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#7a7a72",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: 4,
                      }}
                    >
                      {selectedPapers.length > 0 && selectedRibbon
                        ? "✓ Escolhida"
                        : "Passo 3"}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--serif)",
                        fontSize: 18,
                        fontWeight: 500,
                        color: "#3f493b",
                      }}
                    >
                      Escolha a finalização do seu produto
                    </div>
                    {(selectedPapers.length > 0 || selectedRibbon) && (
                      <div
                        style={{
                          fontSize: 12,
                          color: "#166534",
                          marginTop: 4,
                        }}
                      >
                        {selectedPapers.length > 0 &&
                          selectedPapers.map((p) => p.name).join(", ")}
                        {selectedPapers.length > 0 && selectedRibbon && " · "}
                        {selectedRibbon && `Fita: ${selectedRibbon.name}`}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 20, color: "#9ca3af" }}>→</span>
                </button>
              </div>
            )}

            {error && (
              <div className="account-message error">{error}</div>
            )}
          </div>
        </div>

        {complements.length > 0 && product.category_id !== 4 && (
          <div className="product-complements">
            <div className="product-complements-heading">
              <h2>Complete seu presente</h2>
              <span>Combina com o que você escolheu</span>
            </div>

            <div className="product-complements-carousel">
              {complements.map((complement) => (
                <div
                  key={complement.id}
                  className="product-complement-card"
                >
                  <div className="product-complement-image">
                    {complement.image ? (
                      <img
                        src={complement.image}
                        alt={complement.name}
                      />
                    ) : (
                      <span>🎁</span>
                    )}
                  </div>

                  <div className="product-complement-info">
                    <span className="product-complement-name">
                      {complement.name}
                    </span>
                    <strong className="product-complement-price">
                      {formatPrice(complement.price)}
                    </strong>
                  </div>

                  <button
                    type="button"
                    className="product-complement-add"
                    onClick={() => addComplementToCart(complement)}
                    aria-label={`Adicionar ${complement.name} ao carrinho`}
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="product-detail-sticky-bar">
          <button
            type="button"
            className="product-detail-button"
            onClick={addToCart}
            disabled={product.requires_flower_selection && !hasFlowers}
          >
            Adicionar ao carrinho
            {flowersExtra > 0 && ` (${formatPrice(finalPrice)})`}
            <span>→</span>
          </button>
        </div>
      </section>

      {/* ========================================== */}
      {/* 🌸 DRAWER: ESCOLHA SUAS FLORES */}
      {/* ========================================== */}
      {product.requires_flower_selection && isFlowersDrawerOpen && (
        <DrawerShell onClose={() => setIsFlowersDrawerOpen(false)}>
          <DrawerHeader
            title="Escolha suas flores"
            subtitle={`${selectedFlowers.length} ${
              selectedFlowers.length === 1
                ? "flor escolhida"
                : "flores escolhidas"
            }`}
            onClose={() => setIsFlowersDrawerOpen(false)}
          />

          <div style={{ padding: 20, flex: 1, overflowY: "auto" }}>
            {!hasFlowers ? (
              <div
                style={{
                  textAlign: "center",
                  padding: 40,
                  color: "#7a7a72",
                }}
              >
                Flores da semana em atualização.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 10,
                }}
              >
                {availableFlowers.map((flower) => {
                  const blocked = isFlowerBlocked(flower);
                  const hasExtra = Number(flower.extra_price) > 0;

                  return (
                    <button
                      key={flower.name}
                      type="button"
                      onClick={() => toggleFlower(flower)}
                      disabled={blocked}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 6,
                        padding: 10,
                        background: isSelected(flower) ? "#f0fdf4" : "#fff",
                        border: isSelected(flower)
                          ? "2px solid #166534"
                          : "1px solid #e0e0dc",
                        borderRadius: 8,
                        cursor: blocked ? "not-allowed" : "pointer",
                        opacity: blocked ? 0.4 : 1,
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: "50%",
                          overflow: "hidden",
                          background: "#f2ece6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 22,
                        }}
                      >
                        {flower.image ? (
                          <img
                            src={flower.image}
                            alt={flower.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <span>🌸</span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          color: "#2f2a26",
                          textAlign: "center",
                          lineHeight: 1.2,
                        }}
                      >
                        {flower.name}
                      </span>
                      {hasExtra && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "#166534",
                          }}
                        >
                          +{formatPrice(flower.extra_price!)}
                        </span>
                      )}
                      {isSelected(flower) && (
                        <span
                          style={{
                            position: "absolute",
                            top: 6,
                            right: 6,
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            background: "#166534",
                            color: "#fff",
                            fontSize: 11,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <DrawerFooter
            onConfirm={() => setIsFlowersDrawerOpen(false)}
            disabled={selectedFlowers.length === 0}
          />
        </DrawerShell>
      )}

      {/* ========================================== */}
      {/* 🎀 DRAWER: ESCOLHA A FINALIZAÇÃO */}
      {/* ========================================== */}
      {product.requires_packaging && isFinalizationDrawerOpen && (
        <DrawerShell onClose={() => setIsFinalizationDrawerOpen(false)}>
          <DrawerHeader
            title="Escolha a finalização do seu produto"
            subtitle={`${selectedPapers.length}/2 papéis · ${
              selectedRibbon ? "1 fita" : "0 fita"
            }`}
            onClose={() => setIsFinalizationDrawerOpen(false)}
          />

          <div style={{ padding: 20, flex: 1, overflowY: "auto" }}>
            {/* PAPELARIA */}
            <div style={{ marginBottom: 32 }}>
              <h3
                style={{
                  margin: "0 0 4px",
                  fontFamily: "var(--serif)",
                  fontSize: 18,
                  fontWeight: 500,
                  color: "#3f493b",
                }}
              >
                Papelaria
              </h3>
              <p
                style={{
                  margin: "0 0 12px",
                  fontSize: 11,
                  color: "#7a7a72",
                }}
              >
                Escolha até 2 tipos de papel
              </p>

              {packagingPapers.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: 20,
                    color: "#7a7a72",
                  }}
                >
                  Nenhum papel cadastrado.
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 10,
                  }}
                >
                  {packagingPapers.map((paper) => {
                    const isSel = selectedPapers.some((p) => p.id === paper.id);

                    return (
                      <button
                        key={paper.id}
                        type="button"
                        onClick={() => togglePaper(paper)}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 6,
                          padding: 10,
                          background: isSel ? "#f0fdf4" : "#fff",
                          border: isSel
                            ? "2px solid #166534"
                            : "1px solid #e0e0dc",
                          borderRadius: 8,
                          cursor: "pointer",
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: "50%",
                            overflow: "hidden",
                            background: "#f2ece6",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 22,
                          }}
                        >
                          {paper.image ? (
                            <img
                              src={paper.image}
                              alt={paper.name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <span>📄</span>
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#2f2a26",
                            textAlign: "center",
                            lineHeight: 1.2,
                          }}
                        >
                          {paper.name}
                        </span>
                        {paper.model && (
                          <span
                            style={{
                              fontSize: 10,
                              color: "#7a7a72",
                              textAlign: "center",
                            }}
                          >
                            {paper.model}
                          </span>
                        )}
                        {isSel && (
                          <span
                            style={{
                              position: "absolute",
                              top: 6,
                              right: 6,
                              width: 18,
                              height: 18,
                              borderRadius: "50%",
                              background: "#166534",
                              color: "#fff",
                              fontSize: 11,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* FITA */}
            <div>
              <h3
                style={{
                  margin: "0 0 4px",
                  fontFamily: "var(--serif)",
                  fontSize: 18,
                  fontWeight: 500,
                  color: "#3f493b",
                }}
              >
                Fita
              </h3>
              <p
                style={{
                  margin: "0 0 12px",
                  fontSize: 11,
                  color: "#7a7a72",
                }}
              >
                Escolha 1 fita
              </p>

              {packagingRibbons.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: 20,
                    color: "#7a7a72",
                  }}
                >
                  Nenhuma fita cadastrada.
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 10,
                  }}
                >
                  {packagingRibbons.map((ribbon) => {
                    const isSel = selectedRibbon?.id === ribbon.id;

                    return (
                      <button
                        key={ribbon.id}
                        type="button"
                        onClick={() => toggleRibbon(ribbon)}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 6,
                          padding: 10,
                          background: isSel ? "#f0fdf4" : "#fff",
                          border: isSel
                            ? "2px solid #166534"
                            : "1px solid #e0e0dc",
                          borderRadius: 8,
                          cursor: "pointer",
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: "50%",
                            overflow: "hidden",
                            background: "#f2ece6",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 22,
                          }}
                        >
                          {ribbon.image ? (
                            <img
                              src={ribbon.image}
                              alt={ribbon.name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <span>🎀</span>
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#2f2a26",
                            textAlign: "center",
                            lineHeight: 1.2,
                          }}
                        >
                          {ribbon.name}
                        </span>
                        {ribbon.description && (
                          <span
                            style={{
                              fontSize: 10,
                              color: "#7a7a72",
                              textAlign: "center",
                            }}
                          >
                            {ribbon.description}
                          </span>
                        )}
                        {isSel && (
                          <span
                            style={{
                              position: "absolute",
                              top: 6,
                              right: 6,
                              width: 18,
                              height: 18,
                              borderRadius: "50%",
                              background: "#166534",
                              color: "#fff",
                              fontSize: 11,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <DrawerFooter
            onConfirm={() => setIsFinalizationDrawerOpen(false)}
            disabled={selectedPapers.length === 0 || !selectedRibbon}
          />
        </DrawerShell>
      )}
    </main>
  );
}

// ==========================================
// COMPONENTES DE DRAWER
// ==========================================

function DrawerShell({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <div        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 100,
        }}
      />

      <aside
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(560px, 100%)",
          background: "#fff",
          zIndex: 101,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
        }}
      >
        {children}
      </aside>
    </>
  );
}

function DrawerHeader({
  title,
  subtitle,
  onClose,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 24px",
        borderBottom: "1px solid #e0e0dc",
        flexShrink: 0,
      }}
    >
      <div>
        <h2
          style={{
            margin: 0,
            fontFamily: "var(--serif)",
            fontSize: 22,
            fontWeight: 500,
            color: "#3f493b",
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 12,
              color: "#7a7a72",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        style={{
          background: "transparent",
          border: 0,
          fontSize: 28,
          cursor: "pointer",
          color: "#2f2a26",
          lineHeight: 1,
          padding: 4,
        }}
      >
        ×
      </button>
    </div>
  );
}

function DrawerFooter({
  onConfirm,
  disabled,
}: {
  onConfirm: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      style={{
        padding: "16px 24px",
        borderTop: "1px solid #e0e0dc",
        flexShrink: 0,
        background: "#fff",
      }}
    >
      <button
        type="button"
        onClick={onConfirm}
        disabled={disabled}
        style={{
          width: "100%",
          padding: "14px 20px",
          background: disabled ? "#a3a3a3" : "#166534",
          color: "#fff",
          border: 0,
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        Confirmar
      </button>
    </div>
  );
}