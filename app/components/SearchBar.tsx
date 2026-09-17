"use client";

import { useEffect, useState } from "react";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string | null;
  available: boolean;
};

type SearchBarProps = {
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
};

export default function SearchBar({
  products,
  isOpen,
  onClose,
}: SearchBarProps) {
  const [search, setSearch] = useState("");

  const results = products.filter((product) => {
    const term = search.toLowerCase().trim();

    if (!term) return false;

    return (
      product.name
        .toLowerCase()
        .includes(term) ||
      product.description
        .toLowerCase()
        .includes(term)
    );
  });

  useEffect(() => {
    if (!isOpen) {
      setSearch("");
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  function formatPrice(price: number) {
    return price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function goToProduct(id: number) {
    onClose();

    setTimeout(() => {
      const element =
        document.getElementById(
          `produto-${id}`
        );

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 100);
  }

  return (
    <>
      <div
        className="search-overlay"
        onClick={onClose}
      />

      <div className="search-panel">

        <div className="search-header">

          <div>
            <span className="eyebrow">
              ENCONTRE SUA FLOWER
            </span>

            <h2>
              O que você procura?
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="search-close"
            aria-label="Fechar pesquisa"
          >
            ×
          </button>

        </div>

        <div className="search-input-wrapper">

          <span className="search-icon">
            ⌕
          </span>

          <input
            type="search"
            autoFocus
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Digite o nome da flor ou produto..."
          />

          {search && (
            <button
              type="button"
              className="search-clear"
              onClick={() =>
                setSearch("")
              }
              aria-label="Limpar pesquisa"
            >
              ×
            </button>
          )}

        </div>

        <div className="search-results">

          {!search.trim() ? (

            <div className="search-empty">

              <span>
                ♡
              </span>

              <p>
                Digite o nome de uma flor,
                buquê ou acessório.
              </p>

            </div>

          ) : results.length === 0 ? (

            <div className="search-empty">

              <span>
                ♡
              </span>

              <h3>
                Não encontramos esse produto.
              </h3>

              <p>
                Tente pesquisar por outro nome.
              </p>

            </div>

          ) : (

            <>

              <div className="search-results-title">

                <span>
                  RESULTADOS
                </span>

                <strong>
                  {results.length}{" "}
                  {results.length === 1
                    ? "produto"
                    : "produtos"}
                </strong>

              </div>

              <div className="search-product-list">

                {results.map((product) => (

                  <button
                    type="button"
                    className="search-product"
                    key={product.id}
                    onClick={() =>
                      goToProduct(product.id)
                    }
                  >

                    <div className="search-product-image">

                      <img
                        src={
                          product.image ||
                          "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=300&q=80"
                        }
                        alt={product.name}
                      />

                    </div>

                    <div className="search-product-info">

                      <span>
                        FLOWER
                      </span>

                      <h3>
                        {product.name}
                      </h3>

                      <p>
                        {product.description}
                      </p>

                    </div>

                    <strong>
                      {formatPrice(
                        product.price
                      )}
                    </strong>

                    <span className="search-product-arrow">
                      →
                    </span>

                  </button>

                ))}

              </div>

            </>

          )}

        </div>

      </div>
    </>
  );
}

