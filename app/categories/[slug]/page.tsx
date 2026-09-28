"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { UserRound } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import ProductCard from "../../components/ProductCard";

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

  const slug = String(params?.slug || "").toLowerCase();
  const category = SLUG_TO_CATEGORY[slug];

  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
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

    router.push("/checkout");
  }

  if (!category) return null;

  return (
    <main className="category-page">
      <header className="site-header">
        <div className="header-content">
          <Link href="/" className="brand">
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
                onAddToCart={addToCart}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}