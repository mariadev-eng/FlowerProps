"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Pedido = {
  id: number;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
  order_items: any;
};

export default function PedidosNatalAdmin() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState<number | null>(null);

  useEffect(() => {
    async function carregarPedidos() {
      // Busca apenas os pedidos de encomenda de natal, do mais recente para o mais antigo
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("payment_method", "encomenda_natal")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar encomendas de Natal:", error);
      } else if (data) {
        setPedidos(data);
      }
      setLoading(false);
    }
    carregarPedidos();
  }, []);

  function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function formatDate(dateString: string) {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  }

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#7a7a72" }}>Carregando encomendas...</div>;
  if (pedidos.length === 0) return <div style={{ padding: "40px", textAlign: "center", color: "#7a7a72" }}>Nenhuma encomenda de Natal recebida ainda.</div>;

  return (
    <div style={{ padding: "40px 20px", maxWidth: "1000px", margin: "0 auto", background: "#fdfcfb", minHeight: "100vh" }}>
      
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ fontFamily: "var(--serif)", color: "#1e3a29", fontSize: "32px", margin: 0 }}>Encomendas de Natal</h1>
        <p style={{ color: "#7a7a72", marginTop: "10px" }}>Gerencie os arranjos e pedidos de final de ano feitos pelos clientes.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {pedidos.map((pedido) => {
          // Pega os dados do primeiro item do array JSON que salvamos
          const item = pedido.order_items && pedido.order_items.length > 0 ? pedido.order_items[0] : null;
          const detalhes = item?.details || {};
          const isOpen = expandido === pedido.id;

          return (
            <div 
              key={pedido.id} 
              style={{ 
                border: "1px solid #e2e5dc", 
                borderRadius: 8, 
                background: "#fff", 
                overflow: "hidden",
                boxShadow: "0 4px 15px rgba(0,0,0,0.03)"
              }}
            >
              {/* CABEÇALHO DO PEDIDO (CLICÁVEL) */}
              <div 
                onClick={() => setExpandido(isOpen ? null : pedido.id)}
                style={{ 
                  padding: "20px", 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  cursor: "pointer",
                  background: isOpen ? "#f8f9fa" : "#fff",
                  transition: "background 0.2s"
                }}
              >
                <div>
                  <strong style={{ color: "#1e3a29", fontSize: 18 }}>{pedido.customer_name}</strong>
                  <p style={{ margin: "5px 0 0 0", fontSize: 13, color: "#7a7a72" }}>
                    Realizado em: {formatDate(pedido.created_at)} | Total: {formatPrice(pedido.total)}
                  </p>
                </div>
                <div style={{ color: "#b88a44", fontWeight: 600, fontSize: 14 }}>
                  {isOpen ? "Ocultar Detalhes ▲" : "Ver Detalhes ▼"}
                </div>
              </div>

              {/* DETALHES EXPANDIDOS */}
              {isOpen && (
                <div style={{ padding: "20px", borderTop: "1px solid #e2e5dc", background: "#fdfcfb" }}>
                  <h4 style={{ color: "#1e3a29", marginBottom: 15, fontSize: 16, marginTop: 0 }}>Informações do Arranjo</h4>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: 15 }}>
                    
                    <div style={{ background: "#fff", padding: 15, borderRadius: 6, border: "1px solid #e2e5dc" }}>
                      <span style={{ fontSize: 11, color: "#7a7a72", textTransform: "uppercase", fontWeight: 700 }}>Tamanho / Hastes</span>
                      <p style={{ margin: "5px 0 0 0", fontWeight: 600, color: "#1e3a29" }}>{item?.name?.replace("Arranjo de Natal - ", "") || "Não informado"}</p>
                    </div>
                    
                    <div style={{ background: "#fff", padding: 15, borderRadius: 6, border: "1px solid #e2e5dc" }}>
                      <span style={{ fontSize: 11, color: "#7a7a72", textTransform: "uppercase", fontWeight: 700 }}>Tipo de Arranjo (Ocasião)</span>
                      <p style={{ margin: "5px 0 0 0", fontWeight: 600, color: "#1e3a29" }}>{detalhes.tipoArranjo || "Não informado"}</p>
                    </div>

                    <div style={{ background: "#fff", padding: 15, borderRadius: 6, border: "1px solid #e2e5dc", gridColumn: "1 / -1" }}>
                      <span style={{ fontSize: 11, color: "#7a7a72", textTransform: "uppercase", fontWeight: 700 }}>Data do Evento</span>
                      <p style={{ margin: "5px 0 0 0", fontWeight: 600, color: "#1e3a29" }}>
                        {detalhes.dataEvento ? new Date(detalhes.dataEvento + "T12:00:00").toLocaleDateString("pt-BR") : "Não informada"}
                      </p>
                    </div>

                    <div style={{ background: "#fff", padding: 15, borderRadius: 6, border: "1px solid #e2e5dc", gridColumn: "1 / -1" }}>
                      <span style={{ fontSize: 11, color: "#7a7a72", textTransform: "uppercase", fontWeight: 700 }}>Detalhes (Cores, flores, etc)</span>
                      <p style={{ margin: "5px 0 0 0", color: "#1e3a29", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{detalhes.detalhes || "Nenhum detalhe informado."}</p>
                    </div>

                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}