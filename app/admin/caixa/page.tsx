"use client";

import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import { toPng } from "html-to-image";
import { supabase } from "@/lib/supabase";

// ==========================================
// TIPOS
// ==========================================

type OrderItem = {
  id: number;
  order_id: number;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
  item_type: string;
};

type Order = {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
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
  payment_status: string;
  order_status: string;
  created_at: string;
  order_items?: OrderItem[];
};

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: number;
  image: string | null;
  available: boolean;
  requires_flower_selection: boolean;
  max_flowers: number | null;
};

type Subscription = {
  id: number;
  name: string;
  description: string;
  price: number;
  frequency: string;
  deliveries_per_month: number;
  image: string | null;
  available: boolean;
  display_order: number;
};

type Flower = {
  name: string;
  image: string;
};

type Color = {
  name: string;
  hex: string;
  image: string;
  active: boolean;
};

type CartLine = {
  id: string;
  kind: "product" | "subscription";      // 👈 NOVO
  product: Product | Subscription;        // 👈 aceita os dois
  quantity: number;
  delivery_day?: "saturday" | "sunday";   // 👈 só pra assinatura
  selectedFlowers: Flower[];
  selectedColor: Color | null;
};

const CATEGORIES = [
  { id: 1, name: "Buquês" },
  { id: 3, name: "Presentes" },
  { id: 4, name: "Acessórios" },
];

const HOURS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

const PAYMENT_METHODS = [
  { value: "dinheiro", label: "💵 Dinheiro" },
  { value: "pix", label: "⚡ Pix" },
  { value: "card", label: "💳 Cartão (maquininha)" },
  { value: "checkout_pro", label: "🔗 Link MP" },
];

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function CaixaPage() {
  const [activeTab, setActiveTab] = useState<"fila" | "novo">("fila");

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{
            margin: "0 0 16px",
            fontSize: 22,
            fontWeight: 600,
            color: "#2f2a26",
          }}
        >
          Caixa
        </h1>

        <div
          style={{
            display: "flex",
            gap: 4,
            borderBottom: "1px solid #e0e0dc",
          }}
        >
          <SubTab
            active={activeTab === "fila"}
            onClick={() => setActiveTab("fila")}
          >
            📋 Fila de Pedidos
          </SubTab>
          <SubTab
            active={activeTab === "novo"}
            onClick={() => setActiveTab("novo")}
          >
            ➕ Novo Pedido
          </SubTab>
        </div>
      </div>

      {activeTab === "fila" && <FilaPedidos />}
      {activeTab === "novo" && <NovoPedido onCreated={() => setActiveTab("fila")} />}
    </div>
  );
}

// ==========================================
// SUB-ABA
// ==========================================

function SubTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "10px 16px",
        background: "transparent",
        border: 0,
        borderBottom: active ? "2px solid #2f2a26" : "2px solid transparent",
        color: active ? "#2f2a26" : "#7a7a72",
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        cursor: "pointer",
        marginBottom: -1,
      }}
    >
      {children}
    </button>
  );
}

// ==========================================
// FILA DE PEDIDOS
// ==========================================

function FilaPedidos() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deliveryFilter, setDeliveryFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("today");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  async function loadOrders() {
    setIsLoading(true);

    let dateCondition = "";
    const now = new Date();

    if (dateFilter === "today") {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      dateCondition = start.toISOString();
    } else if (dateFilter === "week") {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      dateCondition = start.toISOString();
    }

    let query = supabase
      .from("orders")
      .select(`*, order_items:order_items(*)`)
      .eq("payment_status", "paid")
      .eq("order_status", "confirmed")
      .order("created_at", { ascending: true });

    if (dateCondition) {
      query = query.gte("created_at", dateCondition);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao carregar pedidos:", error);
      setOrders([]);
    } else {
      setOrders(data ?? []);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadOrders();
  }, [dateFilter]);

  const filtered = orders.filter((o) => {
    if (deliveryFilter !== "all" && o.delivery_method !== deliveryFilter) {
      return false;
    }
    return true;
  });

  async function markAsDelivered(id: number) {
    if (!confirm("Marcar esse pedido como ENTREGUE?")) return;
    setActionLoading(id);

    const { error } = await supabase
      .from("orders")
      .update({
        order_status: "delivered",
        delivered_at: new Date().toISOString(),
      })
      .eq("id", id);

    setActionLoading(null);

    if (error) {
      alert("Erro: " + error.message);
      return;
    }

    setOrders((current) => current.filter((o) => o.id !== id));
  }

  async function cancelOrder(id: number) {
    if (!confirm("Cancelar esse pedido? Essa ação não pode ser desfeita."))
      return;
    setActionLoading(id);

    const { error } = await supabase
      .from("orders")
      .update({
        order_status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", id);

    setActionLoading(null);

    if (error) {
      alert("Erro: " + error.message);
      return;
    }

    setOrders((current) => current.filter((o) => o.id !== id));
  }

  function handlePrint(orderId: number) {
    window.open(`/admin/caixa/imprimir/${orderId}`, "_blank");
  }

  function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }
// ==========================================
// GERAR PDF + ABRIR WHATSAPP
// ==========================================

async function handleOrcamento(order: Order) {
  try {
    // Cria container temporário com o layout do pedido
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.style.top = "0";
    container.style.width = "800px";
    container.style.background = "#fff";
    container.style.padding = "40px";
    container.style.fontFamily =
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    container.style.color = "#2f2a26";

    container.innerHTML = buildOrcamentoHTML(order);
    document.body.appendChild(container);

    // Converte em imagem
    const dataUrl = await toPng(container, {
      quality: 1,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    });

    // Remove o container temporário
    document.body.removeChild(container);

    // Cria PDF A4
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Calcula altura proporcional da imagem
    const img = new Image();
    img.src = dataUrl;
    await new Promise((resolve) => (img.onload = resolve));

    const ratio = img.height / img.width;
    const imgWidth = pdfWidth;
    const imgHeight = imgWidth * ratio;

    // Se a imagem for maior que 1 página, divide
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(dataUrl, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(dataUrl, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    // Baixa o PDF
    pdf.save(`orcamento-pedido-${order.id}.pdf`);

    // Abre WhatsApp Web em nova aba
    window.open("whatsapp://", "_blank");
    // Avisa o operador
    setTimeout(() => {
      alert(
        `✅ PDF do pedido #${order.id} baixado!\n\nAgora procure "${order.customer_name}" no WhatsApp e anexe o arquivo.`
      );
    }, 500);
  } catch (err) {
    console.error("Erro ao gerar orçamento:", err);
    alert("Erro ao gerar o PDF. Verifique o console.");
  }
}
  function formatDate(value: string) {
    const date = new Date(value);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatScheduled(dateStr: string | null, timeStr: string | null) {
    if (!dateStr && !timeStr) return null;

    let dayName = "";
    if (dateStr) {
      const d = new Date(dateStr + "T12:00:00");
      dayName = d.toLocaleDateString("pt-BR", { weekday: "long" });
      dayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    }

    const parts = [];
    if (dayName) parts.push(dayName);
    if (dateStr)
      parts.push(
        new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        })
      );
    if (timeStr) parts.push(`às ${timeStr}`);

    return parts.join(" ");
  }

  return (
    <>
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <p style={{ margin: 0, color: "#7a7a72", fontSize: 13 }}>
          {filtered.length}{" "}
          {filtered.length === 1
            ? "pedido aguardando"
            : "pedidos aguardando"}{" "}
          entrega
        </p>

        <div style={{ display: "flex", gap: 8 }}>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="today">Hoje</option>
            <option value="week">Últimos 7 dias</option>
            <option value="all">Todos</option>
          </select>

          <select
            value={deliveryFilter}
            onChange={(e) => setDeliveryFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="all">Todos os tipos</option>
            <option value="delivery">Entrega</option>
            <option value="pickup">Retirada</option>
          </select>

          <button
            type="button"
            onClick={loadOrders}
            disabled={isLoading}
            style={refreshBtnStyle}
          >
            {isLoading ? "..." : "↻"}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={emptyStyle}>Carregando pedidos...</div>
      ) : filtered.length === 0 ? (
        <div style={emptyStyle}>🎉 Nenhum pedido aguardando entrega.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((order) => (
            <div
              key={order.id}
              style={{
                background: "#fff",
                border: "1px solid #e0e0dc",
                borderRadius: 8,
                padding: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 16,
                  marginBottom: 12,
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 4,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#7a7a72",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Pedido #{order.id}
                    </span>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 600,
                        background:
                          order.delivery_method === "delivery"
                            ? "#dbeafe"
                            : "#fef3c7",
                        color:
                          order.delivery_method === "delivery"
                            ? "#1e40af"
                            : "#854d0e",
                      }}
                    >
                      {order.delivery_method === "delivery"
                        ? "🚚 Entrega"
                        : "🏪 Retirada"}
                    </span>
                    {(order.scheduled_date || order.scheduled_time) && (
                      <span
                        style={{
                          fontSize: 11,
                          color: "#166534",
                          fontWeight: 600,
                        }}
                      >
                        📅{" "}
                        {formatScheduled(
                          order.scheduled_date,
                          order.scheduled_time
                        )}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: "#2f2a26",
                    }}
                  >
                    {order.customer_name}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: "#7a7a72",
                      marginTop: 2,
                    }}
                  >
                    {order.customer_phone} · {formatDate(order.created_at)}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#166534",
                    }}
                  >
                    {formatPrice(order.total)}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "#7a7a72",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginTop: 2,
                    }}
                  >
                    {order.payment_method}
                  </div>
                </div>
              </div>

              {order.order_items && order.order_items.length > 0 && (
                <div
                  style={{
                    padding: "8px 12px",
                    background: "#f9f9f7",
                    borderRadius: 6,
                    marginBottom: 12,
                    fontSize: 12,
                    color: "#2f2a26",
                  }}
                >
                  {order.order_items.map((item, i) => (
                    <div key={item.id}>
                      {i > 0 && " · "}
                      <strong>{item.quantity}x</strong> {item.product_name}
                      {item.item_type === "subscription" && (
                        <span
                          style={{
                            marginLeft: 6,
                            padding: "1px 6px",
                            borderRadius: 3,
                            fontSize: 10,
                            fontWeight: 600,
                            background: "#ede9fe",
                            color: "#6d28d9",
                          }}
                        >
                          🌸 Assinatura
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div
                style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
              >
                <button
                  type="button"
                  onClick={() => handlePrint(order.id)}
                  disabled={actionLoading === order.id}
                  style={btnSecondaryStyle}
                >
                  🖨️ Imprimir
                </button>

                 <button
                  type="button"
                  onClick={() => handleOrcamento(order)}
                  disabled={actionLoading === order.id}
                  style={btnWhatsAppStyle}
                  >
                  📄 Enviar orçamento
                 </button>


                <button
                  type="button"
                  onClick={() => cancelOrder(order.id)}
                  disabled={actionLoading === order.id}
                  style={btnDangerStyle}
                >
                  {actionLoading === order.id ? "..." : "❌ Cancelar"}
                </button>

                <button
                  type="button"
                  onClick={() => markAsDelivered(order.id)}
                  disabled={actionLoading === order.id}
                  style={btnSuccessStyle}
                >
                  {actionLoading === order.id ? "..." : "✅ Entregue"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ==========================================
// NOVO PEDIDO
// ==========================================

function NovoPedido({ onCreated }: { onCreated: () => void }) {
  // Produtos e assinaturas
  const [products, setProducts] = useState<Product[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [weeklyFlowers, setWeeklyFlowers] = useState<Flower[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Busca
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Carrinho
  const [cart, setCart] = useState<CartLine[]>([]);

  // Modal de customização (flores + cor)
  const [editingLine, setEditingLine] = useState<CartLine | null>(null);

  // Modal de assinatura
  const [pendingSubscription, setPendingSubscription] =
    useState<Subscription | null>(null);

  // Dados do cliente
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">(
    "pickup"
  );

  // Data + hora
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  // Endereço
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");

  // Pagamento
  const [paymentMethod, setPaymentMethod] = useState("dinheiro");

  // Observação
  const [observation, setObservation] = useState("");

  // Estado geral
  const [isSaving, setIsSaving] = useState(false);

  // ==========================================
  // CARREGA PRODUTOS + ASSINATURAS + FLORES
  // ==========================================

  useEffect(() => {
    async function loadData() {
      setIsLoadingProducts(true);

      const [productsRes, subscriptionsRes, flowersRes] = await Promise.all([
        supabase
          .from("products")
          .select("*")
          .eq("available", true)
          .order("name", { ascending: true }),
        supabase
          .from("subscriptions")
          .select("*")
          .eq("available", true)
          .order("display_order", { ascending: true }),
        supabase
          .from("weekly_flowers")
          .select("*")
          .eq("active", true)
          .order("position", { ascending: true }),
      ]);

      setProducts(productsRes.data ?? []);
      setSubscriptions(subscriptionsRes.data ?? []);

      if (flowersRes.data) {
        setWeeklyFlowers(
          flowersRes.data.map((f) => ({
            name: f.name,
            image: f.image || "",
          }))
        );
      }

      setIsLoadingProducts(false);
    }

    loadData();
  }, []);

  // ==========================================
  // FILTRO DE PRODUTOS E ASSINATURAS
  // ==========================================

  const filteredProducts = products.filter((p) => {
    if (categoryFilter !== "all" && String(p.category_id) !== categoryFilter) {
      return false;
    }
    if (searchTerm.trim()) {
      if (!p.name.toLowerCase().includes(searchTerm.toLowerCase().trim())) {
        return false;
      }
    }
    return true;
  });

  const filteredSubscriptions = subscriptions.filter((s) => {
    // Assinaturas só aparecem quando o filtro for "Todas"
    if (categoryFilter !== "all") return false;
    if (searchTerm.trim()) {
      if (!s.name.toLowerCase().includes(searchTerm.toLowerCase().trim())) {
        return false;
      }
    }
    return true;
  });

  // ==========================================
  // ADICIONA PRODUTO AO CARRINHO
  // ==========================================

  function addProductToCart(product: Product) {
    const id = `${product.id}-${Date.now()}`;

    const newLine: CartLine = {
      id,
      kind: "product",
      product,
      quantity: 1,
      selectedFlowers: [],
      selectedColor: null,
    };

    // Se o produto exige flores, abre o modal de customização
    if (product.requires_flower_selection) {
      setEditingLine(newLine);
      return;
    }

    setCart((current) => [...current, newLine]);
  }

  // ==========================================
  // ADICIONA ASSINATURA AO CARRINHO
  // ==========================================

  function addSubscriptionToCart(
    subscription: Subscription,
    deliveryDay: "saturday" | "sunday"
  ) {
    const id = `sub-${subscription.id}-${Date.now()}`;

    const newLine: CartLine = {
      id,
      kind: "subscription",
      product: subscription,
      quantity: 1,
      delivery_day: deliveryDay,
      selectedFlowers: [],
      selectedColor: null,
    };

    setCart((current) => [...current, newLine]);
    setPendingSubscription(null);
  }

  function saveEditedLine() {
    if (!editingLine) return;

    setCart((current) => [...current, editingLine]);
    setEditingLine(null);
  }

  function updateLineQuantity(lineId: string, quantity: number) {
    if (quantity <= 0) {
      setCart((current) => current.filter((l) => l.id !== lineId));
      return;
    }
    setCart((current) =>
      current.map((l) => (l.id === lineId ? { ...l, quantity } : l))
    );
  }

  function removeLine(lineId: string) {
    setCart((current) => current.filter((l) => l.id !== lineId));
  }

  // ==========================================
  // CÁLCULOS
  // ==========================================

  const subtotal = cart.reduce(
    (total, line) => total + line.product.price * line.quantity,
    0
  );

  const deliveryFee = deliveryMethod === "delivery" ? 15 : 0;

  const total = subtotal + deliveryFee;

  function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  // ==========================================
  // DIA DA SEMANA
  // ==========================================

  function getDayOfWeek(dateStr: string): string {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T12:00:00");
    const dayName = d.toLocaleDateString("pt-BR", { weekday: "long" });
    return dayName.charAt(0).toUpperCase() + dayName.slice(1);
  }

  // ==========================================
  // CÁLCULO DA PRÓXIMA RENOVAÇÃO
  // ==========================================

  function calculateNextRenewal(frequency: string): string {
    const d = new Date();
    if (frequency === "weekly") d.setDate(d.getDate() + 7);
    else if (frequency === "biweekly") d.setDate(d.getDate() + 15);
    else d.setMonth(d.getMonth() + 1); // monthly (default)
    return d.toISOString();
  }

  // ==========================================
  // SALVAR PEDIDO
  // ==========================================

  async function handleSave() {
    if (cart.length === 0) {
      alert("Adicione pelo menos 1 item.");
      return;
    }

    if (!customerName.trim()) {
      alert("Informe o nome do cliente.");
      return;
    }

    if (!customerPhone.trim()) {
      alert("Informe o telefone do cliente.");
      return;
    }

    // Valida dia da entrega pra todas as assinaturas
    const subsInCart = cart.filter((l) => l.kind === "subscription");
    for (const line of subsInCart) {
      if (!line.delivery_day) {
        alert("Escolha o dia da entrega de todas as assinaturas.");
        return;
      }
    }

    if (deliveryMethod === "delivery") {
      if (
        !street.trim() ||
        !number.trim() ||
        !neighborhood.trim() ||
        !city.trim()
      ) {
        alert("Preencha o endereço completo.");
        return;
      }
    }

    setIsSaving(true);

    try {
      // 1. Cria o pedido
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          customer_email: "",
          delivery_method: deliveryMethod,
          scheduled_date: scheduledDate || null,
          scheduled_time: scheduledTime || null,
          cep: deliveryMethod === "delivery" ? cep : null,
          street: deliveryMethod === "delivery" ? street : null,
          number: deliveryMethod === "delivery" ? number : null,
          complement: deliveryMethod === "delivery" ? complement : null,
          neighborhood: deliveryMethod === "delivery" ? neighborhood : null,
          city: deliveryMethod === "delivery" ? city : null,
          observation: observation.trim() || null,
          subtotal,
          delivery_fee: deliveryFee,
          total,
          payment_method: paymentMethod,
          payment_status: "paid",
          order_status: "confirmed",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Cria os itens do pedido
      const orderItems = cart.map((line) => ({
        order_id: order.id,
        product_id:
          line.kind === "product"
            ? (line.product as Product).id
            : null,
        product_name: line.product.name,
        product_price: line.product.price,
        quantity: line.quantity,
        subtotal: line.product.price * line.quantity,
        item_type: line.kind === "product" ? "product" : "subscription",
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 3. Cria os registros em subscription_orders (se houver assinaturas)
      const now = new Date().toISOString();

      const subscriptionOrders = subsInCart.map((line) => {
        const sub = line.product as Subscription;
        return {
          user_id: null,
          plan_name: sub.name,
          plan_frequency: sub.frequency,
          plan_price: sub.price,
          deliveries_per_month: sub.deliveries_per_month,
          delivery_day: line.delivery_day,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          customer_email: "",
          delivery_method: deliveryMethod,
          cep: deliveryMethod === "delivery" ? cep : null,
          street: deliveryMethod === "delivery" ? street : null,
          number: deliveryMethod === "delivery" ? number : null,
          complement: deliveryMethod === "delivery" ? complement : null,
          neighborhood: deliveryMethod === "delivery" ? neighborhood : null,
          city: deliveryMethod === "delivery" ? city : null,
          state: null,
          payment_method: paymentMethod,
          payment_status: "paid",
          last_payment_at: now,
          next_renewal_at: calculateNextRenewal(sub.frequency),
        };
      });

      if (subscriptionOrders.length > 0) {
        const { error: subsError } = await supabase
          .from("subscription_orders")
          .insert(subscriptionOrders);

        if (subsError) {
          console.error("Erro ao criar assinaturas:", subsError);
          alert(
            "Pedido criado, mas houve erro ao registrar as assinaturas: " +
              subsError.message
          );
        }
      }

      alert(`✅ Pedido #${order.id} criado com sucesso!`);
      onCreated();
    } catch (error: any) {
      console.error("Erro ao salvar pedido:", error);
      alert("Erro ao salvar: " + (error?.message || "desconhecido"));
    } finally {
      setIsSaving(false);
    }
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      {/* COLUNA ESQUERDA — BUSCA + PRODUTOS + ASSINATURAS */}
      <div>
        <h2
          style={{
            margin: "0 0 12px",
            fontSize: 15,
            fontWeight: 600,
            color: "#2f2a26",
          }}
        >
          Itens disponíveis
        </h2>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar produto ou assinatura..."
            style={{ ...inputStyle, flex: 1 }}
          />

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="all">Todas</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            maxHeight: 600,
            overflowY: "auto",
          }}
        >
          {isLoadingProducts ? (
            <div style={emptyStyle}>Carregando...</div>
          ) : (
            <>
              {/* ============ PRODUTOS ============ */}
              {filteredProducts.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#7a7a72",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 8,
                    }}
                  >
                    🌸 Produtos
                  </div>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {filteredProducts.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addProductToCart(p)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: 12,
                          background: "#fff",
                          border: "1px solid #e0e0dc",
                          borderRadius: 8,
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        {p.image && (
                          <img
                            src={p.image}
                            alt={p.name}
                            style={{
                              width: 48,
                              height: 48,
                              objectFit: "cover",
                              borderRadius: 6,
                            }}
                          />
                        )}

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#2f2a26",
                            }}
                          >
                            {p.name}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#166534",
                              fontWeight: 600,
                              marginTop: 2,
                            }}
                          >
                            {formatPrice(p.price)}
                          </div>
                        </div>

                        <span style={{ fontSize: 20, color: "#9ca3af" }}>
                          +
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ============ ASSINATURAS ============ */}
              {filteredSubscriptions.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#6d28d9",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 8,
                    }}
                  >
                    📅 Assinaturas
                  </div>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {filteredSubscriptions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setPendingSubscription(s)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: 12,
                          background: "#faf5ff",
                          border: "1px solid #e9d5ff",
                          borderRadius: 8,
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        {s.image && (
                          <img
                            src={s.image}
                            alt={s.name}
                            style={{
                              width: 48,
                              height: 48,
                              objectFit: "cover",
                              borderRadius: 6,
                            }}
                          />
                        )}

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#2f2a26",
                              }}
                            >
                              {s.name}
                            </span>
                            <span
                              style={{
                                padding: "1px 6px",
                                borderRadius: 3,
                                fontSize: 9,
                                fontWeight: 700,
                                background: "#ede9fe",
                                color: "#6d28d9",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                              }}
                            >
                              Assinatura
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#6d28d9",
                              fontWeight: 600,
                              marginTop: 2,
                            }}
                          >
                            {formatPrice(s.price)} /mês ·{" "}
                            {s.deliveries_per_month}{" "}
                            {s.deliveries_per_month === 1
                              ? "entrega"
                              : "entregas"}
                          </div>
                        </div>

                        <span style={{ fontSize: 20, color: "#a78bfa" }}>
                          +
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredProducts.length === 0 &&
                filteredSubscriptions.length === 0 && (
                  <div style={emptyStyle}>Nenhum item encontrado.</div>
                )}
            </>
          )}
        </div>
      </div>

      {/* COLUNA DIREITA — CARRINHO + DADOS */}
      <div>
        <h2
          style={{
            margin: "0 0 12px",
            fontSize: 15,
            fontWeight: 600,
            color: "#2f2a26",
          }}
        >
          Pedido
        </h2>

        {/* CARRINHO */}
        {cart.length === 0 ? (
          <div style={emptyStyle}>Carrinho vazio.</div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginBottom: 16,
            }}
          >
            {cart.map((line) => (
              <div
                key={line.id}
                style={{
                  padding: 12,
                  background: line.kind === "subscription" ? "#faf5ff" : "#fff",
                  border:
                    line.kind === "subscription"
                      ? "1px solid #e9d5ff"
                      : "1px solid #e0e0dc",
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#2f2a26",
                        }}
                      >
                        {line.product.name}
                      </span>
                      {line.kind === "subscription" && (
                        <span
                          style={{
                            padding: "1px 6px",
                            borderRadius: 3,
                            fontSize: 9,
                            fontWeight: 700,
                            background: "#ede9fe",
                            color: "#6d28d9",
                            textTransform: "uppercase",
                          }}
                        >
                          Assinatura
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color:
                          line.kind === "subscription"
                            ? "#6d28d9"
                            : "#166534",
                        fontWeight: 600,
                      }}
                    >
                      {formatPrice(line.product.price * line.quantity)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    style={{
                      background: "transparent",
                      border: 0,
                      color: "#991b1b",
                      fontSize: 18,
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                </div>

                {/* Flores escolhidas */}
                {line.selectedFlowers.length > 0 && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "#7a7a72",
                      marginBottom: 6,
                    }}
                  >
                    🌸 {line.selectedFlowers.map((f) => f.name).join(", ")}
                  </div>
                )}

                {/* Cor escolhida */}
                {line.selectedColor && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "#7a7a72",
                      marginBottom: 6,
                    }}
                  >
                    🎨 {line.selectedColor.name}
                  </div>
                )}

                {/* Dia da entrega (assinatura) */}
                {line.kind === "subscription" && line.delivery_day && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "#6d28d9",
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    📅{" "}
                    {line.delivery_day === "saturday" ? "Sábado" : "Domingo"}
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() =>
                      updateLineQuantity(line.id, line.quantity - 1)
                    }
                    style={qtyBtnStyle}
                  >
                    −
                  </button>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      minWidth: 24,
                      textAlign: "center",
                    }}
                  >
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateLineQuantity(line.id, line.quantity + 1)
                    }
                    style={qtyBtnStyle}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DADOS DO CLIENTE */}
        <div
          style={{
            padding: 16,
            background: "#fff",
            border: "1px solid #e0e0dc",
            borderRadius: 8,
            marginBottom: 16,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <h3 style={sectionTitleStyle}>Cliente</h3>

          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Nome completo"
            style={inputStyle}
          />
          <input
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="Telefone"
            style={inputStyle}
          />
        </div>

        {/* ENTREGA */}
        <div
          style={{
            padding: 16,
            background: "#fff",
            border: "1px solid #e0e0dc",
            borderRadius: 8,
            marginBottom: 16,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <h3 style={sectionTitleStyle}>Entrega</h3>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => setDeliveryMethod("pickup")}
              style={{
                flex: 1,
                padding: 10,
                background: deliveryMethod === "pickup" ? "#2f2a26" : "#fff",
                color: deliveryMethod === "pickup" ? "#fff" : "#2f2a26",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              🏪 Retirada
            </button>
            <button
              type="button"
              onClick={() => setDeliveryMethod("delivery")}
              style={{
                flex: 1,
                padding: 10,
                background: deliveryMethod === "delivery" ? "#2f2a26" : "#fff",
                color: deliveryMethod === "delivery" ? "#fff" : "#2f2a26",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              🚚 Entrega
            </button>
          </div>

          {deliveryMethod === "delivery" && (
            <>
              <input
                type="text"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                placeholder="CEP"
                style={inputStyle}
              />
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Rua"
                style={inputStyle}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="Número"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <input
                  type="text"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  placeholder="Complemento"
                  style={{ ...inputStyle, flex: 2 }}
                />
              </div>
              <input
                type="text"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Bairro"
                style={inputStyle}
              />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Cidade"
                style={inputStyle}
              />
            </>
          )}

          {/* Data + Hora */}
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 2 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  color: "#7a7a72",
                  marginBottom: 4,
                }}
              >
                Data da entrega
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                style={{ ...inputStyle, width: "100%" }}
              />
              {scheduledDate && (
                <div
                  style={{
                    fontSize: 11,
                    color: "#166534",
                    fontWeight: 600,
                    marginTop: 4,
                  }}
                >
                  📅 {getDayOfWeek(scheduledDate)}
                </div>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  color: "#7a7a72",
                  marginBottom: 4,
                }}
              >
                Horário
              </label>
              <select
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                style={{ ...selectStyle, width: "100%" }}
              >
                <option value="">—</option>
                {HOURS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* PAGAMENTO */}
        <div
          style={{
            padding: 16,
            background: "#fff",
            border: "1px solid #e0e0dc",
            borderRadius: 8,
            marginBottom: 16,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <h3 style={sectionTitleStyle}>Pagamento</h3>

          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            style={selectStyle}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            placeholder="Observações (opcional)"
            style={inputStyle}
          />
        </div>

        {/* TOTAIS */}
        <div
          style={{
            padding: 16,
            background: "#f9f9f7",
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <span>Subtotal</span>
            <strong>{formatPrice(subtotal)}</strong>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <span>{deliveryMethod === "delivery" ? "Entrega" : "Retirada"}</span>
            <strong>
              {deliveryFee === 0 ? "Grátis" : formatPrice(deliveryFee)}
            </strong>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              paddingTop: 8,
              borderTop: "1px solid #d1d5db",
              fontSize: 15,
            }}
          >
            <strong>Total</strong>
            <strong style={{ color: "#166534" }}>{formatPrice(total)}</strong>
          </div>
        </div>

        {/* BOTÃO SALVAR */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || cart.length === 0}
          style={{
            width: "100%",
            padding: "14px 20px",
            background:
              isSaving || cart.length === 0 ? "#a3a3a3" : "#166534",
            color: "#fff",
            border: 0,
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            cursor:
              isSaving || cart.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          {isSaving ? "Salvando..." : "✅ Salvar Pedido"}
        </button>
      </div>

      {/* MODAL DE CUSTOMIZAÇÃO (flores + cor) */}
      {editingLine && (
        <CustomizeModal
          line={editingLine}
          weeklyFlowers={weeklyFlowers}
          onChange={setEditingLine}
          onSave={saveEditedLine}
          onCancel={() => setEditingLine(null)}
        />
      )}

      {/* MODAL DE ASSINATURA (dia da entrega) */}
      {pendingSubscription && (
        <SubscriptionModal
          subscription={pendingSubscription}
          onConfirm={addSubscriptionToCart}
          onCancel={() => setPendingSubscription(null)}
        />
      )}
    </div>
  );
}

// ==========================================
// MODAL DE ASSINATURA
// ==========================================

function SubscriptionModal({
  subscription,
  onConfirm,
  onCancel,
}: {
  subscription: Subscription;
  onConfirm: (sub: Subscription, day: "saturday" | "sunday") => void;
  onCancel: () => void;
}) {
  const [day, setDay] = useState<"saturday" | "sunday" | null>(null);

  function handleConfirm() {
    if (!day) {
      alert("Escolha o dia da entrega.");
      return;
    }
    onConfirm(subscription, day);
  }

  function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  return (
    <>
      <div
        onClick={onCancel}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 40,
        }}
      />

      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(480px, 90%)",
          maxHeight: "85vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: 12,
          zIndex: 50,
          padding: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            🌸 {subscription.name}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: "transparent",
              border: 0,
              fontSize: 24,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        {subscription.image && (
          <img
            src={subscription.image}
            alt={subscription.name}
            style={{
              width: "100%",
              maxHeight: 180,
              objectFit: "cover",
              borderRadius: 8,
              marginBottom: 16,
            }}
          />
        )}

        <div
          style={{
            padding: 16,
            background: "#faf5ff",
            borderRadius: 8,
            marginBottom: 20,
            border: "1px solid #e9d5ff",
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#6d28d9",
            }}
          >
            {formatPrice(subscription.price)}
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "#7a7a72",
                marginLeft: 6,
              }}
            >
              /mês
            </span>
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#7a7a72",
              marginTop: 4,
            }}
          >
            {subscription.deliveries_per_month}{" "}
            {subscription.deliveries_per_month === 1
              ? "entrega por mês"
              : "entregas por mês"}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#2f2a26",
              marginBottom: 10,
            }}
          >
            Escolha o dia da entrega:
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => setDay("saturday")}
              style={{
                flex: 1,
                padding: 14,
                background: day === "saturday" ? "#6d28d9" : "#fff",
                color: day === "saturday" ? "#fff" : "#2f2a26",
                border:
                  day === "saturday"
                    ? "2px solid #6d28d9"
                    : "1px solid #d1d5db",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Sábado
            </button>
            <button
              type="button"
              onClick={() => setDay("sunday")}
              style={{
                flex: 1,
                padding: 14,
                background: day === "sunday" ? "#6d28d9" : "#fff",
                color: day === "sunday" ? "#fff" : "#2f2a26",
                border:
                  day === "sunday"
                    ? "2px solid #6d28d9"
                    : "1px solid #d1d5db",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Domingo
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={!day}
          style={{
            width: "100%",
            padding: 14,
            background: day ? "#6d28d9" : "#a3a3a3",
            color: "#fff",
            border: 0,
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 700,
            cursor: day ? "pointer" : "not-allowed",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Adicionar ao pedido
        </button>
      </div>
    </>
  );
}

// ==========================================
// MODAL DE CUSTOMIZAÇÃO (flores + cor)
// ==========================================

function CustomizeModal({
  line,
  weeklyFlowers,
  onChange,
  onSave,
  onCancel,
}: {
  line: CartLine;
  weeklyFlowers: Flower[];
  onChange: (line: CartLine) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const max = (line.product as Product).max_flowers;

  function toggleFlower(flower: Flower) {
    const exists = line.selectedFlowers.find((f) => f.name === flower.name);

    if (exists) {
      onChange({
        ...line,
        selectedFlowers: line.selectedFlowers.filter(
          (f) => f.name !== flower.name
        ),
      });
      return;
    }

    if (max && line.selectedFlowers.length >= max) {
      alert(`Máximo de ${max} flores.`);
      return;
    }

    onChange({
      ...line,
      selectedFlowers: [...line.selectedFlowers, flower],
    });
  }

  return (
    <>
      <div
        onClick={onCancel}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 40,
        }}
      />

      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(700px, 90%)",
          maxHeight: "85vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: 12,
          zIndex: 50,
          padding: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            {line.product.name}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: "transparent",
              border: 0,
              fontSize: 24,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        {weeklyFlowers.length === 0 ? (
          <div style={emptyStyle}>Nenhuma flor disponível.</div>
        ) : (
          <>
            <div
              style={{
                fontSize: 12,
                color: "#7a7a72",
                marginBottom: 12,
              }}
            >
              Escolha as flores
              {max ? ` (máximo ${max})` : ""}:
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                gap: 8,
                marginBottom: 20,
              }}
            >
              {weeklyFlowers.map((flower) => {
                const selected = line.selectedFlowers.some(
                  (f) => f.name === flower.name
                );

                return (
                  <button
                    key={flower.name}
                    type="button"
                    onClick={() => toggleFlower(flower)}
                    style={{
                      padding: 10,
                      background: selected ? "#f0fdf4" : "#fff",
                      border: selected
                        ? "2px solid #166534"
                        : "1px solid #e0e0dc",
                      borderRadius: 8,
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        overflow: "hidden",
                        background: "#f2ece6",
                      }}
                    >
                      {flower.image && (
                        <img
                          src={flower.image}
                          alt={flower.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      )}
                    </div>
                    <span style={{ fontSize: 11, textAlign: "center" }}>
                      {flower.name}
                    </span>
                    {selected && (
                      <span style={{ fontSize: 11, color: "#166534" }}>✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        <button
          type="button"
          onClick={onSave}
          style={{
            width: "100%",
            padding: 14,
            background: "#166534",
            color: "#fff",
            border: 0,
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Adicionar ao pedido
        </button>
      </div>
    </>
  );
}

// ==========================================
// ESTILOS
// ==========================================
// ==========================================
// HTML DO ORÇAMENTO (mesmo layout do impresso)
// ==========================================

function buildOrcamentoHTML(order: Order): string {
  const formatPrice = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const formatDate = (v: string) =>
    new Date(v).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatScheduled = (
    dateStr: string | null,
    timeStr: string | null
  ) => {
    if (!dateStr && !timeStr) return null;
    const parts: string[] = [];
    if (dateStr) {
      const d = new Date(dateStr + "T12:00:00");
      const dayName = d
        .toLocaleDateString("pt-BR", { weekday: "long" })
        .replace(/^\w/, (c) => c.toUpperCase());
      parts.push(dayName);
      parts.push(
        d.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        })
      );
    }
    if (timeStr) parts.push(`às ${timeStr}`);
    return parts.join(" ");
  };

  const itensHTML = (order.order_items || [])
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: center; font-weight: 600;">
          ${item.quantity}x
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #eee;">
          ${item.product_name}
          ${
            item.item_type === "subscription"
              ? '<span style="margin-left: 8px; padding: 2px 6px; background: #ede9fe; color: #6d28d9; border-radius: 3px; font-size: 10px; font-weight: 700; text-transform: uppercase;">Assinatura</span>'
              : ""
          }
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: right;">
          ${formatPrice(item.product_price)}
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">
          ${formatPrice(item.subtotal)}
        </td>
      </tr>
    `
    )
    .join("");

  const enderecoHTML =
    order.delivery_method === "delivery"
      ? `
        <div style="margin-top: 8px; font-size: 13px; line-height: 1.6; color: #555;">
          ${order.street || ""}, ${order.number || ""}${
          order.complement ? ` — ${order.complement}` : ""
        }<br/>
          ${order.neighborhood || ""} — ${order.city || ""}<br/>
          CEP: ${order.cep || ""}
        </div>
      `
      : `<div style="margin-top: 8px; font-size: 13px; color: #555;">🏪 Retirada no ateliê</div>`;

  const scheduledStr = formatScheduled(
    order.scheduled_date,
    order.scheduled_time
  );

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #2f2a26;">
      <!-- HEADER -->
      <div style="text-align: center; border-bottom: 2px solid #2f2a26; padding-bottom: 20px; margin-bottom: 24px;">
        <div style="font-size: 28px; font-weight: 700; letter-spacing: 0.05em; color: #2f2a26;">FLOWER</div>
        <div style="font-size: 11px; letter-spacing: 0.2em; color: #7a7a72; margin-top: 4px;">BUQUÊS & ACESSÓRIOS</div>
        <div style="font-size: 14px; color: #7a7a72; margin-top: 16px;">ORÇAMENTO</div>
      </div>

      <!-- INFO DO PEDIDO -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 24px; font-size: 13px;">
        <div>
          <div style="font-size: 11px; font-weight: 700; color: #7a7a72; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Pedido</div>
          <div style="font-size: 18px; font-weight: 700;">#${order.id}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 11px; font-weight: 700; color: #7a7a72; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Data</div>
          <div>${formatDate(order.created_at)}</div>
        </div>
      </div>

      <!-- CLIENTE -->
      <div style="margin-bottom: 24px; padding: 16px; background: #f9f9f7; border-radius: 8px;">
        <div style="font-size: 11px; font-weight: 700; color: #7a7a72; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Cliente</div>
        <div style="font-size: 15px; font-weight: 600;">${order.customer_name}</div>
        <div style="font-size: 13px; color: #7a7a72; margin-top: 2px;">${order.customer_phone}</div>
      </div>

      <!-- ITENS -->
      <div style="margin-bottom: 24px;">
        <div style="font-size: 11px; font-weight: 700; color: #7a7a72; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Itens do pedido</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: #f9f9f7;">
              <th style="padding: 10px 8px; text-align: center; font-size: 11px; font-weight: 700; color: #7a7a72; text-transform: uppercase; letter-spacing: 0.05em; width: 60px;">Qtd</th>
              <th style="padding: 10px 8px; text-align: left; font-size: 11px; font-weight: 700; color: #7a7a72; text-transform: uppercase; letter-spacing: 0.05em;">Produto</th>
              <th style="padding: 10px 8px; text-align: right; font-size: 11px; font-weight: 700; color: #7a7a72; text-transform: uppercase; letter-spacing: 0.05em; width: 100px;">Preço</th>
              <th style="padding: 10px 8px; text-align: right; font-size: 11px; font-weight: 700; color: #7a7a72; text-transform: uppercase; letter-spacing: 0.05em; width: 100px;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itensHTML}
          </tbody>
        </table>
      </div>

      <!-- TOTAIS -->
      <div style="margin-left: auto; width: 320px; padding: 16px; background: #f9f9f7; border-radius: 8px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
          <span>Subtotal</span>
          <strong>${formatPrice(order.subtotal)}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 10px;">
          <span>${order.delivery_method === "delivery" ? "Entrega" : "Retirada"}</span>
          <strong>${order.delivery_fee > 0 ? formatPrice(order.delivery_fee) : "Grátis"}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 1px solid #d1d5db; font-size: 16px;">
          <strong>Total</strong>
          <strong style="color: #166534;">${formatPrice(order.total)}</strong>
        </div>
      </div>

      <!-- ENTREGA -->
      <div style="margin-bottom: 24px;">
        <div style="font-size: 11px; font-weight: 700; color: #7a7a72; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
          ${order.delivery_method === "delivery" ? "Entrega" : "Retirada"}
        </div>
        ${enderecoHTML}
        ${
          scheduledStr
            ? `<div style="margin-top: 8px; font-size: 13px; color: #166534; font-weight: 600;">📅 ${scheduledStr}</div>`
            : ""
        }
      </div>

      ${
        order.observation
          ? `
        <div style="margin-bottom: 24px; padding: 12px; background: #fef3c7; border-radius: 8px; font-size: 13px;">
          <div style="font-size: 11px; font-weight: 700; color: #854d0e; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Observação</div>
          ${order.observation}
        </div>
      `
          : ""
      }

      <!-- FOOTER -->
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0dc; text-align: center; font-size: 11px; color: #7a7a72;">
        Orçamento gerado em ${new Date().toLocaleDateString("pt-BR")} — FLOWER
      </div>
    </div>
  `;
} 

const inputStyle: React.CSSProperties = {
  height: 38,
  padding: "0 12px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 13,
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  height: 38,
  padding: "0 12px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 13,
  outline: "none",
  background: "#fff",
  cursor: "pointer",
  boxSizing: "border-box",
};

const refreshBtnStyle: React.CSSProperties = {
  height: 38,
  padding: "0 14px",
  background: "#fff",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 13,
  cursor: "pointer",
};

const emptyStyle: React.CSSProperties = {
  padding: 24,
  textAlign: "center",
  color: "#7a7a72",
  fontSize: 13,
  background: "#fff",
  border: "1px solid #e0e0dc",
  borderRadius: 8,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 4px",
  fontSize: 11,
  fontWeight: 700,
  color: "#7a7a72",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const btnSecondaryStyle: React.CSSProperties = {
  padding: "8px 16px",
  background: "#fff",
  color: "#2f2a26",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

const btnDangerStyle: React.CSSProperties = {
  padding: "8px 16px",
  background: "#fff",
  color: "#991b1b",
  border: "1px solid #fecaca",
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

const btnSuccessStyle: React.CSSProperties = {
  padding: "8px 16px",
  background: "#166534",
  color: "#fff",
  border: 0,
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

const btnWhatsAppStyle: React.CSSProperties = {
  padding: "8px 16px",
  background: "#25D366",
  color: "#fff",
  border: 0,
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

const qtyBtnStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  background: "#fff",
  border: "1px solid #d1d5db",
  borderRadius: 4,
  fontSize: 14,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};