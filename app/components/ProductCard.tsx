"use client";

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
  onAddToCart: (product: Product) => void;
};

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  return (
    <div className="product-card" id={`product-${product.id}`}>
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
            onClick={() => onAddToCart(product)}
            aria-label={`Adicionar ${product.name} ao carrinho`}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}