"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";
import ProductCard from "@/app/components/ProductCard";

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

export default function FavoritosPage() {
  const { user, loading: loadingUser } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loadingUser) return;

    if (!user) {
      setIsLoading(false);
      return;
    }

    async function loadFavorites() {
      // Pega os IDs dos favoritos
      const { data: favs, error: favError } = await supabase
        .from("favorites")
        .select("product_id")
        .eq("user_id", user!.id);

      if (favError) {
        console.error("Erro:", favError);
        setProducts([]);
        setIsLoading(false);
        return;
      }

      const ids = (favs ?? []).map((f) => f.product_id);

      if (ids.length === 0) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      // Pega os produtos
      const { data: productsData, error: prodError } = await supabase
        .from("products")
        .select("*")
        .in("id", ids);

      if (prodError) {
        console.error("Erro:", prodError);
        setProducts([]);
      } else {
        setProducts(productsData ?? []);
      }

      setIsLoading(false);
    }

    loadFavorites();
  }, [user, loadingUser]);

  if (loadingUser || isLoading) {
    return (
      <main className="account-page">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            color: "#7a7a72",
          }}
        >
          Carregando favoritos...
        </div>
      </main>
    );
  }

  return (
    <main className="account-page">
      <header className="account-header">
        <Link href="/" className="account-logo">
          FLOWER
        </Link>

        <Link href="/" className="account-back">
          ← Voltar à loja
        </Link>
      </header>

      <div
        style={{
          width: "min(1200px, calc(100% - 40px))",
          margin: "0 auto",
          padding: "40px 0 80px",
        }}
      >
        <div style={{ marginBottom: 32 }}>
          <span className="eyebrow">MINHA CONTA</span>
          <h1
            style={{
              fontFamily: "var(--serif)",
              fontSize: "clamp(36px, 5vw, 52px)",
              fontWeight: 500,
              margin: "12px 0 8px",
              color: "#3f493b",
              lineHeight: 1,
            }}
          >
            Meus favoritos
          </h1>
          <p style={{ color: "#7a7a72", fontSize: 13, margin: 0 }}>
            {products.length}{" "}
            {products.length === 1
              ? "produto salvo"
              : "produtos salvos"}
          </p>
        </div>

        {products.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 60,
              background: "#fff",
              border: "1px solid #e0e0dc",
              borderRadius: 8,
              color: "#7a7a72",
            }}
          >
            <Heart
              size={48}
              strokeWidth={1}
              style={{ marginBottom: 16, color: "#9ca3af" }}
            />
            <p style={{ margin: "0 0 8px", fontSize: 15, color: "#2f2a26" }}>
              Você ainda não tem favoritos.
            </p>
            <p style={{ margin: "0 0 24px", fontSize: 13 }}>
              Toque no coração dos produtos que você ama pra salvá-los aqui.
            </p>
            <Link
              href="/"
              style={{
                display: "inline-block",
                padding: "12px 24px",
                background: "#2f2a26",
                color: "#fff",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              Ver produtos
            </Link>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}