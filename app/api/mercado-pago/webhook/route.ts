import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { supabase } from "@/lib/supabase";

// =========================================================
// VALIDAÇÃO DA ASSINATURA DO WEBHOOK
// =========================================================

function verifySignature(
  xSignature: string,
  xRequestId: string,
  dataId: string
): boolean {
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

    // Manifest conforme documentação do Mercado Pago
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

    // Gera HMAC-SHA256
    const hmac = createHmac("sha256", secret);
    hmac.update(manifest);
    const generatedHash = hmac.digest("hex");

    // Compara de forma segura
    return timingSafeEqual(
      Buffer.from(generatedHash),
      Buffer.from(v1)
    );
  } catch (error) {
    console.error("Erro na validação da assinatura:", error);
    return false;
  }
}

// =========================================================
// WEBHOOK POST
// =========================================================

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const xSignature = request.headers.get("x-signature");
    const xRequestId = request.headers.get("x-request-id");

    // ID do pagamento pode estar em body.data.id
    const paymentId = body.data?.id || body.id;

    // Validação básica
    if (!xSignature || !xRequestId || !paymentId) {
      return NextResponse.json({ received: true });
    }

    // Valida a assinatura
    const isValid = verifySignature(xSignature, xRequestId, paymentId);
    if (!isValid) {
      console.warn("Assinatura de webhook inválida.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Só processa eventos do tipo "payment"
    if (body.type === "payment") {
      // Busca detalhes atualizados do pagamento
      const mpResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
          },
        }
      );

      const paymentData = await mpResponse.json();

      // Só processa se estiver aprovado
      if (paymentData.status === "approved") {
        const externalRef = paymentData.external_reference || "";

        console.log("=== WEBHOOK: PAGAMENTO APROVADO ===");
        console.log("External ref:", externalRef);
        console.log("Payment ID:", paymentData.id);

        // =====================================================
        // CASO 1: ASSINATURA (external_reference = "SUBSCRIPTION-123")
        // =====================================================

        if (externalRef.startsWith("SUBSCRIPTION-")) {
          const orderId = externalRef.replace("SUBSCRIPTION-", "");

          if (orderId) {
            const { error } = await supabase
              .from("subscription_orders")
              .update({
                payment_status: "paid",
                payment_id: String(paymentData.id),
              })
              .eq("id", orderId);

            if (error) {
              console.error(
                "ERRO ao atualizar assinatura:",
                error.message
              );
            } else {
              console.log(
                `✅ Assinatura ${orderId} atualizada para PAGO.`
              );
            }
          }
        }

        // =====================================================
        // CASO 2: PEDIDO NORMAL (external_reference = "FLOWER-123")
        // =====================================================

        else if (externalRef.startsWith("FLOWER-")) {
          const orderId = externalRef.replace("FLOWER-", "");

          if (orderId) {
            const { error } = await supabase
              .from("orders")
              .update({
                payment_status: "paid",
                order_status: "confirmed",
                payment_id: String(paymentData.id),
              })
              .eq("id", orderId);

            if (error) {
              console.error("ERRO ao atualizar pedido:", error.message);
            } else {
              console.log(`✅ Pedido ${orderId} atualizado para PAGO.`);
            }
          }
        }

        // =====================================================
        // CASO 3: formato antigo (sem prefixo) — fallback
        // =====================================================

        else {
          // Tenta atualizar em orders primeiro
          const orderId = externalRef.replace("FLOWER-", "");

          if (orderId) {
            const { error } = await supabase
              .from("orders")
              .update({
                payment_status: "paid",
                order_status: "confirmed",
                payment_id: String(paymentData.id),
              })
              .eq("id", orderId);

            if (error) {
              console.error(
                "ERRO ao atualizar (fallback):",
                error.message
              );
            }
          }
        }
      }
    }

    // Sempre retorna 200 OK pro Mercado Pago
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erro no processamento do webhook:", error);
    return NextResponse.json({ received: true });
  }
}