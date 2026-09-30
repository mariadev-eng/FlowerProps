import { NextResponse } from "next/server";
import { Payment } from "mercadopago";
import { mercadoPagoClient } from "@/lib/mercado-pago";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      token,
      payment_method_id,
      installments,
      transaction_amount,
      payer,
      description,
      external_reference,
      device_id, // 🆕 Recebe o device id do frontend
    } = body;

    // Validação básica
    if (!payment_method_id || !transaction_amount || !payer?.email) {
      return NextResponse.json(
        { error: "Dados de pagamento incompletos." },
        { status: 400 }
      );
    }

    // Se for cartão, precisa do token
    if (payment_method_id !== "pix" && !token) {
      return NextResponse.json(
        { error: "Token do cartão não informado." },
        { status: 400 }
      );
    }

    const payment = new Payment(mercadoPagoClient);

    // ==========================================
    // MONTAR O BODY DO PAGAMENTO
    // ==========================================

    const paymentBody: any = {
      payment_method_id,
      transaction_amount: Number(transaction_amount),
      payer: {
        email: payer.email,
        first_name: payer.first_name,
        last_name: payer.last_name,
      },
      description: description || "Pedido FLOWER PROPS",
      external_reference: external_reference || `FLOWER-${Date.now()}`,
    };

    // Se for cartão, adiciona token e parcelas
    if (payment_method_id !== "pix") {
      paymentBody.token = token;
      paymentBody.installments = Number(installments) || 1;
    }

    // ==========================================
    // 🆕 MONTAR REQUEST OPTIONS COM DEVICE ID
    // ==========================================

    const requestOptions: any = {};

    if (device_id) {
      requestOptions.headers = {
        "X-meli-session-id": device_id, // 🆕 Envia o device id pro Mercado Pago
      };
    }

    // ==========================================
    // CRIAR O PAGAMENTO
    // ==========================================

    const result = await payment.create({
      body: paymentBody,
      requestOptions, // 🆕 Passa o header com o device id
    });

    // ==========================================
    // DEVOLVER PRO FRONTEND
    // ==========================================

    const response: any = {
      id: result.id,
      status: result.status,
      status_detail: result.status_detail,
      payment_method_id: result.payment_method_id,
      transaction_amount: result.transaction_amount,
      date_approved: result.date_approved,
    };

    // Se for Pix, devolve o QR Code
    if (payment_method_id === "pix") {
      response.qr_code =
        result.point_of_interaction?.transaction_data?.qr_code || null;
      response.qr_code_base64 =
        result.point_of_interaction?.transaction_data?.qr_code_base64 || null;
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Erro no processamento do pagamento:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Falha ao processar o pagamento. Tente novamente.",
      },
      { status: 500 }
    );
  }
}