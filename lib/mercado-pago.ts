import { MercadoPagoConfig } from "mercadopago";

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

// 🆕 DEBUG — apaga depois que resolver
console.log(
  `=== LIB MP | Token: ${!!accessToken} | ` +
    `Prefixo: ${accessToken?.substring(0, 12)} | ` +
    `Tamanho: ${accessToken?.length} ===`
);

if (!accessToken) {
  throw new Error(
    "MERCADO_PAGO_ACCESS_TOKEN não está configurado. Verifique as env vars da Vercel."
  );
}

export const mercadoPagoClient = new MercadoPagoConfig({
  accessToken,
  options: {
    timeout: 10000,
  },
});