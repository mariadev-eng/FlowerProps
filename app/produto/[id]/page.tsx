"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { UserRound } from "lucide-react";
import { supabase } from "../../../lib/supabase";

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
  max_flowers?: number | null; // 🆕
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
  selected_flowers?: Array<{ name: string; image: string }>;
  selected_color?: string;
};

type Flower = {
  name: string;
  image: string;
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

  const [complements, setComplements] = useState<Product[]>([]);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // ==========================================
  // CARREGA PRODUTO + COMPLEMENTOS
  // ==========================================

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

      // ==========================================
      // COMPLEMENTOS
      // ==========================================

      if (data.category_id !== 4) {
        const { data: complementsData, error: complementsError } =
          await supabase
            .from("products")
            .select("*")
            .eq("is_complement", true)
            .order("complement_order", { ascending: true });

        if (complementsError) {
          console.error(
            "Erro ao carregar complementos:",
            complementsError
          );
          setComplements([]);
        } else {
          const alreadyIncluded = (data.included_complements || []).map(
            (s: string) => s.toLowerCase().trim()
          );

          const filtered = (complementsData ?? []).filter(
            (c: Product) =>
              !alreadyIncluded.includes(c.name.toLowerCase().trim())
          );

          setComplements(filtered);
        }
      } else {
        setComplements([]);
      }

      setIsLoading(false);
    }

    loadProduct();
  }, [productId, router]);

  // ==========================================
  // RECUPERA CARRINHO
  // ==========================================

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

  // ==========================================
  // SALVA CARRINHO
  // ==========================================

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("flower-cart", JSON.stringify(cartItems));
  }, [cartItems, isLoaded]);

  // ==========================================
  // LISTA DE FLORES DISPONÍVEIS
  // ==========================================

  function getAvailableFlowers(prod: Product): Flower[] {
    const flowers: Flower[] = [];

    for (let i = 1; i <= 10; i++) {
      const name = prod[`flower_${i}_name` as keyof Product] as string | null;
      const image = prod[`flower_${i}_image` as keyof Product] as
        | string
        | null;

      if (name && name.trim()) {
        flowers.push({
          name: name.trim(),
          image: image || "",
        });
      }
    }

    return flowers;
  }

  // ==========================================
  // SELEÇÃO DE COR
  // ==========================================

  function handleSelectColor(color: ProductColor) {
    setSelectedColor(color);
    setCurrentImage(color.image);
  }

  function getActiveColors(): ProductColor[] {
    if (!product?.colors) return [];
    return product.colors.filter((c) => c.active);
  }

  // ==========================================
  // TOGGLE FLOR (com limite)
  // ==========================================

  function toggleFlower(flower: Flower) {
    let blocked = false; // 🆕

    setSelectedFlowers((current) => {
      const exists = current.find((f) => f.name === flower.name);

      // Se já tá selecionada, remove (sempre permite)
      if (exists) {
        return current.filter((f) => f.name !== flower.name);
      }

      // 🆕 Se tem limite e já atingiu, bloqueia
      if (product?.max_flowers && current.length >= product.max_flowers) {
        blocked = true;
        return current;
      }

      return [...current, flower];
    });

    // 🆕 Mostra ou limpa o erro
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

  // 🆕 Verifica se a flor tá bloqueada (não selecionada + limite atingido)
  function isFlowerBlocked(flower: Flower): boolean {
    if (!product?.max_flowers) return false;
    if (isSelected(flower)) return false;
    return selectedFlowers.length >= product.max_flowers;
  }

  // ==========================================
  // ADICIONA COMPLEMENTO AO CARRINHO
  // ==========================================

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

  // ==========================================
  // ADICIONA PRODUTO PRINCIPAL AO CARRINHO
  // ==========================================

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

    const cartItem: CartItem = {
      ...product,
      quantity: 1,
      selected_flowers:
        selectedFlowers.length > 0 ? selectedFlowers : undefined,
      selected_color: selectedColor?.name,
      image: currentImage || product.image,
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

  // ==========================================
  // LOADING
  // ==========================================

  if (isLoading || !product) {
    return (
      <main className="product-page">
        <div className="checkout-container">
          <p>Carregando produto...</p>
        </div>
      </main>
    );
  }

  const availableFlowers = getAvailableFlowers(product);
  const hasFlowers = availableFlowers.length > 0;
  const activeColors = getActiveColors();
  const hasColors = activeColors.length > 0;

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

      <section className="product-detail section">
        <Link href="/" className="product-back">
          ← Voltar
        </Link>

        <div className="product-detail-grid">
          <div className="product-detail-top">
            <span className="eyebrow">FLOWER PROPS</span>
            <h1>{product.name}</h1>
            <div className="product-detail-price">
              {formatPrice(product.price)}
            </div>
          </div>

          <div className="product-detail-image-wrapper">
            <div className="product-detail-image">
              {currentImage ? (
                <img src={currentImage} alt={product.name} />
              ) : (
                <div className="product-detail-placeholder">🌸</div>
              )}
            </div>
          </div>

          <div className="product-detail-info">
            <span className="eyebrow">FLOWER PROPS</span>
            <h1>{product.name}</h1>
            <p className="product-detail-description">
              {product.description}
            </p>

            <div className="product-detail-price">
              {formatPrice(product.price)}
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
                🌸 Imagem ilustrativa — sua composição será feita com as
                flores escolhidas por você.
              </p>
            )}

            {product.requires_flower_selection && (
              <div className="product-flowers">
                <div className="product-flowers-heading">
                  <h2>Escolha suas flores</h2>
                  <span>
                    {selectedFlowers.length}{" "}
                    {product.max_flowers
                      ? `/ ${product.max_flowers} `
                      : ""}
                    {selectedFlowers.length === 1
                      ? "flor escolhida"
                      : "flores escolhidas"}
                  </span>
                </div>

                {/* 🆕 AVISO DE LIMITE */}
                {product.max_flowers && (
                  <p className="product-flowers-limit">
                    Escolha somente {product.max_flowers}{" "}
                    {product.max_flowers === 1 ? "flor" : "flores"}.
                  </p>
                )}

                <p className="product-flowers-note">
                  As flores são da estação — a composição final pode
                  variar conforme a disponibilidade da semana.
                </p>

                {!hasFlowers ? (
                  <div className="product-flowers-empty">
                    <p>
                      🌸 Flores da semana em atualização.
                      <br />
                      Volte em breve ou entre em contato pelo WhatsApp.
                    </p>
                  </div>
                ) : (
                  <div className="product-flowers-grid">
                    {availableFlowers.map((flower) => {
                      const blocked = isFlowerBlocked(flower);

                      return (
                        <button
                          key={flower.name}
                          type="button"
                          className={`product-flower-card ${
                            isSelected(flower) ? "active" : ""
                          } ${blocked ? "blocked" : ""}`}
                          onClick={() => toggleFlower(flower)}
                          disabled={blocked}
                          aria-pressed={isSelected(flower)}
                        >
                          <div className="product-flower-card-image">
                            {flower.image ? (
                              <img
                                src={flower.image}
                                alt={flower.name}
                              />
                            ) : (
                              <span>🌸</span>
                            )}
                          </div>

                          <span className="product-flower-card-name">
                            {flower.name}
                          </span>

                          <span
                            className="product-flower-card-check"
                            aria-hidden="true"
                          >
                            {isSelected(flower) ? "✓" : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
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
            <span>→</span>
          </button>
        </div>
      </section>
    </main>
  );
}