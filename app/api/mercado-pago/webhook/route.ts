import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { supabase } from "@/lib/supabase";

// Função para validar a assinatura (segurança)
function verifySignature(xSignature: string, xRequestId: string, dataId: string): boolean {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) {
    console.error("MERCADO_PAGO_WEBHOOK_SECRET não configurado.");
    return false;
  }

  try {
    const parts = xSignature.split(",");
    const tsPart = parts.find((p) => p.startsWith("ts="));
    const v1Part = parts.find((p) => p.startsWith("v1="));

    if (!tsPart || !v1Part) return false;

    const ts = tsPart.split("=")[1];
    const v1 = v1Part.split("=")[1];

    // Monta o "manifest" conforme a documentação
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

    // Gera o hash HMAC-SHA256
    const hmac = createHmac("sha256", secret);
    hmac.update(manifest);
    const generatedHash = hmac.digest("hex");

    // Compara os hashes de forma segura
    return timingSafeEqual(Buffer.from(generatedHash), Buffer.from(v1));
  } catch (error) {
    console.error("Erro na validação da assinatura:", error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const xSignature = request.headers.get("x-signature");
    const xRequestId = request.headers.get("x-request-id");

    // Extrai o ID do pagamento (pode estar em body.data.id ou body.id dependendo do evento)
    const paymentId = body.data?.id || body.id;

    // Validação de segurança
    if (!xSignature || !xRequestId || !paymentId) {
      return NextResponse.json({ received: true }); // Retorna 200 para o MP não reenviar
    }

    const isValid = verifySignature(xSignature, xRequestId, paymentId);
    if (!isValid) {
      console.warn("Assinatura de webhook inválida.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Processa apenas notificações do tipo "payment"
    if (body.type === "payment") {
      // Busca os detalhes atualizados do pagamento na API do Mercado Pago
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` },
      });
      const paymentData = await mpResponse.json();

      if (paymentData.status === "approved") {
        const orderId = paymentData.external_reference?.replace("FLOWER-", "");
        
        if (orderId) {
          // Atualiza o status do pedido no Supabase
          await supabase
            .from("orders")
            .update({ 
              payment_status: "paid", 
              order_status: "confirmed" 
            })
            .eq("id", orderId);
          
          console.log(`Pedido ${orderId} atualizado para PAGO.`);
        }
      }
    }

    // Sempre retorna 200 OK para o Mercado Pago saber que recebeu
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erro no processamento do webhook:", error);
    return NextResponse.json({ received: true });
  }
}