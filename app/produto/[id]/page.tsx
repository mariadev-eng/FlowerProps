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
  // 10 flores
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
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [currentImage, setCurrentImage] = useState<string>("");
  const [error, setError] = useState("");

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // ==========================================
  // CARREGA PRODUTO
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

      // 🎯 Define a imagem inicial
      const activeColors = (data.colors || []).filter(
        (c: ProductColor) => c.active
      );

      if (activeColors.length > 0) {
        setSelectedColor(activeColors[0]);
        setCurrentImage(activeColors[0].image);
      } else {
        setCurrentImage(data.image || "");
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
      const image = prod[`flower_${i}_image` as keyof Product] as string | null;

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
  // TOGGLE FLOR
  // ==========================================

  function toggleFlower(flower: Flower) {
    setSelectedFlowers((current) => {
      const exists = current.find((f) => f.name === flower.name);

      if (exists) {
        return current.filter((f) => f.name !== flower.name);
      }

      return [...current, flower];
    });

    setError("");
  }

  function isSelected(flower: Flower): boolean {
    return selectedFlowers.some((f) => f.name === flower.name);
  }

  // ==========================================
  // ADICIONA AO CARRINHO
  // ==========================================

  function addToCart() {
    if (!product) return;

    const activeColors = getActiveColors();

    // Se tem cores, precisa escolher
    if (activeColors.length > 0 && !selectedColor) {
      setError("Escolha uma cor para continuar.");
      return;
    }

    // Se precisa de flores, valida
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
          {/* COLUNA ESQUERDA: IMAGEM + BOLINHAS */}
          <div className="product-detail-left">
            <div className="product-detail-image">
              {currentImage ? (
                <img src={currentImage} alt={product.name} />
              ) : (
                <div className="product-detail-placeholder">🌸</div>
              )}
            </div>

            {/* 🎯 BOLINHAS DE COR */}
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
          </div>

          {/* COLUNA DIREITA: INFO + FLORES */}
          <div className="product-detail-info">
            <span className="eyebrow">FLOWER PROPS</span>
            <h1>{product.name}</h1>
            <p>{product.description}</p>

            <div className="product-detail-price">
              {formatPrice(product.price)}
            </div>
            <p className="product-detail-note">
  🌸 Imagem ilustrativa — sua composição será feita com as flores
  escolhidas por você.
</p>

            {/* SELETOR DE FLORES */}
            {product.requires_flower_selection && (
              <div className="product-flowers">
                <div className="product-flowers-heading">
  <h2>Escolha suas flores</h2>
  <span>
    {selectedFlowers.length}{" "}
    {selectedFlowers.length === 1
      ? "flor escolhida"
      : "flores escolhidas"}
  </span>
</div>

<p className="product-flowers-note">
  As flores são da estação — a composição final pode variar conforme
  a disponibilidade da semana.
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
                  <div className="product-flowers-list">
                    {availableFlowers.map((flower) => (
                      <button
                        key={flower.name}
                        type="button"
                        className={`product-flower-row ${
                          isSelected(flower) ? "active" : ""
                        }`}
                        onClick={() => toggleFlower(flower)}
                      >
                        <div className="product-flower-thumb">
                          {flower.image ? (
                            <img src={flower.image} alt={flower.name} />
                          ) : (
                            <span>🌸</span>
                          )}
                        </div>

                        <span className="product-flower-label">
                          {flower.name}
                        </span>

                        <span className="product-flower-checkbox">
                          {isSelected(flower) ? "✓" : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ERRO */}
            {error && (
              <div className="account-message error">{error}</div>
            )}

            {/* BOTÃO */}
            <button
              type="button"
              className="product-detail-button"
              onClick={addToCart}
              disabled={
                product.requires_flower_selection && !hasFlowers
              }
            >
              Adicionar ao carrinho
              <span>→</span>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}