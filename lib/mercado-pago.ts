import { MercadoPagoConfig } from "mercadopago";

let client: MercadoPagoConfig | null = null;

export function getMercadoPagoClient(): MercadoPagoConfig {
  if (client) return client;

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  console.log(
    `=== LIB MP | Token: ${!!accessToken} | ` +
      `Prefixo: ${accessToken?.substring(0, 12)} | ` +
      `Tamanho: ${accessToken?.length} ===`
  );

  if (!accessToken) {
    throw new Error(
      "MERCADO_PAGO_ACCESS_TOKEN não está configurado."
    );
  }

  client = new MercadoPagoConfig({
    accessToken,
    options: {
      timeout: 10000,
    },
  });

  return client;
}