"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"; 

export default function EncomendasNatalPage() {
  const router = useRouter();
  
  const [nome, setNome] = useState("");
  const [dataEvento, setDataEvento] = useState("");
  const [tipoArranjo, setTipoArranjo] = useState("");
  const [tamanho, setTamanho] = useState("");
  const [detalhes, setDetalhes] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);

  function selecionarTamanho(tamanhoSelecionado: string) {
    setTamanho(tamanhoSelecionado);
    const formElement = document.getElementById("formulario-encomenda");
    if (formElement) formElement.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function irParaPagamento(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    // 1. Define o valor baseado na opção de tamanho
    let valorBase = 0;
    if (tamanho.includes("PP")) valorBase = 160;
    else if (tamanho.includes("Pequeno")) valorBase = 250;
    else if (tamanho.includes("Médio")) valorBase = 360;
    else if (tamanho.includes("Grande")) valorBase = 450;

    // 2. Monta o objeto com os dados do pedido
    const dadosPedido = {
      nome,
      dataEvento,
      tipoArranjo,
      tamanho,
      detalhes,
      valor: valorBase,
    };

    // 3. Salva temporariamente no navegador (para a tela de pagamento usar)
    localStorage.setItem("flower-natal-pedido", JSON.stringify(dadosPedido));

    try {
      // 4. Salva o pedido no banco de dados para aparecer no Admin
      const { error } = await supabase.from("orders").insert([{
        customer_name: nome,
        total: valorBase,
        status: "pendente",
        payment_method: "encomenda_natal",
        order_items: [{
          name: `Arranjo de Natal - ${tamanho}`,
          quantity: 1,
          price: valorBase,
          details: {
            dataEvento,
            tipoArranjo,
            detalhes
          }
        }]
      }]);

      if (error) {
        console.error("Erro ao salvar pedido no banco:", error);
        alert("Houve um erro ao registrar seu pedido. Tente novamente.");
        setIsLoading(false);
        return;
      }

      // 5. Redireciona para a tela de pagamento
      router.push("/encomendas-natal/pagamento");
      
    } catch (err) {
      console.error("Erro inesperado:", err);
      alert("Ocorreu um erro. Tente novamente.");
      setIsLoading(false);
    }
  }

  return (
    <main style={{ background: "#f7f8f4", minHeight: "100vh", paddingBottom: "80px" }}>
      
      {/* CABEÇALHO */}
      <section style={{ background: "#1e3a29", padding: "100px 20px", textAlign: "center" }}>
        <span className="eyebrow" style={{ color: "#b88a44", letterSpacing: "0.2em" }}>ENCOMENDAS ESPECIAIS</span>
        <h1 style={{ fontFamily: "var(--serif)", color: "#fff", fontSize: "clamp(42px, 6vw, 72px)", margin: "10px 0" }}>
          Arranjos para o <em style={{ color: "#b88a44", fontStyle: "italic" }}>Final de Ano.</em>
        </h1>
      </section>

      {/* CARDS DE TAMANHOS */}
      <section style={{ maxWidth: "1100px", margin: "-40px auto 40px", padding: "0 20px", position: "relative", zIndex: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
          {[
            { nome: "PP", hastes: "15 hastes", preco: "R$ 160,00" },
            { nome: "Pequeno", hastes: "25 hastes", preco: "R$ 250,00" },
            { nome: "Médio", hastes: "35 hastes", preco: "R$ 360,00" },
            { nome: "Grande", hastes: "45 hastes", preco: "R$ 450,00" }
          ].map((opcao) => (
            <div key={opcao.nome} onClick={() => selecionarTamanho(opcao.nome)}
              style={{ background: "#fff", padding: "30px 20px", borderRadius: 8, boxShadow: "0 10px 30px rgba(0,0,0,0.08)", textAlign: "center", cursor: "pointer", border: tamanho === opcao.nome ? "2px solid #b88a44" : "2px solid transparent", transition: "all 0.2s ease" }}>
              <h3 style={{ fontFamily: "var(--serif)", color: "#1e3a29", fontSize: 24, margin: "0 0 5px 0" }}>{opcao.nome}</h3>
              <p style={{ color: "#7a7a72", fontSize: 13, margin: "0 0 15px 0", fontWeight: 600 }}>{opcao.hastes}</p>
              <div style={{ color: "#b88a44", fontSize: 20, fontWeight: 700 }}>{opcao.preco}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FORMULÁRIO */}
      <section id="formulario-encomenda" style={{ maxWidth: "800px", margin: "0 auto", padding: "0 20px", position: "relative", zIndex: 10 }}>
        <div style={{ background: "#fff", padding: "40px", borderRadius: 8, boxShadow: "0 20px 60px rgba(0,0,0,0.05)" }}>
          
          <div style={{ textAlign: "center", marginBottom: 30 }}>
            <h2 style={{ fontFamily: "var(--serif)", color: "#1e3a29", fontSize: 32 }}>Faça sua encomenda</h2>
            <p style={{ color: "#7a7a72", fontSize: 14 }}>Preencha os dados abaixo para ir para o pagamento.</p>
          </div>

          <form onSubmit={irParaPagamento} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            
            <label style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, fontWeight: 600, color: "#3f493b" }}>
              Seu Nome Completo
              <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Maria Silva" style={{ padding: "14px", borderRadius: 4, border: "1px solid #d1d5db" }} />
            </label>

            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              <label style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 8, fontSize: 13, fontWeight: 600, color: "#3f493b" }}>
                Data do Evento
                <input type="date" required value={dataEvento} onChange={(e) => setDataEvento(e.target.value)} style={{ padding: "14px", borderRadius: 4, border: "1px solid #d1d5db" }} />
              </label>

              <label style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 8, fontSize: 13, fontWeight: 600, color: "#3f493b" }}>
                Tamanho / Hastes
                <select required value={tamanho} onChange={(e) => setTamanho(e.target.value)} style={{ padding: "14px", borderRadius: 4, border: "1px solid #d1d5db", background: "#fff" }}>
                  <option value="" disabled>Selecione...</option>
                  <option value="PP (15 hastes)">PP (15 hastes)</option>
                  <option value="Pequeno (25 hastes)">Pequeno (25 hastes)</option>
                  <option value="Médio (35 hastes)">Médio (35 hastes)</option>
                  <option value="Grande (45 hastes)">Grande (45 hastes)</option>
                </select>
              </label>
            </div>

            <label style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, fontWeight: 600, color: "#3f493b" }}>
              Tipo de Arranjo (Ocasião)
              <select required value={tipoArranjo} onChange={(e) => setTipoArranjo(e.target.value)} style={{ padding: "14px", borderRadius: 4, border: "1px solid #d1d5db", background: "#fff" }}>
                <option value="" disabled>Selecione...</option>
                <option value="Mesa de Natal">Mesa de Natal</option>
                <option value="Confraternização">Confraternização</option>
                <option value="Réveillon">Réveillon</option>
                <option value="Coroa de Natal">Coroa de Natal</option>
              </select>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, fontWeight: 600, color: "#3f493b" }}>
              Detalhes do Arranjo (Cores, flores preferidas, etc)
              <textarea required rows={4} value={detalhes} onChange={(e) => setDetalhes(e.target.value)} placeholder="Ex: Gostaria de um arranjo com flores vermelhas e detalhes dourados." style={{ padding: "14px", borderRadius: 4, border: "1px solid #d1d5db", resize: "vertical" }} />
            </label>

            <button 
              type="submit" 
              disabled={isLoading}
              style={{ 
                marginTop: 10, 
                padding: "16px", 
                background: isLoading ? "#d1d5db" : "#b88a44", 
                color: "#fff", 
                border: 0, 
                borderRadius: 4, 
                fontSize: 13, 
                fontWeight: 700, 
                letterSpacing: "0.1em", 
                textTransform: "uppercase", 
                cursor: isLoading ? "wait" : "pointer", 
                transition: "background 0.2s" 
              }} 
              onMouseEnter={(e) => !isLoading && (e.currentTarget.style.background = "#9a7133")} 
              onMouseLeave={(e) => !isLoading && (e.currentTarget.style.background = "#b88a44")}
            >
              {isLoading ? "Processando..." : "Continuar para o Pagamento"}
            </button>

          </form>
        </div>
      </section>
    </main>
  );
}