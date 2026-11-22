"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { initMercadoPago } from "@mercadopago/sdk-react";
import { supabase } from "@/lib/supabase";

initMercadoPago(process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY!, {
  locale: "pt-BR",
});

const WHATSAPP_NUMBER = "5522992298475";

export default function PagamentoNatalPage() {
  const router = useRouter();
  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);
  const [error, setError] = useState("");
  
  const [pixData, setPixData] = useState<{
    qrCode: string;
    qrCodeBase64: string;
    orderId: string;
  } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("flower-natal-pedido");
    if (saved) {
      try {
        setPedido(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
    setLoading(false);
  }, []);

  function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function getDeviceId(): string | null {
    if (typeof window === "undefined") return null;
    return (window as any).MP_DEVICE_SESSION_ID || null;
  }

  async function saveNatalOrderToSupabase(paymentMethod: string) {
    if (!pedido) throw new Error("Dados do pedido não encontrados.");

    const { data, error } = await supabase
      .from("christmas_quotes")
      .insert({
        nome: pedido.nome,
        data_evento: pedido.dataEvento,
        tipo_arranjo: pedido.tipoArranjo,
        tamanho: pedido.tamanho,
        detalhes: pedido.detalhes,
        payment_method: paymentMethod,
        payment_status: "pending",
      })
      .select("id")
      .single();

    if (error) throw new Error("Erro ao salvar pedido no banco.");
    return data.id;
  }

  async function handlePixPayment() {
    setIsFinishing(true);
    setError("");

    try {
      const orderId = await saveNatalOrderToSupabase("pix");
      const deviceId = getDeviceId();

      const response = await fetch("/api/mercado-pago/natal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_amount: pedido.valor,
          device_id: deviceId,
          payer: {
            email: "cliente@arranjodenatal.com",
            first_name: pedido.nome.split(" ")[0],
            last_name: pedido.nome.split(" ").slice(1).join(" ") || "Silva",
          },
          description: `Arranjo de Natal #${orderId} - ${pedido.tamanho}`,
          external_reference: `NATAL-${orderId}`,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Erro ao gerar Pix.");

      setPixData({
        qrCode: result.qr_code,
        qrCodeBase64: result.qr_code_base64,
        orderId: String(orderId),
      });

      setIsFinishing(false);
    } catch (err: any) {
      setError(err.message);
      setIsFinishing(false);
    }
  }

  async function handleCardWhatsApp() {
    setIsFinishing(true);
    setError("");

    try {
      const orderId = await saveNatalOrderToSupabase("card_credito");

      const message = `Olá! Quero pagar o Arranjo de Natal com cartão de crédito.
      
🎄 Pedido: #${orderId}
💰 Valor: ${formatPrice(pedido.valor)}
👤 Cliente: ${pedido.nome}
📏 Tamanho: ${pedido.tamanho}
📅 Data: ${pedido.dataEvento.split("-").reverse().join("/")}

Aguardo o link de pagamento. Obrigado!`;

      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
      setIsFinishing(false);
      
      localStorage.removeItem("flower-natal-pedido");
      router.push("/pedido-confirmado");

    } catch (err: any) {
      setError(err.message);
      setIsFinishing(false);
    }
  }

  useEffect(() => {
    if (!pixData) return;

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("christmas_quotes")
        .select("payment_status")
        .eq("id", pixData.orderId)
        .single();

      if (data?.payment_status === "paid") {
        clearInterval(interval);
        localStorage.removeItem("flower-natal-pedido");
        router.push("/pedido-confirmado");
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [pixData, router]);

  if (loading) return <div style={{ textAlign: "center", padding: 100 }}>Carregando...</div>;
  if (!pedido) return <div style={{ textAlign: "center", padding: 100 }}>Pedido não encontrado. Volte e preencha o formulário.</div>;

  return (
    <main style={{ background: "#f7f8f4", minHeight: "100vh", padding: "80px 20px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ fontFamily: "var(--serif)", color: "#1e3a29", fontSize: 40 }}>Pagamento do Arranjo</h1>
          <p style={{ color: "#7a7a72" }}>Finalize seu pedido para garantir a data do seu evento.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
          
          <div style={{ background: "#fff", padding: 30, borderRadius: 8, boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
            <h2 style={{ fontFamily: "var(--serif)", color: "#1e3a29", marginBottom: 20 }}>Resumo</h2>
            <p><strong>Cliente:</strong> {pedido.nome}</p>
            <p><strong>Data:</strong> {pedido.dataEvento.split("-").reverse().join("/")}</p>
            <p><strong>Tamanho:</strong> {pedido.tamanho}</p>
            <p><strong>Ocasião:</strong> {pedido.tipoArranjo}</p>
            <div style={{ borderTop: "1px solid #e2e5dc", paddingTop: 20, marginTop: 20 }}>
              <span style={{ fontSize: 12, color: "#7a7a72" }}>Valor do Arranjo</span>
              <h3 style={{ color: "#b88a44", fontSize: 28, margin: 0 }}>{formatPrice(pedido.valor)}</h3>
            </div>
          </div>

          <div style={{ background: "#fff", padding: 30, borderRadius: 8, boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
            {error && <div style={{ background: "#fee", color: "#c00", padding: 10, borderRadius: 4, marginBottom: 20 }}>{error}</div>}

            {!pixData ? (
              <>
                <h3 style={{ fontSize: 18, color: "#1e3a29", marginBottom: 20 }}>Escolha como pagar:</h3>
                
                <button onClick={handlePixPayment} disabled={isFinishing} style={{ width: "100%", padding: 16, background: "#1e3a29", color: "#fff", border: 0, borderRadius: 4, fontSize: 14, fontWeight: 700, marginBottom: 15, cursor: "pointer" }}>
                  {isFinishing ? "Gerando Pix..." : "Pagar com Pix"}
                </button>

                <button onClick={handleCardWhatsApp} disabled={isFinishing} style={{ width: "100%", padding: 16, background: "#1e40af", color: "#fff", border: 0, borderRadius: 4, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  {isFinishing ? "Aguarde..." : "Cartão via WhatsApp"}
                </button>
              </>
            ) : (
              <div style={{ textAlign: "center" }}>
                <h3 style={{ color: "#1e3a29", marginBottom: 15 }}>Escaneie o QR Code</h3>
                <img src={`data:image/png;base64,${pixData.qrCodeBase64}`} alt="QR Code" style={{ maxWidth: 200, margin: "0 auto 15px", display: "block" }} />
                <button onClick={() => navigator.clipboard.writeText(pixData.qrCode)} style={{ background: "#f0f0f0", border: 0, padding: "10px 20px", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                  Copiar Código Pix
                </button>
                <div style={{ marginTop: 20, padding: 15, background: "#f0fdf4", borderRadius: 8, color: "#166534", fontSize: 13, fontWeight: 600 }}>
                  Aguardando confirmação do pagamento...
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}