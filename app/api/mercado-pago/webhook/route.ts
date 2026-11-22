import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { supabase } from "@/lib/supabase";

// =========================================================
// CÁLCULO DA PRÓXIMA ENTREGA
// =========================================================

function calculateNextDeliveryDate(
  baseDate: Date,
  frequency: string,
  deliveryDay: "saturday" | "sunday"
): Date {
  const result = new Date(baseDate);

  if (frequency === "weekly") {
    result.setDate(result.getDate() + 7);
  } else if (frequency === "biweekly") {
    result.setDate(result.getDate() + 15);
  } else {
    result.setMonth(result.getMonth() + 1);
  }

  const targetDay = deliveryDay === "saturday" ? 6 : 0;
  while (result.getDay() !== targetDay) {
    result.setDate(result.getDate() + 1);
  }

  return result;
}

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

    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

    const hmac = createHmac("sha256", secret);
    hmac.update(manifest);
    const generatedHash = hmac.digest("hex");

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

    const paymentId = body.data?.id || body.id;

    if (!xSignature || !xRequestId || !paymentId) {
      return NextResponse.json({ received: true });
    }

    const isValid = verifySignature(xSignature, xRequestId, paymentId);
    if (!isValid) {
      console.warn("Assinatura de webhook inválida.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (body.type === "payment") {
      const mpResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
          },
        }
      );

      const paymentData = await mpResponse.json();

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
            const { data: sub } = await supabase
              .from("subscription_orders")
              .select("*")
              .eq("id", orderId)
              .single();

            if (sub) {
              const baseDate = sub.last_delivered_at
                ? new Date(sub.last_delivered_at)
                : new Date();

              const deliveryDay =
                sub.delivery_day === "sunday" ? "sunday" : "saturday";

              const nextDelivery = calculateNextDeliveryDate(
                baseDate,
                sub.plan_frequency,
                deliveryDay
              );

              const { error } = await supabase
                .from("subscription_orders")
                .update({
                  payment_status: "paid",
                  payment_id: String(paymentData.id),
                  last_payment_at: new Date().toISOString(),
                  next_renewal_at: nextDelivery.toISOString(),
                  last_delivered_at: null,
                  current_cycle_start: new Date().toISOString(),
                })
                .eq("id", orderId);

              if (error) {
                console.error("ERRO ao atualizar assinatura:", error.message);
              } else {
                console.log(`✅ Assinatura ${orderId} renovada!`);
                console.log(`   Próxima entrega: ${nextDelivery.toISOString()}`);

                await supabase
                  .from("subscription_deliveries")
                  .delete()
                  .eq("subscription_order_id", orderId);

                console.log(`🗑️ Entregas antigas removidas`);
              }

              if (sub.customer_email) {
                try {
                  const response = await fetch(
                    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/enviar-email-renovacao`,
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                      },
                      body: JSON.stringify({
                        subscription_order_id: sub.id,
                        next_delivery_date: nextDelivery.toISOString(),
                      }),
                    }
                  );

                  if (!response.ok) {
                    const errorData = await response.json();
                    console.error("❌ Erro na Edge Function de e-mail:", errorData);
                  } else {
                    console.log(`📧 E-mail de renovação enviado com sucesso!`);
                  }
                } catch (emailErr) {
                  console.error("❌ Erro de rede ao chamar a Edge Function:", emailErr);
                }
              }
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
        // CASO 3: ARRANJO DE NATAL (external_reference = "NATAL-123")
        // =====================================================

        else if (externalRef.startsWith("NATAL-")) {
          const orderId = externalRef.replace("NATAL-", "");

          if (orderId) {
            const { error } = await supabase
              .from("christmas_quotes")
              .update({
                payment_status: "paid",
                payment_id: String(paymentData.id),
              })
              .eq("id", orderId);

            if (error) {
              console.error("ERRO ao atualizar pedido de Natal:", error.message);
            } else {
              console.log(`✅ Arranjo de Natal ${orderId} atualizado para PAGO.`);
            }
          }
        }

        // =====================================================
        // CASO 4: formato antigo (sem prefixo) — fallback
        // =====================================================

        else {
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
              console.error("ERRO ao atualizar (fallback):", error.message);
            }
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erro no processamento do webhook:", error);
    return NextResponse.json({ received: true });
  }
}