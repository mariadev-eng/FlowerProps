import { MercadoPagoConfig } from "mercadopago";

if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
  throw new Error(
    "MERCADO_PAGO_ACCESS_TOKEN não está configurado no .env.local"
  );
}

export const mercadoPagoClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
  options: {
    timeout: 10000, // 10 segundos
  },
});