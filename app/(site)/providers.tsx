"use client";

import { ReactNode } from "react";
import { CartProvider } from "../contexts/CartContext";
import { SearchProvider } from "../contexts/SearchContext";

export function SiteProviders({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <SearchProvider>{children}</SearchProvider>
    </CartProvider>
  );
}