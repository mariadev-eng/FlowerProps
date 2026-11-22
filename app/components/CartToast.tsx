"use client";

import { useCart } from "../contexts/CartContext";

export default function CartToast() {
  const { lastAddedItem, clearLastAddedItem, openCart } = useCart();

  if (!lastAddedItem) return null;

  function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  const itemPrice = (lastAddedItem.black_friday_price && lastAddedItem.black_friday_price > 0) 
    ? lastAddedItem.black_friday_price 
    : lastAddedItem.price;

  return (
    <div
      style={{
        position: "fixed",
        top: "120px",
        right: "20px",
        background: "#ffffff",
        border: "1px solid #e2e5dc",
        borderRadius: "8px",
        boxShadow: "0 12px 40px rgba(30, 58, 41, 0.15)", // Sombra verde sutil
        zIndex: 9999999,
        width: "320px",
        overflow: "hidden",
        animation: "slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      }}
    >
      {/* Faixa verde elegante */}
      <div 
        style={{ 
          background: "#1e3a29", 
          color: "#f4e6d3", 
          padding: "12px 16px", 
          fontSize: "11px", 
          fontWeight: 600, 
          textTransform: "uppercase", 
          letterSpacing: "0.1em",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}
      >
        <span style={{ fontSize: "14px" }}>✓</span> Adicionado com sucesso
      </div>

      <div style={{ padding: "20px", display: "flex", gap: "16px", alignItems: "center" }}>
        {/* Foto do Produto com borda */}
        <div 
          style={{ 
            width: "80px", 
            height: "80px", 
            borderRadius: "8px", 
            overflow: "hidden", 
            background: "#f9f9f9", 
            flexShrink: 0,
            border: "1px solid #e2e5dc"
          }}
        >
          {lastAddedItem.image ? (
            <img 
              src={lastAddedItem.image} 
              alt={lastAddedItem.name} 
              style={{ width: "100%", height: "100%", objectFit: "cover" }} 
            />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>🌸</div>
          )}
        </div>

        {/* Informações com fonte da marca */}
        <div style={{ flex: 1 }}>
          <h4 
            style={{ 
              margin: "0 0 6px 0", 
              fontFamily: "var(--serif)", 
              fontSize: "18px", 
              color: "#1e3a29", 
              fontWeight: 500,
              lineHeight: 1.2,
              display: "-webkit-box", 
              WebkitLineClamp: 2, 
              WebkitBoxOrient: "vertical", 
              overflow: "hidden" 
            }}
          >
            {lastAddedItem.name}
          </h4>
          <p style={{ margin: 0, fontSize: "14px", color: "#b88a44", fontWeight: 600 }}>
            {formatPrice(itemPrice)}
          </p>
          <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#7a7a72", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Qtd: {lastAddedItem.quantity}
          </p>
        </div>
      </div>

      {/* Botões de Ação mais refinados */}
      <div style={{ display: "flex", borderTop: "1px solid #e2e5dc", background: "#fdfcfb" }}>
        <button
          onClick={clearLastAddedItem}
          style={{
            flex: 1, 
            padding: "14px", 
            background: "transparent", 
            border: "none", 
            borderRight: "1px solid #e2e5dc", 
            color: "#7a7a72", 
            fontSize: "11px", 
            fontWeight: 600, 
            cursor: "pointer", 
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#f2ece6"; e.currentTarget.style.color = "#1e3a29"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#7a7a72"; }}
        >
          Continuar
        </button>
        <button
          onClick={() => {
            clearLastAddedItem();
            openCart();
          }}
          style={{
            flex: 1, 
            padding: "14px", 
            background: "transparent", 
            border: "none", 
            color: "#1e3a29", 
            fontSize: "11px", 
            fontWeight: 700, 
            cursor: "pointer", 
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#f2ece6"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          Ver carrinho
        </button>
      </div>
    </div>
  );
}