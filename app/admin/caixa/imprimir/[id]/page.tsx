"use client";

import { useEffect, useState } from "react";
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
  customer_email: string;
  delivery_method: string;
  delivery_day: string | null;
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

export default function ImprimirPedidoPage() {
  const params = useParams();
  const orderId = Number(params?.id);

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [printerType, setPrinterType] = useState<"a4" | "thermal">("a4");

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) return;

      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items:order_items(*)
        `
        )
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
    const date = new Date(value);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (isLoading) {
    return <div style={{ padding: 40 }}>Carregando...</div>;
  }

  if (!order) {
    return <div style={{ padding: 40 }}>Pedido não encontrado.</div>;
  }

  const isThermal = printerType === "thermal";

  return (
    <>
      {/* BARRA DE CONTROLE (não sai na impressão) */}
      <div className="no-print" style={controlBarStyle}>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => setPrinterType("a4")}
            style={{
              ...printerBtnStyle,
              background: printerType === "a4" ? "#2f2a26" : "#fff",
              color: printerType === "a4" ? "#fff" : "#2f2a26",
            }}
          >
            📄 A4
          </button>
          <button
            type="button"
            onClick={() => setPrinterType("thermal")}
            style={{
              ...printerBtnStyle,
              background: printerType === "thermal" ? "#2f2a26" : "#fff",
              color: printerType === "thermal" ? "#fff" : "#2f2a26",
            }}
          >
            🧾 Térmica 80mm
          </button>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          style={{
            padding: "10px 20px",
            background: "#166534",
            color: "#fff",
            border: 0,
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          🖨️ Imprimir
        </button>
      </div>

      {/* CUPOM */}
      <div
        className="print-area"
        style={{
          padding: isThermal ? 12 : 40,
          maxWidth: isThermal ? 320 : 700,
          margin: "0 auto",
          fontFamily: isThermal ? "monospace" : "system-ui",
          fontSize: isThermal ? 11 : 13,
          color: "#000",
          background: "#fff",
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: "center",
            borderBottom: "1px dashed #000",
            paddingBottom: 8,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontSize: isThermal ? 14 : 18,
              fontWeight: 700,
              letterSpacing: "0.05em",
            }}
          >
            FLOWER PROPS
          </div>
          <div style={{ fontSize: isThermal ? 10 : 11, marginTop: 2 }}>
            {formatDate(order.created_at)}
          </div>
          <div
            style={{
              fontSize: isThermal ? 12 : 14,
              fontWeight: 700,
              marginTop: 4,
            }}
          >
            PEDIDO #{order.id}
          </div>
        </div>

        {/* Cliente */}
        <div style={{ marginBottom: 10 }}>
          <div>
            <strong>Cliente:</strong> {order.customer_name}
          </div>
          <div>
            <strong>Telefone:</strong> {order.customer_phone}
          </div>
        </div>

        {/* Entrega */}
        <div
          style={{
            paddingTop: 8,
            borderTop: "1px dashed #000",
            marginTop: 8,
          }}
        >
          {order.delivery_method === "delivery" ? (
            <>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>
                🚚 ENTREGA
                {order.delivery_day &&
                  ` — ${
                    order.delivery_day === "saturday" ? "Sábado" : "Domingo"
                  }`}
              </div>
              <div>
                {order.street}, {order.number}
                {order.complement && ` — ${order.complement}`}
              </div>
              <div>{order.neighborhood}</div>
              <div>
                {order.city}
              </div>
              {order.cep && <div>CEP {order.cep}</div>}
            </>
          ) : (
            <div style={{ fontWeight: 700 }}>🏪 RETIRADA NO ATELIÊ</div>
          )}
        </div>

        {/* Itens */}
        <div
          style={{
            paddingTop: 8,
            borderTop: "1px dashed #000",
            marginTop: 8,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>ITENS:</div>
          {order.order_items.map((item) => (
            <div key={item.id} style={{ marginBottom: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>
                  {item.quantity}x {item.product_name}
                </span>
                <span>{formatPrice(item.subtotal)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div
          style={{
            paddingTop: 8,
            borderTop: "1px dashed #000",
            marginTop: 8,
          }}
        >
          {order.delivery_fee > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
          )}
          {order.delivery_fee > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Entrega</span>
              <span>{formatPrice(order.delivery_fee)}</span>
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: isThermal ? 13 : 16,
              fontWeight: 700,
              marginTop: 4,
            }}
          >
            <span>TOTAL</span>
            <span>{formatPrice(order.total)}</span>
          </div>
          <div
            style={{
              textAlign: "center",
              marginTop: 6,
              fontSize: isThermal ? 10 : 11,
            }}
          >
            Pago via {order.payment_method}
          </div>
        </div>

        {/* Observações */}
        {order.observation && (
          <div
            style={{
              paddingTop: 8,
              borderTop: "1px dashed #000",
              marginTop: 8,
              fontSize: isThermal ? 10 : 11,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 2 }}>OBS:</div>
            <div style={{ whiteSpace: "pre-line" }}>{order.observation}</div>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            marginTop: 16,
            fontSize: isThermal ? 9 : 10,
            paddingTop: 8,
            borderTop: "1px dashed #000",
          }}
        >
          www.flowerprops.com.br
        </div>
      </div>

      {/* ESTILOS DE IMPRESSÃO */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            margin: 0;
            padding: 0;
          }
          @page {
            size: ${isThermal ? "80mm auto" : "A4"};
            margin: ${isThermal ? "5mm" : "15mm"};
          }
        }
      `}</style>
    </>
  );
}

const controlBarStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  padding: "12px 20px",
  background: "#fff",
  borderBottom: "1px solid #e0e0dc",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  zIndex: 10,
};

const printerBtnStyle: React.CSSProperties = {
  padding: "8px 16px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};