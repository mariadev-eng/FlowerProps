"use client";

import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { ShoppingBag } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useSearch } from "../contexts/SearchContext";

export default function Header() {
  const { user, loading } = useUser();
  const { cartItems, openCart } = useCart();
  const {
    isSearchOpen,
    searchTerm,
    filteredProducts,
    openSearch,
    closeSearch,
    setSearchTerm,
  } = useSearch();

  const cartQuantity = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <header className="site-header">
      <div className="header-content" style={{ height: "140px" }}>
        <Link href="/" className="brand" aria-label="FLOWER">
          <img
            src="/images/logonova.png"
            alt="FLOWER"
            className="brand-logo"
            style={{ width: "auto", height: "120px", maxHeight: "none", objectFit: "contain" }}
          />
        </Link>

        <nav className="desktop-nav">
          <Link href="/">Início</Link>
          
          {/* Black Friday mantida, mas sem o destaque forte para não competir com o Natal */}
          <Link href="/black-friday">Black Friday</Link>
          
          {/* Aba alterada para Arranjo de Natal */}
          <Link href="/encomendas-natal" style={{ color: "#b88a44", fontWeight: 700 }}>
            🎄 Arranjo de Natal
          </Link>
          
          <Link href="/assinaturas">Assinaturas</Link>
          <Link href="/#sobre">Sobre nós</Link>
        </nav>

        <div className="header-actions">
          <button type="button" aria-label="Pesquisar produtos" onClick={openSearch}>
            ⌕
          </button>

          <Link
            href="/conta"
            className="account-button"
            aria-label={user ? "Minha conta" : "Entrar ou criar conta"}
          >
            {loading ? (
              "·"
            ) : user ? (
              <span className="user-initial">
                {(user.user_metadata?.name as string)?.charAt(0)?.toUpperCase() ||
                  user.email?.charAt(0)?.toUpperCase() ||
                  "U"}
              </span>
            ) : (
              "⌂"
            )}
          </Link>

          <button
            type="button"
            onClick={openCart}
            className="cart-button"
            aria-label="Carrinho"
          >
            <ShoppingBag size={20} strokeWidth={1.5} />
            {cartQuantity > 0 && <span className="cart-count">{cartQuantity}</span>}
          </button>
        </div>
      </div>

      {/* PESQUISA */}
      {isSearchOpen && (
        <div className="search-bar">
          <div className="search-bar-inner">
            <span className="search-icon">⌕</span>
            <input
              id="flower-search"
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="O que você está procurando?"
              autoComplete="off"
              autoFocus
            />
            <button type="button" onClick={closeSearch} className="search-close">
              ×
            </button>
          </div>
          {searchTerm.trim() && (
            <div className="search-results">
              {filteredProducts.length === 0 ? (
                <div className="search-no-results">
                  <span>♡</span>
                  <p>Nenhum produto encontrado.</p>
                </div>
              ) : (
                <div className="search-results-list">
                  {filteredProducts.slice(0, 6).map((product) => (
                    <Link
                      key={product.id}
                      href={`/produto/${product.id}`}
                      className="search-result-item"
                      onClick={closeSearch}
                    >
                      <div className="search-result-image">
                        {product.image && <img src={product.image} alt={product.name} />}
                      </div>
                      <div className="search-result-info">
                        <strong>{product.name}</strong>
                      </div>
                      <div className="search-result-price">
                        {product.price.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}