"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/app/components/ProductCard";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Snow from "@/app/components/Snow";
import { useCart } from "@/app/contexts/CartContext";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  black_friday_price?: number | null;
  category_id: number;
  image: string | null;
  available: boolean;
  featured?: boolean;
};

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
};

function getCategoryName(categoryId: number) {
  switch (categoryId) {
    case 1: return "Buquês";
    case 3: return "Presentes";
    case 4: return "Acessórios";
    default: return "FLOWER";
  }
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [isSubsLoading, setIsSubsLoading] = useState(true);

  const { addToCart } = useCart();

  useEffect(() => {
    async function loadProducts() {
      setIsProductsLoading(true);
      const { data, error } = await supabase.from("products").select("*");
      if (error) {
        console.error("ERRO SUPABASE:", error);
        setProducts([]);
      } else {
        setProducts(data ?? []);
      }
      setIsProductsLoading(false);
    }

    async function loadSubscriptions() {
      setIsSubsLoading(true);
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("available", true)
        .order("display_order", { ascending: true });

      if (error) {
        console.error("ERRO ASSINATURAS:", error);
        setSubscriptions([]);
      } else {
        setSubscriptions(data ?? []);
      }
      setIsSubsLoading(false);
    }

    loadProducts();
    loadSubscriptions();
  }, []);

  const fallbackImage = "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=85";

  function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  return (
    <main>
      <Snow />

      <div className="announcement-bar">
        ✨ Black Friday: Descontos exclusivos em toda a loja. Aproveite!
      </div>

      {/* ==================== HERO ==================== */}
      <section className="hero" id="inicio">
        <div className="hero-image" />
        <div className="hero-content">
          <span className="eyebrow">BUQUÊS & ACESSÓRIOS</span>
          <h1>
            Flores que<br /><em>contam histórias.</em>
          </h1>
          <p>Encontre o buquê perfeito para transformar momentos especiais em memórias inesquecíveis.</p>
          <div className="hero-buttons">
            <Link href="/black-friday" className="button button-primary">
              Ver Ofertas Black Friday
            </Link>
            <a href="#assinaturas" className="button button-outline">Conhecer assinaturas</a>
          </div>
        </div>
      </section>

            {/* ==================== DESTAQUE BLACK FRIDAY (CARROSSEL DA HOME) ==================== */}
      <section className="categories section" id="black-friday">
        <div className="section-heading">
          <div>
            <span className="eyebrow" style={{ color: "#b88a44" }}>OFERTAS IMPERDÍVEIS</span>
            <h2 style={{ fontFamily: "var(--serif)", color: "#1e3a29" }}>BLACK <em>FRIDAY</em></h2>
            <p style={{ color: "#7a7a72", marginTop: "10px" }}>Aproveite descontos exclusivos em nossos produtos selecionados.</p>
          </div>
          <Link href="/black-friday" className="text-link">
            Ver todos →
          </Link>
        </div>

        <div className="product-grid">
          {(() => {
            // 👇 BUSCA OS PRODUTOS MARCADOS COMO "DESTAQUE NA HOME" NO ADMIN
            const selectedProducts = products.filter((p) => {
              return p.available && p.featured === true;
            });

            if (selectedProducts.length > 0) {
              return selectedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ));
            }
            return (
              <p style={{ width: "100%", textAlign: "center", color: "#7a7a72", padding: "40px 0", gridColumn: "1 / -1" }}>
                Marque produtos como "Destaque na Home" no painel administrativo para exibi-los aqui.
              </p>
            );
          })()}
        </div>
      </section>

      {/* ==================== ASSINATURAS NA HOME ==================== */}
      <section className="section" id="assinaturas" style={{ background: "#f2ece6", padding: "80px 20px", borderRadius: 12, margin: "40px auto", maxWidth: "1240px" }}>
        <div className="section-heading centered" style={{ marginBottom: 40 }}>
          <span className="eyebrow" style={{ color: "#b88a44" }}>FLOWER EM CASA · BLACK FRIDAY</span>
          <h2 style={{ fontFamily: "var(--serif)", color: "#1e3a29" }}>Assine e receba flores <em style={{ color: "#b88a44" }}>sempre.</em></h2>
          <p style={{ color: "#7a7a72", marginTop: 10 }}>Escolha a frequência e garanta condições especiais de Black Friday.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          {isSubsLoading ? (
            <p style={{ width: "100%", textAlign: "center", color: "#7a7a72" }}>Carregando planos...</p>
          ) : subscriptions.length === 0 ? (
            <p style={{ width: "100%", textAlign: "center", color: "#7a7a72" }}>Nenhum plano disponível no momento.</p>
          ) : (
            subscriptions.map((sub) => {
              const hasPromo = sub.black_friday_price && sub.black_friday_price > 0;
              const finalPrice = hasPromo ? sub.black_friday_price! : sub.price;

              return (
                <div key={sub.id} className="subscription-card" style={{ border: "1px solid #e2e5dc", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
                  <div className="subscription-card-image" style={{ height: "250px" }}>
                    <img src={sub.image || fallbackImage} alt={sub.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div className="subscription-card-content" style={{ padding: "20px", display: "flex", flexDirection: "column" }}>
                    <span className="eyebrow" style={{ color: "#b88a44" }}>{sub.deliveries_per_month} {sub.deliveries_per_month === 1 ? "entrega por mês" : "entregas por mês"}</span>
                    <h2 style={{ fontFamily: "var(--serif)", color: "#1e3a29", fontSize: "28px", margin: "10px 0" }}>{sub.name}</h2>
                    <p style={{ color: "#7a7a72", fontSize: "13px", marginBottom: "20px" }}>{sub.description}</p>

                    <div style={{ marginTop: "auto", paddingTop: "20px", borderTop: "1px solid #e2e5dc" }}>
                      {hasPromo && (
                        <span style={{ textDecoration: "line-through", color: "#999", fontSize: 13, display: "block", marginBottom: 4 }}>
                          De {formatPrice(sub.price)}
                        </span>
                      )}
                      <strong style={{ color: hasPromo ? "#b88a44" : "#1e3a29", fontSize: "28px", fontFamily: "var(--serif)" }}>
                        {formatPrice(finalPrice)}
                      </strong>
                      <span style={{ color: "#7a7a72", fontSize: "12px", marginLeft: 5 }}>/mês</span>
                    </div>

                    <Link href="/assinaturas" style={{ display: "block", textAlign: "center", marginTop: "20px", padding: "12px", background: hasPromo ? "#b88a44" : "#1e3a29", color: "#fff", borderRadius: "4px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      Assinar agora
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ==================== SEÇÃO NATAL ==================== */}
      <section className="christmas-section" id="natal">
        <span className="eyebrow">ESPÍRITO DE NATAL</span>
        <h2>O Natal merece flores.<br />E o seu amor merece a Flower.</h2>
        <p>Estamos preparando uma curadoria especial de presentes, velas e arranjos exclusivos para iluminar o seu fim de ano.</p>
        <Link href="/encomendas-natal" className="button button-gold">
          Encomendar arranjo de Natal
        </Link>
      </section>

      {/* ==================== COMPLEMENTE SEU PRESENTE (CHOCOLATES) ==================== */}
      <section id="produtos" style={{ padding: "80px 0", background: "#fdfcfb", width: "100%", overflow: "hidden" }}>
        <div className="section-heading centered" style={{ padding: "0 20px", marginBottom: 40, maxWidth: "1240px", margin: "0 auto 40px" }}>
          <span className="eyebrow" style={{ color: "#b88a44" }}>UM TOQUE ESPECIAL</span>
          <h2 style={{ fontFamily: "var(--serif)", color: "#1e3a29" }}>Complemente seu presente</h2>
          <p style={{ color: "#7a7a72", marginTop: 10 }}>Adoce o momento com os deliciosos chocolates da Cacau Show.</p>
        </div>

        <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 20px" }}>
          <div className="carousel-wrapper">
            <div className="carousel-track">
              {(() => {
                const palavrasChave = ["speculos", "wafer", "lacreme gold", "lacreme pistache", "panetone", "avelã", "lacreme natal"];
                const chocolates = products.filter((p) => {
                  const name = p.name.toLowerCase();
                  return p.category_id === 4 && palavrasChave.some(palavra => name.includes(palavra));
                });
                if (chocolates.length === 0) return <p style={{ color: "#7a7a72" }}>Em breve...</p>;
                return [...chocolates, ...chocolates].map((product, index) => (
                  <div key={`${product.id}-${index}`} className="carousel-card">
                    <ProductCard product={product} />
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== SOBRE ==================== */}
      <section className="about section" id="sobre">
        <span className="eyebrow">O ATELIÊ FLOWER</span>
        <h2>Mais do que flores.<br /><em>Momentos.</em></h2>
        <p>No Ateliê FLOWER, cada composição é pensada para transmitir sentimentos, celebrar pessoas e transformar pequenos momentos em grandes lembranças.</p>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="footer">
        <div className="footer-brand">
          <img src="/images/logofooternew.png" alt="FLOWER Buquês & Acessórios" className="footer-logo" style={{ width: "200px" }} />
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