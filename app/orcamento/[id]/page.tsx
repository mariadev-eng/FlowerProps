"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type OrderItem = {
  id: number;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
};

type Order = {
  id: number;
  customer_name: string;
  customer_phone: string;
  delivery_method: string;
  delivery_day: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  cep: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  observation: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: string;
  created_at: string;
  order_items: OrderItem[];
};

export default function OrcamentoPage() {
  const params = useParams();
  const orderId = Number(params?.id);

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("orders")
        .select(`*, order_items:order_items(*)`)
        .eq("id", orderId)
        .single();

      if (error || !data) {
        console.error("Erro ao carregar pedido:", error);
        setIsLoading(false);
        return;
      }

      setOrder(data);
      setIsLoading(false);
    }

    loadOrder();
  }, [orderId]);

  function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  async function handleDownloadPDF() {
    if (!printRef.current || !order) return;

    try {
      const [{ default: jsPDF }, { toPng }] = await Promise.all([
        import("jspdf"),
        import("html-to-image"),
      ]);

      const dataUrl = await toPng(printRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => (img.onload = resolve));

      const ratio = img.height / img.width;
      const imgWidth = pdfWidth - 20;
      const imgHeight = imgWidth * ratio;

      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(dataUrl, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight - 20;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(dataUrl, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight - 20;
      }

      pdf.save(`orcamento-flower-${order.id}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Erro ao gerar PDF. Tente novamente.");
    }
  }

  if (isLoading) {
    return (
      <main style={loadingWrapStyle}>
        <div style={{ color: "#7a7a72" }}>Carregando orçamento...</div>
      </main>
    );
  }

  if (!order) {
    return (
      <main style={loadingWrapStyle}>
        <div
          style={{
            maxWidth: 480,
            padding: 40,
            textAlign: "center",
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌷</div>
          <h1
            style={{
              margin: "0 0 12px",
              fontSize: 20,
              fontWeight: 600,
              color: "#3f493b",
            }}
          >
            Orçamento não encontrado
          </h1>
          <p style={{ margin: 0, color: "#7a7a72", fontSize: 14 }}>
            O link pode estar errado ou o pedido foi removido.
          </p>
        </div>
      </main>
    );
  }

  const items = order.order_items || [];
  const hasDeliveryFee = order.delivery_fee > 0;

  return (
    <main style={pageWrapStyle}>
      <div className="no-print" style={actionBarStyle}>
        <button
          type="button"
          onClick={() => window.print()}
          style={btnSecondaryStyle}
        >
          🖨️ Imprimir
        </button>

        <button
          type="button"
          onClick={handleDownloadPDF}
          style={btnPrimaryStyle}
        >
          ⬇️ Baixar PDF
        </button>
      </div>

      <div
        ref={printRef}
        style={{
          maxWidth: 720,
          margin: "0 auto",
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)",
          overflow: "hidden",
        }}
      >
        <div style={headerStyle}>
          <div style={brandStyle}>FLOWER</div>
          <div style={brandSubStyle}>BUQUÊS &amp; ACESSÓRIOS</div>
          <div style={dividerStyle} />
          <div style={orcamentoLabelStyle}>ORÇAMENTO</div>
          <div style={orcamentoNumberStyle}>Nº {order.id}</div>
        </div>

        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Cliente</div>
          <div style={clientNameStyle}>{order.customer_name}</div>
          <div style={clientPhoneStyle}>{order.customer_phone}</div>
        </div>

        <div style={dashedDividerStyle} />

        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            {order.delivery_method === "delivery" ? "Entrega" : "Retirada"}
          </div>

          {order.delivery_method === "delivery" ? (
            <>
              <div style={addressLineStyle}>
                {order.street}, {order.number}
                {order.complement && ` — ${order.complement}`}
              </div>
              <div style={addressLineStyle}>{order.neighborhood}</div>
              <div style={addressLineStyle}>
                {order.city}
                {order.cep && ` — CEP ${order.cep}`}
              </div>
            </>
          ) : (
            <div style={addressLineStyle}>
              🏪 Retirada no ateliê FLOWER
            </div>
          )}
        </div>

        <div style={dashedDividerStyle} />

        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Itens</div>

          {items.map((item) => (
            <div key={item.id} style={itemRowStyle}>
              <div style={itemNameStyle}>
                <span style={itemQtyStyle}>{item.quantity}×</span>
                {item.product_name}
              </div>
              <div style={itemPriceStyle}>
                {formatPrice(item.subtotal)}
              </div>
            </div>
          ))}
        </div>

        <div style={dashedDividerStyle} />

        <div style={sectionStyle}>
          {hasDeliveryFee && (
            <>
              <div style={subtotalRowStyle}>
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div style={subtotalRowStyle}>
                <span>Entrega</span>
                <span>{formatPrice(order.delivery_fee)}</span>
              </div>
            </>
          )}

          <div style={totalRowStyle}>
            <span style={totalLabelStyle}>Total</span>
            <span style={totalValueStyle}>{formatPrice(order.total)}</span>
          </div>

          <div style={paymentMethodStyle}>
            Pagamento via {order.payment_method}
          </div>
        </div>

        {order.observation && (
          <>
            <div style={dashedDividerStyle} />
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>Observação</div>
              <div style={observationStyle}>{order.observation}</div>
            </div>
          </>
        )}

        <div style={footerStyle}>
          <div style={footerBrandStyle}>FLOWER PROPS</div>
          <div style={footerTextStyle}>
            Este orçamento é válido por 7 dias a partir da data de emissão.
          </div>
          <div style={footerTextStyle}>
            www.flowerprops.com.br · @_flowerprops_
          </div>
          <div style={footerDateStyle}>
            Emitido em {formatDate(order.created_at)}
          </div>
        </div>
      </div>
    </main>
  );
}

// ==========================================
// ESTILOS
// ==========================================

const pageWrapStyle: React.CSSProperties = {
  minHeight: "100vh",
  padding: "32px 20px 80px",
  background: "#f5f0ea",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const loadingWrapStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f5f0ea",
  padding: 20,
};

const actionBarStyle: React.CSSProperties = {
  maxWidth: 720,
  margin: "0 auto 20px",
  display: "flex",
  gap: 12,
  justifyContent: "flex-end",
};

const btnPrimaryStyle: React.CSSProperties = {
  padding: "12px 24px",
  background: "#166534",
  color: "#fff",
  border: 0,
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  letterSpacing: "0.03em",
};

const btnSecondaryStyle: React.CSSProperties = {
  padding: "12px 24px",
  background: "#fff",
  color: "#3f493b",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

const headerStyle: React.CSSProperties = {
  padding: "40px 48px 32px",
  textAlign: "center",
  background: "#faf6f1",
};

const brandStyle: React.CSSProperties = {
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: 32,
  fontWeight: 700,
  letterSpacing: "0.15em",
  color: "#3f493b",
};

const brandSubStyle: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: "0.35em",
  color: "#7a7a72",
  marginTop: 8,
};

const dividerStyle: React.CSSProperties = {
  width: 60,
  height: 1,
  background: "#d1d5db",
  margin: "20px auto",
};

const orcamentoLabelStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.3em",
  color: "#166534",
  fontWeight: 700,
  textTransform: "uppercase",
};

const orcamentoNumberStyle: React.CSSProperties = {
  fontFamily: "Georgia, serif",
  fontSize: 22,
  fontWeight: 500,
  color: "#3f493b",
  marginTop: 6,
};

const sectionStyle: React.CSSProperties = {
  padding: "24px 48px",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: "0.2em",
  color: "#7a7a72",
  fontWeight: 700,
  textTransform: "uppercase",
  marginBottom: 12,
};

const clientNameStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  color: "#2f2a26",
  marginBottom: 4,
};

const clientPhoneStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#7a7a72",
};

const dashedDividerStyle: React.CSSProperties = {
  borderTop: "1px dashed #d1d5db",
  margin: "0 48px",
};

const addressLineStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#2f2a26",
  lineHeight: 1.7,
};

const itemRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 0",
  gap: 16,
};

const itemNameStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#2f2a26",
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const itemQtyStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "#166534",
  background: "#f0f7f0",
  padding: "2px 8px",
  borderRadius: 4,
};

const itemPriceStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#2f2a26",
  whiteSpace: "nowrap",
};

const subtotalRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: 13,
  color: "#7a7a72",
  marginBottom: 6,
};

const totalRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  paddingTop: 14,
  marginTop: 6,
  borderTop: "1px solid #e0e0dc",
};

const totalLabelStyle: React.CSSProperties = {
  fontSize: 12,
  letterSpacing: "0.2em",
  color: "#7a7a72",
  fontWeight: 700,
  textTransform: "uppercase",
};

const totalValueStyle: React.CSSProperties = {
  fontFamily: "Georgia, serif",
  fontSize: 28,
  fontWeight: 700,
  color: "#166534",
};

const paymentMethodStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#7a7a72",
  textAlign: "right",
  marginTop: 8,
};

const observationStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#2f2a26",
  lineHeight: 1.6,
  whiteSpace: "pre-line",
};

const footerStyle: React.CSSProperties = {
  padding: "32px 48px 40px",
  textAlign: "center",
  background: "#faf6f1",
};

const footerBrandStyle: React.CSSProperties = {
  fontFamily: "Georgia, serif",
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: "0.2em",
  color: "#3f493b",
  marginBottom: 12,
};

const footerTextStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#7a7a72",
  lineHeight: 1.6,
};

const footerDateStyle: React.CSSProperties = {
  fontSize: 10,
  color: "#9ca3af",
  marginTop: 12,
  letterSpacing: "0.05em",
};