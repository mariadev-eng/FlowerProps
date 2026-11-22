"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

type Product = {
  id: number;
  name: string;
  price: number;
  black_friday_price?: number | null;
  image: string | null;
  category_id: number;
  [key: string]: any;
};

type SearchContextType = {
  isSearchOpen: boolean;
  searchTerm: string;
  filteredProducts: Product[];
  openSearch: () => void;
  closeSearch: () => void;
  setSearchTerm: (term: string) => void;
};

const SearchContext = createContext<SearchContextType | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  // Carrega produtos uma vez
  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from("products").select("*");
      if (error) {
        console.error("ERRO SUPABASE (search):", error);
        return;
      }
      setAllProducts(data ?? []);
    }
    load();
  }, []);

  // Esc fecha a busca
  useEffect(() => {
    if (!isSearchOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsSearchOpen(false);
        setSearchTerm("");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isSearchOpen]);

  const filteredProducts = searchTerm.trim()
    ? allProducts.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <SearchContext.Provider
      value={{
        isSearchOpen,
        searchTerm,
        filteredProducts,
        openSearch: () => setIsSearchOpen(true),
        closeSearch: () => {
          setIsSearchOpen(false);
          setSearchTerm("");
        },
        setSearchTerm,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch deve ser usado dentro de SearchProvider");
  return ctx;
}