// =========================================================
// VALIDAÇÃO DE CEP — FLOWER
// =========================================================

// Faixa de CEPs de Macaé-RJ (entrega)
const MACAE_CEP_MIN = 27900000;
const MACAE_CEP_MAX = 27999999;

// Faixa de CEPs do Rio de Janeiro (retirada)
const RJ_CEP_MIN = 20000000;
const RJ_CEP_MAX = 28999999;

export type DeliveryMethod = "delivery" | "pickup";

export type CepValidation = {
  valid: boolean;
  error?: string;
  data?: {
    cep: string;
    street: string;
    neighborhood: string;
    city: string;
    state: string;
  };
};

/**
 * Verifica se o CEP tá na faixa de Macaé (entrega)
 */
export function isMacaeCep(cep: string): boolean {
  const clean = cep.replace(/\D/g, "");
  if (clean.length !== 8) return false;

  const cepNumber = parseInt(clean, 10);
  if (isNaN(cepNumber)) return false;

  return cepNumber >= MACAE_CEP_MIN && cepNumber <= MACAE_CEP_MAX;
}

/**
 * Verifica se o CEP tá na faixa do RJ (retirada)
 */
export function isRioCep(cep: string): boolean {
  const clean = cep.replace(/\D/g, "");
  if (clean.length !== 8) return false;

  const cepNumber = parseInt(clean, 10);
  if (isNaN(cepNumber)) return false;

  return cepNumber >= RJ_CEP_MIN && cepNumber <= RJ_CEP_MAX;
}

/**
 * Valida o CEP conforme o método de recebimento
 *
 * - delivery (entrega): só Macaé
 * - pickup (retirada): qualquer CEP do RJ
 */
export async function validateCep(
  cep: string,
  method: DeliveryMethod = "delivery"
): Promise<CepValidation> {
  const clean = cep.replace(/\D/g, "");

  if (clean.length !== 8) {
    return {
      valid: false,
      error: "CEP incompleto. Digite os 8 números.",
    };
  }

  // Verificação rápida de faixa (antes de chamar API)
  if (method === "delivery" && !isMacaeCep(clean)) {
    return {
      valid: false,
      error:
        "Infelizmente entregamos apenas em Macaé-RJ. Se você está em outra cidade, escolha 'Retirar no ateliê' ou entre em contato pelo WhatsApp.",
    };
  }

  if (method === "pickup" && !isRioCep(clean)) {
    return {
      valid: false,
      error:
        "A retirada no ateliê está disponível apenas para clientes do estado do Rio de Janeiro.",
    };
  }

  // Consulta no ViaCEP pra pegar endereço completo
  try {
    const response = await fetch(
      `https://viacep.com.br/ws/${clean}/json/`
    );

    if (!response.ok) {
      throw new Error("Erro na consulta");
    }

    const data = await response.json();

    if (data.erro) {
      return {
        valid: false,
        error: "CEP não encontrado. Verifique e tente novamente.",
      };
    }

    // Confirma a cidade (só Macaé pra entrega)
    if (method === "delivery") {
      const city = (data.localidade || "").toLowerCase().trim();
      if (city !== "macaé" && city !== "macae") {
        return {
          valid: false,
          error:
            "Infelizmente entregamos apenas em Macaé-RJ. Confira o CEP digitado.",
        };
      }
    }

    return {
      valid: true,
      data: {
        cep: clean,
        street: data.logradouro || "",
        neighborhood: data.bairro || "",
        city: data.localidade || "",
        state: data.uf || "",
      },
    };
  } catch (error) {
    return {
      valid: false,
      error:
        "Não foi possível consultar o CEP. Verifique sua conexão e tente novamente.",
    };
  }
}