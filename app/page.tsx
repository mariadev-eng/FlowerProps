"use client";

import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import ProductCard from "./components/ProductCard";
import Cart from "./components/Cart";
import { supabase } from "../lib/supabase";
import Link from "next/link";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: number;
  image: string | null;
  available: boolean;
  featured?: boolean;
};

type CartItem = Product & {
  quantity: number;
};

const categories = [
  {
    id: 1,
    slug: "buques",
    name: "Buquês",
    description: "Para surpreender",
    image:
      "https://stqpsaaxejtjhkbyapys.supabase.co/storage/v1/object/public/banners/buquehero.jpeg",
  },
  {
    id: 3,
    slug: "presentes",
    name: "Presentes",
    description: "Flores + carinho",
    image:
      "https://stqpsaaxejtjhkbyapys.supabase.co/storage/v1/object/public/banners/presentehero.jpeg",
  },
  {
    id: 4,
    slug: "acessorios",
    name: "Acessórios",
    description: "Detalhes que encantam",
    image:
      "https://stqpsaaxejtjhkbyapys.supabase.co/storage/v1/object/public/banners/acessorioshero.jpeg",
  },
];

// ================================
// CATEGORIAS (função utilitária)
// ================================

function getCategoryName(categoryId: number) {
  switch (categoryId) {
    case 1:
      return "Buquês";
    case 3:
      return "Presentes";
    case 4:
      return "Acessórios";
    default:
      return "FLOWER";
  }
}

export default function Home() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [topProductIds, setTopProductIds] = useState<number[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isProductsLoading, setIsProductsLoading] = useState(true);

  // ================================
  // PESQUISA
  // ================================

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // ================================
  // CARREGAR PRODUTOS DO SUPABASE
  // ================================

  useEffect(() => {
    async function loadProducts() {
      setIsProductsLoading(true);

      const { data, error } = await supabase.from("products").select("*");

      console.log("=== FLOWER / SUPABASE ===");
      console.log("Produtos:", data);
      console.log("Erro:", error);

      if (error) {
        console.error("ERRO SUPABASE:", error);
        setProducts([]);
      } else {
        setProducts(data ?? []);
      }

      setIsProductsLoading(false);
    }

    async function loadTopProducts() {
      try {
        const { data, error } = await supabase.rpc("get_top_products", {
          limit_count: 4,
        });

        if (error) {
          console.error("Erro ao buscar mais vendidos:", error);
          return;
        }

        const topIds = (data ?? []).map((item: any) => item.product_id);
        setTopProductIds(topIds);

        console.log("=== TOP PRODUTOS ===");
        console.log("Top IDs:", topIds);
      } catch (err) {
        console.error("Erro no ranking:", err);
      }
    }

    loadProducts();
    loadTopProducts();
  }, []);

  // ================================
  // AUTOPLAY DAS CATEGORIAS (MOBILE)
  // ================================

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initAutoplay = () => {
      if (window.innerWidth > 700) return;

      const grid = document.querySelector(
        ".category-grid"
      ) as HTMLElement | null;
      if (!grid) return;

      const cards = grid.querySelectorAll(".category-card");
      const totalCards = cards.length;
      if (totalCards === 0) return;

      let currentIndex = 0;
      let interval: ReturnType<typeof setInterval> | null = null;

      const startAutoplay = () => {
        interval = setInterval(() => {
          currentIndex = (currentIndex + 1) % totalCards;
          const card = cards[currentIndex] as HTMLElement;

          if (card) {
            grid.scrollTo({
              left: card.offsetLeft - grid.offsetLeft,
              behavior: "smooth",
            });
          }
        }, 4000);
      };

      const stopAutoplay = () => {
        if (interval) clearInterval(interval);
        interval = null;
      };

      startAutoplay();

      grid.addEventListener("touchstart", stopAutoplay);
      grid.addEventListener("touchend", () => {
        setTimeout(startAutoplay, 5000);
      });
    };

    const timeout = setTimeout(initAutoplay, 500);

    return () => clearTimeout(timeout);
  }, [products]);

  // ================================
  // RECUPERAR CARRINHO
  // ================================

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

  // ================================
  // SALVAR CARRINHO
  // ================================

  useEffect(() => {
    if (!isLoaded) return;

    localStorage.setItem("flower-cart", JSON.stringify(cartItems));
  }, [cartItems, isLoaded]);

  // ================================
  // ADICIONAR AO CARRINHO
  // ================================

  function addToCart(product: Product) {
    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.id === product.id
      );

      if (existingItem) {
        return currentItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...currentItems, { ...product, quantity: 1 }];
    });

    setIsCartOpen(true);
  }

  // ================================
  // REMOVER DO CARRINHO
  // ================================

  function removeFromCart(id: number) {
    setCartItems((currentItems) =>
      currentItems.filter((item) => item.id !== id)
    );
  }

  // ================================
  // AUMENTAR QUANTIDADE
  // ================================

  function increaseQuantity(id: number) {
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  }

  // ================================
  // DIMINUIR QUANTIDADE
  // ================================

  function decreaseQuantity(id: number) {
    setCartItems((currentItems) =>
      currentItems
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  // ================================
  // ABRIR PESQUISA
  // ================================

  function openSearch() {
    setIsSearchOpen(true);

    setTimeout(() => {
      const input = document.getElementById(
        "flower-search"
      ) as HTMLInputElement | null;

      input?.focus();
    }, 100);
  }

  // ================================
  // FECHAR PESQUISA
  // ================================

  function closeSearch() {
    setIsSearchOpen(false);
    setSearchTerm("");
  }

  // ================================
  // FILTRAR PRODUTOS
  // ================================

  const filteredProducts = products.filter((product) => {
    const search = searchTerm.toLowerCase().trim();

    if (!search) {
      return true;
    }

    const categoryName = getCategoryName(product.category_id);

    return (
      product.name.toLowerCase().includes(search) ||
      product.description.toLowerCase().includes(search) ||
      categoryName.toLowerCase().includes(search)
    );
  });

  // ================================
  // QUANTIDADE DO CARRINHO
  // ================================

  const cartQuantity = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  // ================================
  // IMAGEM PADRÃO
  // ================================

  const fallbackImage =
    "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=85";

  return (
    <main>
       
      {/* ==================== MENU ==================== */}

      <header className="site-header">
        <div className="header-content">
          <a href="#inicio" className="brand" aria-label="FLOWER">
            <img
              src="/images/logoflowerprops.png"
              alt="FLOWER Buquês & Acessórios"
              className="brand-logo"
            />
          </a>

          <nav className="desktop-nav">
            <a href="#inicio">Início</a>
            <a href="#produtos">Buquês</a>
            <a href="#categorias">Categorias</a>
            <a href="#assinaturas">Assinaturas</a>
            <a href="#sobre">Sobre nós</a>
          </nav>

          <div className="header-actions">
            <button
              type="button"
              aria-label="Pesquisar produtos"
              onClick={openSearch}
            >
              ⌕
            </button>

            <button
              type="button"
              aria-label="Minha conta"
              onClick={() => router.push("/conta")}
            >
              <UserRound size={20} strokeWidth={1.5} />
            </button>

            <button
              type="button"
              aria-label="Carrinho"
              onClick={() => setIsCartOpen(true)}
              className="cart-button"
            >
              ♡
              {cartQuantity > 0 && (
                <span className="cart-count">{cartQuantity}</span>
              )}
            </button>
          </div>
        </div>

        {/* ==================== PESQUISA ==================== */}

        {isSearchOpen && (
          <div className="search-bar">
            <div className="search-bar-inner">
              <span className="search-icon">⌕</span>

              <input
                id="flower-search"
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    closeSearch();
                  }
                }}
                placeholder="O que você está procurando?"
                aria-label="Pesquisar produtos"
                autoComplete="off"
              />

              <button
                type="button"
                onClick={closeSearch}
                aria-label="Fechar pesquisa"
                className="search-close"
              >
                ×
              </button>
            </div>

            {searchTerm.trim() && (
              <div className="search-results">
                {filteredProducts.length === 0 ? (
                  <div className="search-no-results">
                    <span>♡</span>
                    <p>Nenhum produto encontrado.</p>
                    <small>
                      Tente buscar por outro nome ou categoria.
                    </small>
                  </div>
                ) : (
                  <div className="search-results-list">
                    {filteredProducts.slice(0, 6).map((product) => (
                      <button
                        type="button"
                        className="search-result-item"
                        key={product.id}
                        onClick={() => {
                          closeSearch();

                          setTimeout(() => {
                            const element = document.getElementById(
                              `product-${product.id}`
                            );

                            element?.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
                          }, 50);
                        }}
                      >
                        <div className="search-result-image">
                          <img
                            src={product.image || fallbackImage}
                            alt={product.name}
                          />
                        </div>

                        <div className="search-result-info">
                          <span>
                            {getCategoryName(product.category_id)}
                          </span>
                          <strong>{product.name}</strong>
                        </div>

                        <div className="search-result-price">
                          {product.price.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </header>

      {/* ==================== CARRINHO ==================== */}

      <Cart
        items={cartItems}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onRemove={removeFromCart}
        onIncrease={increaseQuantity}
        onDecrease={decreaseQuantity}
      />

      {/* ==================== HERO ==================== */}

      <section className="hero" id="inicio">
        <div className="hero-image" />

        <div className="hero-content">
          <span className="eyebrow">BUQUÊS & ACESSÓRIOS</span>

          <h1>
            Flores que
            <br />
            <em>contam histórias.</em>
          </h1>

          <p>
            Encontre o buquê perfeito para transformar momentos especiais em
            memórias inesquecíveis.
          </p>

          <div className="hero-buttons">
            <a href="#produtos" className="button button-primary">
              Comprar flores
            </a>

            <a href="#assinaturas" className="button button-outline">
              Conhecer assinaturas
            </a>
          </div>
        </div>
      </section>

      {/* ==================== CATEGORIAS ==================== */}

      <section className="categories section" id="categorias">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ENCONTRE O QUE PROCURA</span>
            <h2>Flores para cada momento</h2>
          </div>

          <a href="#produtos" className="text-link">
            Ver todos →
          </a>
        </div>

        <div className="category-grid">
          {categories.map((category) => (
            <Link
              href={`/categories/${category.slug}`}
              className="category-card"
              key={category.id}
            >
              <img src={category.image} alt={category.name} />
              <div className="category-overlay">
                <span>{category.description}</span>
                <h3>{category.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ==================== ASSINATURA / FLORES SEMANAIS ==================== */}

      <section className="subscription" id="assinaturas">
        <div className="subscription-image" />

        <div className="subscription-content">
          <span className="eyebrow">FLOWER EM CASA</span>

          <h2>
            Flores novas,
            <br />
            <em>sempre.</em>
          </h2>

          <p>
            Escolha a frequência que combina com você e receba flores frescas
            em casa, selecionadas especialmente para cada entrega.
          </p>

          <div className="subscription-options">
            <div>
              <strong>01</strong>
              <span>Escolha seu estilo</span>
            </div>

            <div>
              <strong>02</strong>
              <span>Escolha a frequência</span>
            </div>

            <div>
              <strong>03</strong>
              <span>Receba suas flores</span>
            </div>
          </div>

          <Link href="/assinaturas" className="button button-light">
            Criar minha assinatura
          </Link>
        </div>
      </section>

      {/* ==================== PRODUTOS / MAIS PEDIDOS ==================== */}

      <section className="products section" id="produtos">
        <div className="section-heading centered">
          <span className="eyebrow">MAIS DESEJADOS</span>

          <h2>
            {searchTerm ? "Resultados da pesquisa" : "Escolha seu produto"}
          </h2>

          <p>
            {searchTerm
              ? `Resultados para "${searchTerm}"`
              : "Composições feitas para presentear, celebrar ou simplesmente deixar o dia mais bonito."}
          </p>
        </div>

        {isProductsLoading ? (
          <div className="products-loading">
            <p>Carregando nossos produtos...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="products-empty">
            <p>Nenhum produto encontrado.</p>

            {searchTerm && (
              <button
                type="button"
                className="button button-outline dark"
                onClick={() => setSearchTerm("")}
              >
                Limpar pesquisa
              </button>
            )}
          </div>
        ) : (
          <div className="product-grid">
            {(() => {
              let featured = products.filter((p) =>
                topProductIds.includes(p.id)
              );

              if (featured.length < 4) {
                const featuredProducts = products.filter(
                  (p: any) =>
                    p.featured === true && !topProductIds.includes(p.id)
                );
                featured = [...featured, ...featuredProducts];
              }

              if (featured.length < 4) {
                const others = products.filter(
                  (p) =>
                    !topProductIds.includes(p.id) &&
                    !featured.some((f) => f.id === p.id)
                );
                featured = [
                  ...featured,
                  ...others.slice(0, 4 - featured.length),
                ];
              }

              return featured.slice(0, 4).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ));
            })()}
          </div>
        )}
      </section>

      {/* ==================== SOBRE ==================== */}

      <section className="about section" id="sobre">
        <span className="eyebrow">O ATELIÊ FLOWER</span>

        <h2>
          Mais do que flores.
          <br />
          <em>Momentos.</em>
        </h2>

        <p>
          No Ateliê FLOWER, cada composição é pensada para transmitir
          sentimentos, celebrar pessoas e transformar pequenos momentos em
          grandes lembranças.
        </p>
      </section>

      {/* ==================== FOOTER ==================== */}

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