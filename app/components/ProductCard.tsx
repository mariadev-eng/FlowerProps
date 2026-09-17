
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

export default function ProductCard({
  product,
  onAddToCart,
}: ProductCardProps) {
  const image =
    product.image ||
    "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=85";

  return (
    <article
  className="product-card"
  id={`product-${product.id}`}
>
      <div className="product-image-wrapper">
        <img
          src={image}
          alt={product.name}
          className="product-image"
        />

        {!product.available && (
          <span className="product-unavailable">
            Indisponível
          </span>
        )}
      </div>

      <div className="product-info">
        <span className="product-category">
          {getCategoryName(product.category_id)}
        </span>

        <h3>{product.name}</h3>

        <p>{product.description}</p>

        <div className="product-bottom">
          <strong>
            {product.price.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </strong>

          <button
            type="button"
            onClick={() => onAddToCart(product)}
            disabled={!product.available}
            className="product-add-button"
          >
            Adicionar
          </button>
        </div>
      </div>
    </article>
  );
}

function getCategoryName(categoryId: number) {
  switch (categoryId) {
    case 1:
      return "Buquês";

    case 2:
      return "Presentes";

    case 3:
      return "Rosas";

    case 4:
      return "Acessórios";

    default:
      return "FLOWER";
  }
}
