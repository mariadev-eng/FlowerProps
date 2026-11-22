"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CartItem = {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

type CustomerData = {
  name: string;
  phone: string;
  email: string;
  deliveryMethod: "delivery" | "pickup";
};

type NatalData = {
  nome: string;
  dataEvento: string;
  tipoArranjo: string;
  tamanho: string;
  detalhes: string;
  valor: number;
};

export default function OrderConfirmedPage() {
  const router = useRouter();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [natalData, setNatalData] = useState<NatalData | null>(null); // 👈 Estado para o Natal
  
  const [orderNumber, setOrderNumber] = useState("");

  useEffect(() => {
    const savedCart = localStorage.getItem("flower-cart");
    const savedCheckout = localStorage.getItem("flower-checkout");
    const savedNatal = localStorage.getItem("flower-natal-pedido");
    const savedOrderId = localStorage.getItem("flower-order-id");
    const savedOrderNumber = localStorage.getItem("flower-order-number");

    if (savedCart) {
      try { setCartItems(JSON.parse(savedCart)); } catch { setCartItems([]); }
    }
    if (savedCheckout) {
      try { setCustomerData(JSON.parse(savedCheckout)); } catch { setCustomerData(null); }
    }
    if (savedNatal) {
      try { setNatalData(JSON.parse(savedNatal)); } catch {}
    }

    if (savedOrderId) {
      setOrderNumber(savedOrderId);
    } else if (savedOrderNumber) {
      setOrderNumber(savedOrderNumber);
    } else {
      const generatedNumber = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem("flower-order-number", generatedNumber);
      setOrderNumber(generatedNumber);
    }
  }, []);

  function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function goToHome() {
    localStorage.removeItem("flower-cart");
    localStorage.removeItem("flower-checkout");
    localStorage.removeItem("flower-order-number");
    localStorage.removeItem("flower-order-id");
    localStorage.removeItem("flower-natal-pedido");
    router.push("/");
  }

  // ==========================================
  // LÓGICA PARA PRODUTOS NORMAIS
  // ==========================================
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const deliveryFee = customerData?.deliveryMethod === "delivery" ? 15 : 0;
  const total = subtotal + deliveryFee;

  return (
    <main className="confirmed-page">
      <header className="confirmed-header">
        <a href="/" className="confirmed-logo" style={{ display: "flex", alignItems: "center" }}>
          <img 
            src="/images/logonova.png" 
            alt="FLOWER" 
            style={{ height: "80px", width: "auto", objectFit: "contain" }} 
          />
        </a>
        <span className="confirmed-header-label">Pedido</span>
        <div className="confirmed-header-secure">✓ Compra segura</div>
      </header>

      <div className="confirmed-progress">
        <div className="confirmed-progress-step done"><span>✓</span><p>Carrinho</p></div>
        <div className="confirmed-progress-line done" />
        <div className="confirmed-progress-step done"><span>✓</span><p>Dados</p></div>
        <div className="confirmed-progress-line done" />
        <div className="confirmed-progress-step done"><span>✓</span><p>Revisão</p></div>
        <div className="confirmed-progress-line done" />
        <div className="confirmed-progress-step done"><span>✓</span><p>Concluído</p></div>
      </div>

      <section className="confirmed-container">
        <div className="confirmed-icon">✓</div>

        <span className="confirmed-eyebrow">PEDIDO RECEBIDO</span>

        <h1>
          Obrigada por escolher<br />
          <em>a FLOWER.</em>
        </h1>

        <p className="confirmed-description">
          Seu pedido foi recebido com sucesso. Estamos preparando tudo com cuidado para você.
        </p>

        <div className="confirmed-number">
          <span>NÚMERO DO PEDIDO</span>
          <strong>#{orderNumber || "000000"}</strong>
        </div>

        <div className="confirmed-content">
          
          {/* 👇 SE FOR UM PEDIDO DE NATAL, MOSTRA ISSO */}
          {natalData ? (
            <section className="confirmed-card">
              <div className="confirmed-card-heading">
                <span>🎄</span>
                <div>
                  <h2>Resumo do Arranjo</h2>
                  <p>Encomenda Especial de Natal</p>
                </div>
              </div>

              <div style={{ padding: "0 24px 24px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                  <div>
                    <span style={{ fontSize: 12, color: "#7a7a72" }}>Tamanho</span>
                    <p style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>{natalData.tamanho}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 12, color: "#7a7a72" }}>Data do Evento</span>
                    <p style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>{natalData.dataEvento.split("-").reverse().join("/")}</p>
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontSize: 12, color: "#7a7a72" }}>Ocasião</span>
                  <p style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>{natalData.tipoArranjo}</p>
                </div>

                <div style={{ background: "#f9f9f9", padding: 16, borderRadius: 6 }}>
                  <span style={{ fontSize: 12, color: "#7a7a72", display: "block", marginBottom: 4 }}>Detalhes</span>
                  <p style={{ fontSize: 14, fontStyle: "italic", margin: 0 }}>"{natalData.detalhes}"</p>
                </div>
              </div>

              <div className="confirmed-total">
                <span>Valor Total</span>
                <strong>{formatPrice(natalData.valor)}</strong>
              </div>
            </section>
          ) : (
            // 👇 SE FOR UM PEDIDO NORMAL, MOSTRA A LISTA DE PRODUTOS
            <section className="confirmed-card">
              <div className="confirmed-card-heading">
                <span>01</span>
                <div>
                  <h2>Resumo do pedido</h2>
                  <p>{totalItems} {totalItems === 1 ? "item" : "itens"}</p>
                </div>
              </div>

              <div className="confirmed-products">
                {cartItems.map((item) => (
                  <div className="confirmed-product" key={item.id}>
                    <div className="confirmed-product-image">
                      <img src={item.image} alt={item.name} />
                      <span>{item.quantity}</span>
                    </div>
                    <div className="confirmed-product-info">
                      <strong>{item.name}</strong>
                      <p>{item.quantity} {item.quantity === 1 ? "unidade" : "unidades"}</p>
                    </div>
                    <strong className="confirmed-product-price">
                      {formatPrice(item.price * item.quantity)}
                    </strong>
                  </div>
                ))}
              </div>

              <div className="confirmed-total">
                <span>Total</span>
                <strong>{formatPrice(total)}</strong>
              </div>
            </section>
          )}

          {/* RECEBIMENTO (Só mostra se não for Natal) */}
          {!natalData && (
            <section className="confirmed-card">
              <div className="confirmed-card-heading">
                <span>02</span>
                <div>
                  <h2>Recebimento</h2>
                  <p>Informações sobre seu pedido</p>
                </div>
              </div>
              <div className="confirmed-receiving">
                <div className="confirmed-receiving-icon">✿</div>
                <div>
                  <span>{customerData?.deliveryMethod === "pickup" ? "RETIRADA" : "ENTREGA"}</span>
                  <strong>{customerData?.deliveryMethod === "pickup" ? "Retirar no ateliê" : "Receber em casa"}</strong>
                  <p>{customerData?.deliveryMethod === "pickup" ? "Seu pedido ficará disponível para retirada no ateliê FLOWER." : "Seu pedido será entregue no endereço informado."}</p>
                </div>
              </div>
            </section>
          )}

        </div>

        <div className="confirmed-next">
          <div>
            <span>PRÓXIMO PASSO</span>
            <p>
              {natalData 
                ? "Entraremos em contato pelo WhatsApp para combinar a entrega do seu arranjo de Natal."
                : "Acompanhe seu pedido e aguarde a confirmação da entrega."}
            </p>
          </div>
          <button type="button" onClick={goToHome}>
            Voltar ao ateliê
            <span>→</span>
          </button>
        </div>

      </section>
    </main>
  );
}