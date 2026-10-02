"use client";

import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: number;
  image: string | null;
  available: boolean;
};

type ProductCardProps = {
  product: Product;
  onAddToCart?: (product: Product) => void;
};

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { toggleFavorite, isFavorite } = useFavorites();

  const favorited = isFavorite(product.id);

  function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function goToProduct() {
    router.push(`/produto/${product.id}`);
  }

  return (
    <div
      className="product-card"
      id={`product-${product.id}`}
      onClick={goToProduct}
      style={{ cursor: "pointer" }}
    >
      <div className="product-image">
        <img
          src={product.image || "/images/placeholder.png"}
          alt={product.name}
          className="product-image-img"
        />

        <span className="product-vertical-label">
          FLOWER · {product.name}
        </span>

        {/* 🆕 CORAÇÃO DE FAVORITOS */}
        <button
          type="button"
          className={`favorite ${favorited ? "active" : ""}`}
          aria-label={
            favorited
              ? `Remover ${product.name} dos favoritos`
              : `Favoritar ${product.name}`
          }
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(product.id);
          }}
        >
          <Heart
            size={18}
            strokeWidth={1.8}
            fill={favorited ? "#dc2626" : "none"}
            color={favorited ? "#dc2626" : "#3f493b"}
          />
        </button>
      </div>

      <div className="product-info">
        <span>{product.description}</span>

        <h3>{product.name}</h3>

        <div className="product-bottom">
          <strong>{formatPrice(product.price)}</strong>

          <button
            type="button"
            className="add-button"
            onClick={(e) => {
              e.stopPropagation();
              goToProduct();
            }}
            aria-label={`Ver ${product.name}`}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}