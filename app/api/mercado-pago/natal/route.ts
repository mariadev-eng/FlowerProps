import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
        "X-Idempotency-Key": String(Date.now()),
      },
      body: JSON.stringify({
        transaction_amount: body.transaction_amount,
        description: body.description,
        payment_method_id: "pix",
        external_reference: body.external_reference,
        payer: {
          email: body.payer.email,
          first_name: body.payer.first_name,
          last_name: body.payer.last_name,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.message || "Erro no Mercado Pago" }, { status: 400 });
    }

    return NextResponse.json({
      id: data.id,
      qr_code: data.point_of_interaction.transaction_data.qr_code,
      qr_code_base64: data.point_of_interaction.transaction_data.qr_code_base64,
    });

  } catch (error) {
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}