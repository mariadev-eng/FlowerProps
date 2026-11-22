"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ProductCard from "@/app/components/ProductCard";
import { useCart } from "@/app/contexts/CartContext";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: number;
  image: string | null;
  available: boolean;
};

type CategoryInfo = {
  id: number;
  name: string;
  description: string;
};

const SLUG_TO_CATEGORY: Record<string, CategoryInfo> = {
  buques: {
    id: 1,
    name: "Buquês",
    description: "Composições para surpreender",
  },
  presentes: {
    id: 3,
    name: "Presentes",
    description: "Flores e carinho",
  },
  acessorios: {
    id: 4,
    name: "Acessórios",
    description: "Para completar o presente",
  },
};

export default function CategoriaPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();

  const slug = String(params?.slug || "").toLowerCase();
  const category = SLUG_TO_CATEGORY[slug];

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!category) {
      router.replace("/");
    }
  }, [category, router]);

  useEffect(() => {
    if (!category) return;

    async function loadProducts() {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("category_id", category.id)
        .eq("available", true)
        .order("price", { ascending: true });

      if (error) {
        console.error("Erro ao carregar produtos:", error);
        setProducts([]);
      } else {
        setProducts(data ?? []);
      }

      setIsLoading(false);
    }

    loadProducts();
  }, [category]);

  if (!category) return null;

  return (
    <main className="category-page">
      {/* HEADER ANTIGO REMOVIDO */}
      
      <section className="category-intro section">
        <Link href="/" className="category-back">
          ← Voltar
        </Link>

        <span className="eyebrow">{category.description}</span>

        <h1>{category.name}</h1>
      </section>

      <section className="category-products section">
        {isLoading ? (
          <div className="products-loading">
            <p>Carregando produtos...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="products-empty">
            <p>Nenhum produto nesta categoria ainda.</p>
            <Link href="/" className="button button-outline dark">
              Voltar pra home
            </Link>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}