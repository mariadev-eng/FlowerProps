"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  black_friday_price?: number | null;
  category_id: number;
  image: string | null;
  available: boolean;
  [key: string]: any;
};

export type CartItem = Product & {
  quantity: number;
  type?: string;
};

type CartContextType = {
  cartItems: CartItem[];
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: number) => void;
  increaseQuantity: (id: number) => void;
  decreaseQuantity: (id: number) => void;
  clearCart: () => void;
  // Novos estados para o Toast
  lastAddedItem: CartItem | null;
  clearLastAddedItem: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState<CartItem | null>(null);

  // Carrega do localStorage
  useEffect(() => {
    const saved = localStorage.getItem("flower-cart");
    if (saved) {
      try {
        setCartItems(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao carregar carrinho", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Salva no localStorage
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("flower-cart", JSON.stringify(cartItems));
    window.dispatchEvent(new Event("storage"));
  }, [cartItems, isLoaded]);

  // Atualiza preços/disponibilidade ao abrir o carrinho
  useEffect(() => {
    if (!isCartOpen || cartItems.length === 0) return;

    async function refreshCartPrices() {
      const ids = cartItems.map((item) => item.id);
      const { data, error } = await supabase
        .from("products")
        .select("id, price, black_friday_price, available, name, image")
        .in("id", ids);

      if (error || !data) return;

      setCartItems((prev) =>
        prev.map((item) => {
          const fresh = data.find((p: any) => p.id === item.id);
          if (!fresh) return item;
          return {
            ...item,
            price: fresh.price,
            black_friday_price: fresh.black_friday_price,
            available: fresh.available,
            name: fresh.name,
            image: fresh.image,
          };
        })
      );
    }

    refreshCartPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCartOpen]);

  function addToCart(item: CartItem) {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      }
      return [...prev, item];
    });
    
    // Ativa o Toast
    setLastAddedItem(item);

    // Remove o toast automaticamente após 4 segundos
    setTimeout(() => {
      setLastAddedItem(null);
    }, 4000);
  }

  function removeFromCart(id: number) {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
  }

  function increaseQuantity(id: number) {
    setCartItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: i.quantity + 1 } : i))
    );
  }

  function decreaseQuantity(id: number) {
    setCartItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0)
    );
  }

  function clearCart() {
    setCartItems([]);
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
        lastAddedItem,
        clearLastAddedItem: () => setLastAddedItem(null),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de CartProvider");
  return ctx;
}