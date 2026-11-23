"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ProductCard from "@/app/components/ProductCard";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  old_price?: number | null;
  black_friday_price?: number | null; // Adicionado caso seu admin use este campo
  category_id: number;
  image: string | null;
  available: boolean;
};

export default function BlackFridayPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      // Busca todos os produtos sem filtro de preço no banco
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .not("name", "ilike", "%panetone%")
        .not("name", "ilike", "%mini show%")
        .not("name", "ilike", "%caixa de bombons%");

      if (error) {
        console.error("Erro ao carregar produtos:", error);
        setProducts([]);
      } else {
        const allProducts = (data as Product[]) ?? [];
        
        // FILTRO INTELIGENTE: Aceita tanto old_price quanto black_friday_price como o "preço promocional"
        const promoProducts = allProducts.filter((p) => {
          const promoPrice = p.old_price || p.black_friday_price;
          return promoPrice !== null && promoPrice !== undefined && Number(promoPrice) > 0;
        });

        setProducts(promoProducts);
      }
      setLoading(false);
    }

    loadProducts();
  }, []);

  function getPriority(name: string, categoryId: number) {
    const lowerName = name.toLowerCase();

    if (categoryId === 1) {
      if (lowerName.includes("grande")) return 1;
      if (lowerName.includes("médio") || lowerName.includes("medio")) return 2;
      if (lowerName.includes("pequeno")) return 3;
      if (lowerName.includes("mini")) return 4;
      if (lowerName.includes("little")) return 5;
    }

    if (categoryId === 3) {
      if (lowerName.includes("cristal flower")) return 1;
      if (lowerName.includes("box") && lowerName.includes("romance")) return 2;
      if (lowerName.includes("bloom") && lowerName.includes("rouge")) return 3;
      if (lowerName.includes("box") && lowerName.includes("bloom")) return 4;
      if (lowerName.includes("love") || lowerName.includes("unitaria")) return 5;
    }

    if (categoryId === 4) {
      if (lowerName.includes("urso")) return 1;
      if (lowerName.includes("vela")) return 2;
      if (lowerName.includes("vinho")) return 3;
      if (lowerName.includes("caneca")) return 4;
    }

    return 99;
  }

  const groupedProducts = products.reduce((acc, product) => {
    const category = product.category_id;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<number, Product[]>);

  function getCategoryName(categoryId: number) {
    switch (categoryId) {
      case 1: return "Buquês";
      case 3: return "Presentes";
      case 4: return "Acessórios";
      default: return "Outros Produtos";
    }
  }

  // Ordem fixa das categorias na página
  const CATEGORY_ORDER = [1, 3, 4];

  return (
    <main style={{ background: "#fdfcfb", minHeight: "100vh" }}>
      <section style={{ background: "#1e3a29", padding: "80px 20px", textAlign: "center" }}>
        <span className="eyebrow" style={{ color: "#b88a44", letterSpacing: "0.2em" }}>
          OFERTAS IMPERDÍVEIS
        </span>
        <h1 style={{ fontFamily: "var(--serif)", color: "#fff", fontSize: "clamp(42px, 6vw, 72px)", margin: "10px 0" }}>
          OFERTAS <em style={{ color: "#b88a44", fontStyle: "italic" }}>ESPECIAIS</em>
        </h1>
        <p style={{ color: "rgba(255,255,255,0.8)", maxWidth: 600, margin: "0 auto", fontSize: 15 }}>
          Aproveite nossos descontos exclusivos em produtos selecionados. Estoques limitados!
        </p>
      </section>

      <section style={{ padding: "60px 20px", maxWidth: "1240px", margin: "0 auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#7a7a72" }}>
            Carregando ofertas...
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#7a7a72" }}>
            <p>Nenhum produto em promoção no momento. Volte em breve!</p>
            <Link href="/" className="button button-outline dark" style={{ marginTop: 20 }}>
              Voltar para a home
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "60px" }}>
            {CATEGORY_ORDER.map((categoryId) => {
              const categoryProducts = groupedProducts[categoryId];
              if (!categoryProducts || categoryProducts.length === 0) return null;

              const sortedProducts = [...categoryProducts].sort((a, b) => {
                return getPriority(a.name, categoryId) - getPriority(b.name, categoryId);
              });

              return (
                <div key={categoryId}>
                  <div style={{ marginBottom: "30px", borderBottom: "1px solid #e2e5dc", paddingBottom: "15px" }}>
                    <h2 style={{ fontFamily: "var(--serif)", color: "#1e3a29", fontSize: "32px", display: "flex", alignItems: "center", gap: "10px" }}>
                      {getCategoryName(categoryId)}
                      <span style={{ fontSize: "14px", color: "#b88a44", fontWeight: 500, fontFamily: "var(--sans)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                        Ofertas
                      </span>
                    </h2>
                  </div>

                  <div className="product-grid">
                    {sortedProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
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
            style={{ width: "200px" }}
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