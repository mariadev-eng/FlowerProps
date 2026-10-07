// ==========================================
// EDGE FUNCTION: enviar-email-assinatura
// Dispara quando uma assinatura é paga
// ==========================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FROM_EMAIL = "assinaturas@flowerprops.com.br";
const FROM_NAME = "FLOWER PROPS";
const WHATSAPP_NUMBER = "5522992298475";

// ==========================================
// CÁLCULO DA 1ª ENTREGA
// ==========================================

function calculateFirstDelivery(
  paymentDate: Date,
  deliveryDay: "saturday" | "sunday"
): Date {
  const targetDay = deliveryDay === "saturday" ? 6 : 0;

  const result = new Date(paymentDate);
  result.setHours(12, 0, 0, 0);

  while (result.getDay() !== targetDay) {
    result.setDate(result.getDate() + 1);
  }

  const diffDays = Math.floor(
    (result.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays <= 7) {
    result.setDate(result.getDate() + 7);
  }

  return result;
}

function formatDateBR(date: Date): string {
  const dayName = date
    .toLocaleDateString("pt-BR", { weekday: "long" })
    .replace(/^\w/, (c) => c.toUpperCase());
  const day = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return `${dayName}, ${day}`;
}

// ==========================================
// TEMPLATE HTML DO EMAIL
// ==========================================

function buildEmailHTML(params: {
  customerName: string;
  planName: string;
  planPrice: string;
  deliveryDay: string;
  firstDeliveryDate: string;
}): string {
  const firstName = params.customerName.split(" ")[0];
  const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Olá! Sou ${firstName}, acabei de assinar a FLOWER e queria tirar uma dúvida.`
  )}`;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sua assinatura FLOWER foi confirmada!</title>
</head>
<body style="margin:0; padding:0; background-color:#f2ece6; font-family: Georgia, 'Times New Roman', serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f2ece6; padding:40px 20px;">
    <tr>
      <td align="center">

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.06);">

          <tr>
            <td align="center" style="padding:40px 40px 24px;">
              <div style="font-size:28px; font-weight:700; letter-spacing:0.15em; color:#3f493b; font-family: Georgia, serif;">
                FLOWER
              </div>
              <div style="font-size:10px; letter-spacing:0.3em; color:#7a7a72; margin-top:6px; font-family: Arial, sans-serif;">
                BUQUÊS &amp; ACESSÓRIOS
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px; background-color:#e0e0dc;"></div>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 40px;">

              <h1 style="margin:0 0 20px; font-size:26px; font-weight:500; color:#3f493b; font-family: Georgia, serif; line-height:1.3;">
                Olá, ${firstName}! 🌸
              </h1>

              <p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:#4a4a44; font-family: Arial, sans-serif;">
                Sua assinatura <strong style="color:#3f493b;">FLOWER em Casa</strong> está ativa e confirmada!
                Ficamos muito felizes em ter você com a gente. 💐
              </p>

              <p style="margin:0 0 24px; font-size:15px; line-height:1.7; color:#4a4a44; font-family: Arial, sans-serif;">
                A partir de agora, você vai receber flores fresquinhas
                selecionadas com todo carinho — preparadas especialmente
                pra trazer um pouco de beleza pro seu dia.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f7f0; border-radius:10px; border-left:4px solid #166534; margin:24px 0;">
                <tr>
                  <td style="padding:20px 24px;">
                    <div style="font-size:11px; font-weight:700; letter-spacing:0.15em; color:#166534; text-transform:uppercase; font-family: Arial, sans-serif; margin-bottom:8px;">
                      📅 Sua primeira entrega
                    </div>
                    <div style="font-size:20px; font-weight:600; color:#166534; font-family: Georgia, serif; margin-bottom:4px;">
                      ${params.firstDeliveryDate}
                    </div>
                    <div style="font-size:13px; color:#4a4a44; font-family: Arial, sans-serif;">
                      Dia escolhido: <strong>${params.deliveryDay}</strong>
                    </div>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                <tr>
                  <td style="padding:12px 0; border-bottom:1px solid #f0f0ec;">
                    <table role="presentation" width="100%">
                      <tr>
                        <td style="font-size:13px; color:#7a7a72; font-family: Arial, sans-serif;">Plano</td>
                        <td align="right" style="font-size:13px; color:#3f493b; font-weight:600; font-family: Arial, sans-serif;">${params.planName}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0; border-bottom:1px solid #f0f0ec;">
                    <table role="presentation" width="100%">
                      <tr>
                        <td style="font-size:13px; color:#7a7a72; font-family: Arial, sans-serif;">Valor</td>
                        <td align="right" style="font-size:13px; color:#3f493b; font-weight:600; font-family: Arial, sans-serif;">${params.planPrice}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;">
                    <table role="presentation" width="100%">
                      <tr>
                        <td style="font-size:13px; color:#7a7a72; font-family: Arial, sans-serif;">Próxima renovação</td>
                        <td align="right" style="font-size:13px; color:#3f493b; font-weight:600; font-family: Arial, sans-serif;">Automática</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 16px; font-size:15px; line-height:1.7; color:#4a4a44; font-family: Arial, sans-serif;">
                Estamos ansiosos pela sua primeira entrega! Mal podemos
                esperar pra ver a sua reação ao receber essas flores. 🌷
              </p>

              <p style="margin:0 0 24px; font-size:15px; line-height:1.7; color:#4a4a44; font-family: Arial, sans-serif;">
                Qualquer dúvida ou se precisar ajustar algo, é só chamar
                a gente no WhatsApp — vai ser um prazer te atender.
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:32px auto;">
                <tr>
                  <td align="center" style="border-radius:8px; background-color:#25D366;">
                    <a href="${waLink}" target="_blank" style="display:inline-block; padding:14px 32px; font-size:14px; font-weight:700; color:#ffffff; text-decoration:none; font-family: Arial, sans-serif; letter-spacing:0.05em; border-radius:8px;">
                      💬 Falar no WhatsApp
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0; font-size:15px; line-height:1.7; color:#4a4a44; font-family: Arial, sans-serif;">
                Obrigada pela confiança e pela preferência. 💚
              </p>

              <p style="margin:16px 0 0; font-size:15px; line-height:1.7; color:#3f493b; font-family: Georgia, serif; font-style:italic;">
                Com carinho,<br>
                Equipe FLOWER PROPS
              </p>

            </td>
          </tr>

          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px; background-color:#e0e0dc;"></div>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:24px 40px 32px;">
              <div style="font-size:11px; color:#7a7a72; font-family: Arial, sans-serif; line-height:1.6;">
                <a href="https://www.flowerprops.com.br" style="color:#166534; text-decoration:none; font-weight:600;">www.flowerprops.com.br</a><br>
                Este é um email automático, mas pode responder se precisar. 🌸
              </div>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
}

// ==========================================
// HANDLER PRINCIPAL
// ==========================================

serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const body = await req.json();
    const { subscription_order_id } = body;

    if (!subscription_order_id) {
      return new Response(
        JSON.stringify({ error: "subscription_order_id ausente" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`📧 Processando email para assinatura #${subscription_order_id}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: subscription, error: fetchError } = await supabase
      .from("subscription_orders")
      .select("*")
      .eq("id", subscription_order_id)
      .single();

    if (fetchError || !subscription) {
      console.error("Assinatura não encontrada:", fetchError);
      return new Response(
        JSON.stringify({ error: "Assinatura não encontrada" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const { data: existingLog } = await supabase
      .from("email_logs")
      .select("id")
      .eq("subscription_order_id", subscription_order_id)
      .eq("template", "subscription_confirmation")
      .eq("status", "sent")
      .maybeSingle();

    if (existingLog) {
      console.log("⏭️  Email já enviado anteriormente, ignorando.");
      return new Response(
        JSON.stringify({ skipped: true, reason: "already_sent" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const paymentDate = new Date(
      subscription.last_payment_at || subscription.created_at
    );

    const deliveryDay: "saturday" | "sunday" =
      subscription.delivery_day === "sunday" ? "sunday" : "saturday";

    const firstDelivery = calculateFirstDelivery(paymentDate, deliveryDay);
    const firstDeliveryFormatted = formatDateBR(firstDelivery);

    const deliveryDayLabel =
      deliveryDay === "saturday" ? "Sábado" : "Domingo";

    const priceFormatted = Number(subscription.plan_price).toLocaleString(
      "pt-BR",
      { style: "currency", currency: "BRL" }
    );

    const html = buildEmailHTML({
      customerName: subscription.customer_name,
      planName: subscription.plan_name,
      planPrice: priceFormatted,
      deliveryDay: deliveryDayLabel,
      firstDeliveryDate: firstDeliveryFormatted,
    });

    const subject = `🌸 ${subscription.customer_name.split(" ")[0]}, sua assinatura FLOWER está ativa!`;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [subscription.customer_email],
        subject,
        html,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("❌ Erro do Resend:", resendData);

      await supabase.from("email_logs").insert({
        subscription_order_id: subscription.id,
        recipient_email: subscription.customer_email,
        subject,
        template: "subscription_confirmation",
        status: "failed",
        error: JSON.stringify(resendData),
      });

      return new Response(
        JSON.stringify({ error: "Erro ao enviar email", details: resendData }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Email enviado:", resendData.id);

    await supabase.from("email_logs").insert({
      subscription_order_id: subscription.id,
      recipient_email: subscription.customer_email,
      subject,
      template: "subscription_confirmation",
      status: "sent",
      resend_id: resendData.id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        email_id: resendData.id,
        first_delivery: firstDeliveryFormatted,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("❌ Erro inesperado:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});