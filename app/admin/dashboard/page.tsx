"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type OrderItem = {
  id: number;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
  item_type: string;
};

type Order = {
  id: number;
  customer_name: string;
  customer_email: string;
  total: number;
  payment_status: string;
  order_status: string;
  created_at: string;
  order_items?: OrderItem[];
};

type SubscriptionOrder = {
  id: number;
  customer_name: string;
  customer_email: string;
  plan_name: string;
  plan_price: number;
  payment_status: string;
  next_renewal_at: string | null;
  last_payment_at: string | null;
};

// 👇 Tipo para os pedidos de Natal
type ChristmasOrder = {
  id: number;
  nome: string;
  data_evento: string;
  tipo_arranjo: string;
  tamanho: string;
  valor: number;
  payment_status: string;
  created_at: string;
};

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionOrder[]>([]);
  const [natalOrders, setNatalOrders] = useState<ChristmasOrder[]>([]); // 👈 Estado do Natal
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 1. Pedidos normais (pagos hoje)
      const { data: ordersData } = await supabase
        .from("orders")
        .select("*, order_items:order_items(*)")
        .eq("payment_status", "paid")
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false });

      setOrders(ordersData ?? []);

      // 2. Assinaturas pagas
      const { data: subsData } = await supabase
        .from("subscription_orders")
        .select("*")
        .eq("payment_status", "paid")
        .order("created_at", { ascending: false });

      setSubscriptions(subsData ?? []);

      // 3. 👇 Pedidos de Natal pagos hoje
      const { data: natalData } = await supabase
        .from("christmas_quotes")
        .select("*")
        .eq("payment_status", "paid")
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false });

      setNatalOrders(natalData ?? []);

      setIsLoading(false);
    }

    loadData();
  }, []);

  // ==========================================
  // CÁLCULOS
  // ==========================================

  const ordersWithProducts = orders.filter((o) => {
    if (!o.order_items || o.order_items.length === 0) {
      return true;
    }
    return o.order_items.some((item) => item.item_type === "product");
  });

  // 👇 Soma do faturamento normal + faturamento de Natal
  const faturamentoNormal = ordersWithProducts.reduce((sum, o) => sum + Number(o.total), 0);
  const faturamentoNatal = natalOrders.reduce((sum, o) => sum + Number(o.valor || 0), 0);
  const faturamentoHoje = faturamentoNormal + faturamentoNatal;

  // 👇 Contagem de pedidos normais + Natal
  const pedidosHoje = ordersWithProducts.length + natalOrders.length;

  const assinaturasAtivas = subscriptions.length;

  const vencendoEm7Dias = subscriptions.filter((s) => {
    if (!s.next_renewal_at) return false;
    const now = new Date();
    const renewal = new Date(s.next_renewal_at);
    const diffDays = (renewal.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7;
  }).length;

  function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatDateTime(value: string) {
    const date = new Date(value);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (isLoading) {
    return <div style={emptyStyle}>Carregando dashboard...</div>;
  }

  // Junta os dois tipos de pedidos para listar
  const todosPedidosRecentes = [
    ...ordersWithProducts.map(o => ({ ...o, isNatal: false, nomeExibicao: o.customer_name, emailExibicao: o.customer_email, valorExibicao: o.total })),
    ...natalOrders.map(n => ({ ...n, isNatal: true, nomeExibicao: n.nome, emailExibicao: `Arranjo: ${n.tamanho}`, valorExibicao: n.valor }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div>
      {/* HEADER */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 600, color: "#2f2a26" }}>
          Dashboard
        </h1>
        <p style={{ margin: 0, color: "#7a7a72", fontSize: 13 }}>
          Visão geral do seu negócio
        </p>
      </div>

      {/* CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 32 }}>
        <DashboardCard title="Faturamento hoje" value={formatPrice(faturamentoHoje)} color="#166534" icon="💰" href="/admin/contabil" />
        <DashboardCard title="Pedidos hoje" value={String(pedidosHoje)} color="#1e40af" icon="📦" href="/admin/caixa" />
        <DashboardCard title="Assinaturas ativas" value={String(assinaturasAtivas)} color="#7c3aed" icon="📅" href="/admin/assinaturas" />
        <DashboardCard title="Vencendo em 7 dias" value={String(vencendoEm7Dias)} color={vencendoEm7Dias > 0 ? "#dc2626" : "#7a7a72"} icon={vencendoEm7Dias > 0 ? "⚠️" : "✅"} href="/admin/assinaturas" />
      </div>

      {/* ÚLTIMOS PEDIDOS */}
      <div style={{ background: "#fff", border: "1px solid #e0e0dc", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e0e0dc", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#2f2a26" }}>
            Últimos pedidos de hoje
          </h2>
          <Link href="/admin/caixa" style={{ fontSize: 12, color: "#166534", textDecoration: "none", fontWeight: 600 }}>
            Ver todos →
          </Link>
        </div>

        {todosPedidosRecentes.length === 0 ? (
          <div style={emptyStyle}>Nenhum pedido hoje ainda.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f9f9f7" }}>
                <th style={thStyle}>#</th>
                <th style={thStyle}>Cliente / Tipo</th>
                <th style={thStyle}>Data</th>
                <th style={thStyle}>Total</th>
              </tr>
            </thead>
            <tbody>
              {todosPedidosRecentes.slice(0, 6).map((order: any) => (
                <tr key={`${order.isNatal ? 'natal' : 'normal'}-${order.id}`} style={{ borderTop: "1px solid #f0f0ec" }}>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>
                    {order.isNatal ? `🎄 #${order.id}` : `#${order.id}`}
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 500 }}>
                      {order.nomeExibicao}
                    </div>
                    <div style={{ fontSize: 11, color: "#7a7a72" }}>
                      {order.emailExibicao}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, color: "#7a7a72" }}>
                    {formatDateTime(order.created_at)}
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: "#166534" }}>
                    {formatPrice(order.valorExibicao)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function DashboardCard({ title, value, color, icon, href }: { title: string; value: string; color: string; icon: string; href: string; }) {
  return (
    <Link href={href} style={{ display: "block", background: "#fff", border: "1px solid #e0e0dc", borderRadius: 8, padding: 20, textDecoration: "none", transition: "all 0.15s" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#2f2a26"; e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e0e0dc"; e.currentTarget.style.transform = "translateY(0)"; }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: "#7a7a72", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{title}</span>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
    </Link>
  );
}

const thStyle: React.CSSProperties = { padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#7a7a72", textTransform: "uppercase", letterSpacing: "0.05em" };
const tdStyle: React.CSSProperties = { padding: "12px 16px", color: "#2f2a26" };
const emptyStyle: React.CSSProperties = { padding: 40, textAlign: "center", color: "#7a7a72", fontSize: 13 };