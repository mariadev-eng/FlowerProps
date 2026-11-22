"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type DadosPedido = {
  nome: string;
  dataEvento: string;
  tipoArranjo: string;
  tamanho: string;
  detalhes: string;
};

export default function OrcamentoNatalPage() {
  const params = useParams();
  const id = params.id as string;
  const [dados, setDados] = useState<DadosPedido | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Puxa os dados do localStorage usando o ID da URL
    const pedidosSalvos = localStorage.getItem("flower-natal-orcamentos");
    if (pedidosSalvos) {
      try {
        const todosPedidos = JSON.parse(pedidosSalvos);
        if (todosPedidos[id]) {
          setDados(todosPedidos[id]);
        }
      } catch (e) {
        console.error("Erro ao carregar orçamento", e);
      }
    }
    setLoading(false);
  }, [id]);

  if (loading) {
    return <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f8f4" }}>Carregando...</main>;
  }

  if (!dados) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f7f8f4", padding: 20, textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--serif)", color: "#1e3a29", fontSize: 32 }}>Orçamento não encontrado</h1>
        <p style={{ color: "#7a7a72", marginBottom: 20 }}>Este link expirou ou é inválido.</p>
        <Link href="/encomendas-natal" className="button button-primary">Fazer novo pedido</Link>
      </main>
    );
  }

  return (
    <main style={{ background: "#f7f8f4", minHeight: "100vh", padding: "80px 20px", display: "flex", justifyContent: "center" }}>
      <div style={{ maxWidth: "600px", width: "100%", background: "#fff", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        
        <div style={{ background: "#1e3a29", padding: "40px 20px", textAlign: "center" }}>
          <span style={{ fontSize: 40 }}>🎄</span>
          <h1 style={{ fontFamily: "var(--serif)", color: "#fff", fontSize: 28, margin: "10px 0" }}>Orçamento de Natal</h1>
          <p style={{ color: "#b88a44", fontSize: 13, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Pedido #{id.substring(0, 8)}</p>
        </div>

        <div style={{ padding: "40px 30px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            
            <div style={{ borderBottom: "1px solid #e2e5dc", paddingBottom: 15 }}>
              <span style={{ fontSize: 12, color: "#7a7a72", textTransform: "uppercase", letterSpacing: "0.1em" }}>Cliente</span>
              <p style={{ margin: 0, fontSize: 18, color: "#1e3a29", fontWeight: 600 }}>{dados.nome}</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <span style={{ fontSize: 12, color: "#7a7a72", textTransform: "uppercase", letterSpacing: "0.1em" }}>Data do Evento</span>
                <p style={{ margin: 0, fontSize: 15, color: "#1e3a29" }}>{dados.dataEvento.split("-").reverse().join("/")}</p>
              </div>
              <div>
                <span style={{ fontSize: 12, color: "#7a7a72", textTransform: "uppercase", letterSpacing: "0.1em" }}>Tamanho</span>
                <p style={{ margin: 0, fontSize: 15, color: "#b88a44", fontWeight: 600 }}>{dados.tamanho}</p>
              </div>
            </div>

            <div style={{ borderTop: "1px solid #e2e5dc", paddingTop: 15 }}>
              <span style={{ fontSize: 12, color: "#7a7a72", textTransform: "uppercase", letterSpacing: "0.1em" }}>Ocasião</span>
              <p style={{ margin: 0, fontSize: 15, color: "#1e3a29" }}>{dados.tipoArranjo}</p>
            </div>

            <div style={{ background: "#f9f9f9", padding: 20, borderRadius: 8, marginTop: 10 }}>
              <span style={{ fontSize: 12, color: "#7a7a72", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>Detalhes e Personalização</span>
              <p style={{ margin: 0, fontSize: 14, color: "#3f493b", fontStyle: "italic", lineHeight: 1.6 }}>"{dados.detalhes}"</p>
            </div>

          </div>
        </div>

        <div style={{ background: "#f2ece6", padding: 20, textAlign: "center" }}>
          <Link href="/encomendas-natal" style={{ fontSize: 13, color: "#1e3a29", fontWeight: 600 }}>
            ← Fazer outro pedido
          </Link>
        </div>

      </div>
    </main>
  );
}