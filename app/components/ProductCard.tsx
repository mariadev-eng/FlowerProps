"use client";

import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useCart } from "../contexts/CartContext";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  black_friday_price?: number | null;
  category_id: number;
  image: string | null;
  available: boolean;
};

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { toggleFavorite, isFavorite } = useFavorites();
  // 👇 Removemos o openCart daqui
  const { addToCart } = useCart(); 

  const favorited = isFavorite(product.id);

  const hasPromo = product.black_friday_price && product.black_friday_price > 0;
  const finalPrice = hasPromo ? product.black_friday_price! : product.price;

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
        <h3>{product.name}</h3>
        
        <div className="product-bottom">
          <div style={{ display: "flex", flexDirection: "column" }}>
            {hasPromo && (
              <span
                style={{
                  textDecoration: "line-through",
                  color: "#999",
                  fontSize: "12px",
                  marginBottom: "2px",
                }}
              >
                {formatPrice(product.price)}
              </span>
            )}
            <strong
              style={hasPromo ? { color: "#b88a44", fontSize: "16px" } : {}}
            >
              {formatPrice(finalPrice)}
            </strong>
          </div>
          <button
            type="button"
            className="add-button"
            onClick={(e) => {
              e.stopPropagation();
              // 👇 Apenas adiciona ao carrinho, sem abrir a gaveta lateral
              addToCart({
                ...product,
                quantity: 1,
                price: finalPrice,
                black_friday_price: product.black_friday_price,
              });
            }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}