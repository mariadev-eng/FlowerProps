"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PedidosNatalAdmin() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("Iniciando...");

  useEffect(() => {
    async function load() {
      setMsg("Buscando no banco...");
      const { data, error } = await supabase.from("christmas_quotes").select("*");
      
      if (error) {
        setMsg(`Erro do Supabase: ${error.message} (Code: ${error.code})`);
      } else {
        setMsg(`Sucesso! Encontrados ${data?.length || 0} pedidos no banco.`);
        setPedidos(data || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div style={{ padding: "50px", background: "#fff", minHeight: "100vh" }}>
      <h1 style={{ color: "red", fontSize: "24px", marginBottom: "20px" }}>TESTE DO ADMIN</h1>
      
      <div style={{ padding: "20px", background: "#e0ffe0", border: "2px solid green", marginBottom: "20px" }}>
        <strong>Status:</strong> {msg}
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div>
          <h3>Pedidos no banco: {pedidos.length}</h3>
          {pedidos.map((p) => (
            <div key={p.id} style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "10px" }}>
              <strong>ID: {p.id} - {p.nome}</strong>
              <p>Valor: {p.valor}</p>
              <p>Detalhes: {p.detalhes}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}