"use client";

import { useRouter } from "next/navigation";

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

        <button
          type="button"
          className="favorite"
          aria-label={`Favoritar ${product.name}`}
          onClick={(e) => e.stopPropagation()}
        >
          ♡
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