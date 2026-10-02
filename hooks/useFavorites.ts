"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";

export function useFavorites() {
  const { user } = useUser();
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // Carrega os favoritos do usuário
  useEffect(() => {
    if (!user) {
      setFavoriteIds([]);
      setLoading(false);
      return;
    }

    async function loadFavorites() {
      const { data, error } = await supabase
        .from("favorites")
        .select("product_id")
        .eq("user_id", user!.id);

      if (error) {
        console.error("Erro ao carregar favoritos:", error);
        setFavoriteIds([]);
      } else {
        setFavoriteIds((data ?? []).map((f) => f.product_id));
      }

      setLoading(false);
    }

    loadFavorites();
  }, [user]);

  async function toggleFavorite(productId: number) {
    if (!user) {
      alert("Faça login para adicionar aos favoritos.");
      return;
    }

    const isFav = favoriteIds.includes(productId);

    // Atualiza otimista
    if (isFav) {
      setFavoriteIds((current) => current.filter((id) => id !== productId));
    } else {
      setFavoriteIds((current) => [...current, productId]);
    }

    // Chama o Supabase
    let error;

    if (isFav) {
      const res = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId);
      error = res.error;
    } else {
      const res = await supabase
        .from("favorites")
        .insert({ user_id: user.id, product_id: productId });
      error = res.error;
    }

    if (error) {
      console.error("Erro ao alterar favorito:", error);
      // Reverte em caso de erro
      if (isFav) {
        setFavoriteIds((current) => [...current, productId]);
      } else {
        setFavoriteIds((current) => current.filter((id) => id !== productId));
      }
      alert("Erro ao atualizar favorito. Tente novamente.");
    }
  }

  function isFavorite(productId: number): boolean {
    return favoriteIds.includes(productId);
  }

  return { favoriteIds, loading, toggleFavorite, isFavorite };
}