import { NextResponse } from "next/server";
import { Preference } from "mercadopago";
import { getMercadoPagoClient } from "@/lib/mercado-pago";

export async function POST(request: Request) {
  try {
    const { items, orderId, payer } = await request.json();

    if (!items || !orderId || !payer?.email) {
      return NextResponse.json(
        { error: "Dados incompletos." },
        { status: 400 }
      );
    }

    const client = getMercadoPagoClient();
    const preference = new Preference(client);

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://www.flowerprops.com.br";

    const result = await preference.create({
      body: {
        items: items.map((item: any) => ({
          id: String(item.id),
          title: item.name,
          quantity: item.quantity,
          unit_price: Number(item.price),
          currency_id: "BRL",
        })),
        payer: {
          email: payer.email,
          name: payer.name,
        },
        external_reference: `FLOWER-${orderId}`,
        back_urls: {
          success: `${baseUrl}/pedido-confirmado`,
          pending: `${baseUrl}/pedido-confirmado`,
          failure: `${baseUrl}/pagamento`,
        },
        auto_return: "approved",
        notification_url: `${baseUrl}/api/mercado-pago/webhook`,
      },
    });

    return NextResponse.json({
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
    });
  } catch (error: any) {
    console.error("Erro ao criar preferência:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao criar preferência." },
      { status: 500 }
    );
  }
}