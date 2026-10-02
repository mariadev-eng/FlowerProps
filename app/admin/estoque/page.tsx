"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

// ==========================================
// TIPOS
// ==========================================

type StockItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  min_quantity: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type PackagingOption = {
  id: string;
  type: "paper" | "ribbon";
  name: string;
  model: string | null;
  packaging_unit: "folha" | "pacote" | "rolo" | null;
  quantity: number;
  min_quantity: number;
  description: string | null;
  image: string | null;
  active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

type TabType = "geral" | "papelaria" | "fitas";

const STOCK_CATEGORIES = [
  { value: "Embalagens", label: "🎁 Embalagens" },
  { value: "Ursos", label: "🧸 Ursos" },
  { value: "Complementos", label: "🍫 Complementos" },
  { value: "Papelaria", label: "🎨 Papelaria (extra)" },
  { value: "Outros", label: "📎 Outros" },
];

const PACKAGING_UNITS = [
  { value: "folha", label: "Folha" },
  { value: "pacote", label: "Pacote" },
  { value: "rolo", label: "Rolo" },
];

// ==========================================
// PÁGINA
// ==========================================

export default function EstoquePage() {
  const [activeTab, setActiveTab] = useState<TabType>("geral");

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
          Estoque
        </h1>

        <div
          style={{
            display: "flex",
            gap: 4,
            borderBottom: "1px solid #e0e0dc",
            overflowX: "auto",
          }}
        >
          <SubTab
            active={activeTab === "geral"}
            onClick={() => setActiveTab("geral")}
          >
            📦 Geral
          </SubTab>
          <SubTab
            active={activeTab === "papelaria"}
            onClick={() => setActiveTab("papelaria")}
          >
            📄 Papelaria
          </SubTab>
          <SubTab
            active={activeTab === "fitas"}
            onClick={() => setActiveTab("fitas")}
          >
            🎀 Fitas
          </SubTab>
        </div>
      </div>

      {activeTab === "geral" && <GeralTab />}
      {activeTab === "papelaria" && <PapelariaTab />}
      {activeTab === "fitas" && <FitasTab />}
    </div>
  );
}

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
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

// ==========================================
// SUB-ABA: GERAL
// ==========================================

function GeralTab() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function loadItems() {
    setIsLoading(true);

    const { data, error } = await supabase
      .from("stock_items")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Erro ao carregar estoque:", error);
      setItems([]);
    } else {
      setItems(data ?? []);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadItems();
  }, []);

  const filtered = items.filter((item) => {
    if (categoryFilter !== "all" && item.category !== categoryFilter) {
      return false;
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      if (!item.name.toLowerCase().includes(search)) return false;
    }

    return true;
  });

  const grouped = filtered.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, StockItem[]>);

  async function updateQuantity(id: string, delta: number) {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const newQty = Math.max(0, item.quantity + delta);

    setItems((current) =>
      current.map((i) => (i.id === id ? { ...i, quantity: newQty } : i))
    );

    setSavingId(id);

    const { error } = await supabase
      .from("stock_items")
      .update({
        quantity: newQty,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    setSavingId(null);

    if (error) {
      console.error("Erro ao atualizar:", error);
      setItems((current) =>
        current.map((i) =>
          i.id === id ? { ...i, quantity: item.quantity } : i
        )
      );
      alert("Erro ao atualizar estoque.");
    }
  }

  async function setQuantityDirect(id: string, value: number) {
    const newQty = Math.max(0, value);

    setItems((current) =>
      current.map((i) => (i.id === id ? { ...i, quantity: newQty } : i))
    );

    setSavingId(id);

    const { error } = await supabase
      .from("stock_items")
      .update({
        quantity: newQty,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    setSavingId(null);

    if (error) {
      console.error("Erro:", error);
      alert("Erro ao atualizar.");
    }
  }

  async function removeItem(id: string) {
    if (!confirm("Remover esse item do estoque?")) return;

    const { error } = await supabase.from("stock_items").delete().eq("id", id);

    if (error) {
      alert("Erro ao remover.");
      return;
    }

    setItems((current) => current.filter((i) => i.id !== id));
  }

  const totalItems = items.length;
  const itemsBelowMin = items.filter(
    (i) => i.quantity <= i.min_quantity
  ).length;

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
          {totalItems} {totalItems === 1 ? "item" : "itens"}
          {itemsBelowMin > 0 && (
            <span style={{ color: "#dc2626", marginLeft: 8 }}>
              · {itemsBelowMin} abaixo do mínimo
            </span>
          )}
        </p>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
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
          ➕ Adicionar item
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar item..."
          style={inputStyle}
        />

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={selectStyle}
        >
          <option value="all">Todas as categorias</option>
          {STOCK_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        <button type="button" onClick={loadItems} style={refreshBtnStyle}>
          ↻
        </button>
      </div>

      {isLoading ? (
        <div style={emptyStyle}>Carregando estoque...</div>
      ) : filtered.length === 0 ? (
        <div style={emptyStyle}>Nenhum item encontrado.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {Object.entries(grouped).map(([category, categoryItems]) => (
            <div key={category}>
              <h2
                style={{
                  margin: "0 0 12px",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#2f2a26",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {STOCK_CATEGORIES.find((c) => c.value === category)?.label ||
                  category}{" "}
                <span style={{ color: "#9ca3af", fontWeight: 500 }}>
                  ({categoryItems.length})
                </span>
              </h2>

              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e0e0dc",
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                {categoryItems.map((item, i) => {
                  const isLow = item.quantity <= item.min_quantity;

                  return (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        padding: "12px 16px",
                        borderTop: i > 0 ? "1px solid #f0f0ec" : "none",
                        background: isLow ? "#fef2f2" : "transparent",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#2f2a26",
                          }}
                        >
                          {item.name}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#7a7a72",
                            marginTop: 2,
                          }}
                        >
                          Mínimo: {item.min_quantity}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          disabled={savingId === item.id || item.quantity === 0}
                          style={qtyBtnStyle}
                        >
                          −
                        </button>

                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            setQuantityDirect(
                              item.id,
                              Number(e.target.value) || 0
                            )
                          }
                          style={{
                            width: 64,
                            height: 36,
                            textAlign: "center",
                            border: isLow
                              ? "1px solid #fecaca"
                              : "1px solid #d1d5db",
                            borderRadius: 6,
                            fontSize: 14,
                            fontWeight: 700,
                            color: isLow ? "#dc2626" : "#166534",
                            outline: "none",
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          disabled={savingId === item.id}
                          style={qtyBtnStyle}
                        >
                          +
                        </button>
                      </div>

                      {isLow && (
                        <span
                          style={{
                            padding: "4px 10px",
                            background: "#fee2e2",
                            color: "#991b1b",
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          Baixo
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        style={{
                          background: "transparent",
                          border: 0,
                          color: "#991b1b",
                          fontSize: 18,
                          cursor: "pointer",
                          padding: 8,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddStockItemModal
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            setShowAddModal(false);
            loadItems();
          }}
        />
      )}
    </>
  );
}

// ==========================================
// SUB-ABA: PAPELARIA
// ==========================================

function PapelariaTab() {
  const [items, setItems] = useState<PackagingOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  async function loadItems() {
    setIsLoading(true);

    const { data, error } = await supabase
      .from("packaging_options")
      .select("*")
      .eq("type", "paper")
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Erro:", error);
      setItems([]);
    } else {
      setItems(data ?? []);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadItems();
  }, []);

  const filtered = items.filter((item) => {
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      return item.name.toLowerCase().includes(search);
    }
    return true;
  });

  async function updateQuantity(id: string, delta: number) {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const newQty = Math.max(0, item.quantity + delta);

    setItems((current) =>
      current.map((i) => (i.id === id ? { ...i, quantity: newQty } : i))
    );

    setSavingId(id);

    const { error } = await supabase
      .from("packaging_options")
      .update({
        quantity: newQty,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    setSavingId(null);

    if (error) {
      console.error("Erro:", error);
      alert("Erro ao atualizar.");
    }
  }

  async function setQuantityDirect(id: string, value: number) {
    const newQty = Math.max(0, value);

    setItems((current) =>
      current.map((i) => (i.id === id ? { ...i, quantity: newQty } : i))
    );

    setSavingId(id);

    const { error } = await supabase
      .from("packaging_options")
      .update({
        quantity: newQty,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    setSavingId(null);

    if (error) {
      console.error("Erro:", error);
    }
  }

  async function toggleActive(id: string, active: boolean) {
    setItems((current) =>
      current.map((i) => (i.id === id ? { ...i, active } : i))
    );

    await supabase
      .from("packaging_options")
      .update({ active, updated_at: new Date().toISOString() })
      .eq("id", id);
  }

  async function removeItem(id: string) {
    if (!confirm("Remover esse papel?")) return;

    const { error } = await supabase
      .from("packaging_options")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Erro ao remover.");
      return;
    }

    setItems((current) => current.filter((i) => i.id !== id));
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
          {items.length} {items.length === 1 ? "papel" : "papéis"} cadastrados
        </p>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          style={primaryBtnStyle}
        >
          ➕ Adicionar papel
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar papel..."
          style={inputStyle}
        />
      </div>

      {isLoading ? (
        <div style={emptyStyle}>Carregando...</div>
      ) : filtered.length === 0 ? (
        <div style={emptyStyle}>Nenhum papel cadastrado.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: 16,
                background: "#fff",
                border: "1px solid #e0e0dc",
                borderRadius: 8,
                flexWrap: "wrap",
              }}
            >
              <ImageUpload
                image={item.image}
                onUpload={async (file) => {
                  const formData = new FormData();
                  formData.append("file", file);

                  setSavingId(item.id);

                  const res = await fetch("/api/admin/upload", {
                    method: "POST",
                    body: formData,
                  });

                  const result = await res.json();

                  if (res.ok && result.url) {
                    setItems((current) =>
                      current.map((i) =>
                        i.id === item.id ? { ...i, image: result.url } : i
                      )
                    );

                    await supabase
                      .from("packaging_options")
                      .update({ image: result.url })
                      .eq("id", item.id);
                  } else {
                    alert("Erro no upload.");
                  }

                  setSavingId(null);
                }}
                isLoading={savingId === item.id}
              />

              <div style={{ flex: 1, minWidth: 200 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#2f2a26",
                  }}
                >
                  {item.name}
                </div>
                {item.model && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "#7a7a72",
                      marginTop: 2,
                    }}
                  >
                    Modelo: {item.model}
                  </div>
                )}
                {item.packaging_unit && (
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                    Unidade: {item.packaging_unit}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, -1)}
                  disabled={savingId === item.id || item.quantity === 0}
                  style={qtyBtnStyle}
                >
                  −
                </button>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    setQuantityDirect(item.id, Number(e.target.value) || 0)
                  }
                  style={qtyInputStyle}
                />
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, 1)}
                  disabled={savingId === item.id}
                  style={qtyBtnStyle}
                >
                  +
                </button>
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <input
                  type="checkbox"
                  checked={item.active}
                  onChange={(e) => toggleActive(item.id, e.target.checked)}
                />
                Ativo
              </label>

              <button
                type="button"
                onClick={() => removeItem(item.id)}
                style={removeBtnStyle}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddPackagingModal
          type="paper"
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            setShowAddModal(false);
            loadItems();
          }}
        />
      )}
    </>
  );
}

// ==========================================
// SUB-ABA: FITAS
// ==========================================

function FitasTab() {
  const [items, setItems] = useState<PackagingOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  async function loadItems() {
    setIsLoading(true);

    const { data, error } = await supabase
      .from("packaging_options")
      .select("*")
      .eq("type", "ribbon")
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Erro:", error);
      setItems([]);
    } else {
      setItems(data ?? []);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadItems();
  }, []);

  const filtered = items.filter((item) => {
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      return item.name.toLowerCase().includes(search);
    }
    return true;
  });

  async function updateQuantity(id: string, delta: number) {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const newQty = Math.max(0, item.quantity + delta);

    setItems((current) =>
      current.map((i) => (i.id === id ? { ...i, quantity: newQty } : i))
    );

    setSavingId(id);

    const { error } = await supabase
      .from("packaging_options")
      .update({
        quantity: newQty,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    setSavingId(null);

    if (error) {
      console.error("Erro:", error);
      alert("Erro ao atualizar.");
    }
  }

  async function setQuantityDirect(id: string, value: number) {
    const newQty = Math.max(0, value);

    setItems((current) =>
      current.map((i) => (i.id === id ? { ...i, quantity: newQty } : i))
    );

    setSavingId(id);

    const { error } = await supabase
      .from("packaging_options")
      .update({
        quantity: newQty,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    setSavingId(null);

    if (error) {
      console.error("Erro:", error);
    }
  }

  async function toggleActive(id: string, active: boolean) {
    setItems((current) =>
      current.map((i) => (i.id === id ? { ...i, active } : i))
    );

    await supabase
      .from("packaging_options")
      .update({ active, updated_at: new Date().toISOString() })
      .eq("id", id);
  }

  async function removeItem(id: string) {
    if (!confirm("Remover essa fita?")) return;

    const { error } = await supabase
      .from("packaging_options")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Erro ao remover.");
      return;
    }

    setItems((current) => current.filter((i) => i.id !== id));
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
          {items.length} {items.length === 1 ? "fita" : "fitas"} cadastradas
        </p>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          style={primaryBtnStyle}
        >
          ➕ Adicionar fita
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar fita..."
          style={inputStyle}
        />
      </div>

      {isLoading ? (
        <div style={emptyStyle}>Carregando...</div>
      ) : filtered.length === 0 ? (
        <div style={emptyStyle}>Nenhuma fita cadastrada.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: 16,
                background: "#fff",
                border: "1px solid #e0e0dc",
                borderRadius: 8,
                flexWrap: "wrap",
              }}
            >
              <ImageUpload
                image={item.image}
                onUpload={async (file) => {
                  const formData = new FormData();
                  formData.append("file", file);

                  setSavingId(item.id);

                  const res = await fetch("/api/admin/upload", {
                    method: "POST",
                    body: formData,
                  });

                  const result = await res.json();

                  if (res.ok && result.url) {
                    setItems((current) =>
                      current.map((i) =>
                        i.id === item.id ? { ...i, image: result.url } : i
                      )
                    );

                    await supabase
                      .from("packaging_options")
                      .update({ image: result.url })
                      .eq("id", item.id);
                  } else {
                    alert("Erro no upload.");
                  }

                  setSavingId(null);
                }}
                isLoading={savingId === item.id}
              />

              <div style={{ flex: 1, minWidth: 200 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#2f2a26",
                  }}
                >
                  {item.name}
                </div>
                {item.description && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "#7a7a72",
                      marginTop: 2,
                    }}
                  >
                    {item.description}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, -1)}
                  disabled={savingId === item.id || item.quantity === 0}
                  style={qtyBtnStyle}
                >
                  −
                </button>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    setQuantityDirect(item.id, Number(e.target.value) || 0)
                  }
                  style={qtyInputStyle}
                />
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, 1)}
                  disabled={savingId === item.id}
                  style={qtyBtnStyle}
                >
                  +
                </button>
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <input
                  type="checkbox"
                  checked={item.active}
                  onChange={(e) => toggleActive(item.id, e.target.checked)}
                />
                Ativa
              </label>

              <button
                type="button"
                onClick={() => removeItem(item.id)}
                style={removeBtnStyle}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddPackagingModal
          type="ribbon"
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            setShowAddModal(false);
            loadItems();
          }}
        />
      )}
    </>
  );
}

// ==========================================
// COMPONENTES AUXILIARES
// ==========================================

function ImageUpload({
  image,
  onUpload,
  isLoading,
}: {
  image: string | null;
  onUpload: (file: File) => void;
  isLoading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onClick={() => !isLoading && inputRef.current?.click()}
      style={{
        width: 64,
        height: 64,
        borderRadius: 8,
        overflow: "hidden",
        background: "#f2ece6",
        border: "1px solid #e0e0dc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: isLoading ? "wait" : "pointer",
        flexShrink: 0,
      }}
    >
      {isLoading ? (
        <span style={{ fontSize: 11, color: "#7a7a72" }}>...</span>
      ) : image ? (
        <img
          src={image}
          alt="Item"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <span style={{ fontSize: 20, color: "#9ca3af" }}>+</span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = "";
        }}
        style={{ display: "none" }}
      />
    </div>
  );
}

// ==========================================
// MODAIS DE CADASTRO
// ==========================================

function AddStockItemModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Embalagens");
  const [quantity, setQuantity] = useState("0");
  const [minQuantity, setMinQuantity] = useState("0");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      alert("Informe o nome.");
      return;
    }

    setIsSaving(true);

    const { error } = await supabase.from("stock_items").insert({
      name: name.trim(),
      category,
      quantity: Number(quantity) || 0,
      min_quantity: Number(minQuantity) || 0,
      notes: notes.trim() || null,
    });

    setIsSaving(false);

    if (error) {
      alert("Erro: " + error.message);
      return;
    }

    onSaved();
  }

  return (
    <ModalShell title="Adicionar item ao estoque" onClose={onClose}>
      <Field label="Nome *">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Caixa redonda"
          style={formInputStyle}
          autoFocus
        />
      </Field>

      <Field label="Categoria *">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={formInputStyle}
        >
          {STOCK_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>

      <div style={{ display: "flex", gap: 10 }}>
        <Field label="Qtd. atual" style={{ flex: 1 }}>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            style={formInputStyle}
          />
        </Field>
        <Field label="Qtd. mínima" style={{ flex: 1 }}>
          <input
            type="number"
            value={minQuantity}
            onChange={(e) => setMinQuantity(e.target.value)}
            style={formInputStyle}
          />
        </Field>
      </div>

      <Field label="Observações (opcional)">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          style={{ ...formInputStyle, resize: "vertical" }}
        />
      </Field>

      <SaveButton
        onClick={handleSave}
        isSaving={isSaving}
        disabled={!name.trim()}
      />
    </ModalShell>
  );
}

function AddPackagingModal({
  type,
  onClose,
  onSaved,
}: {
  type: "paper" | "ribbon";
  onClose: () => void;
  onSaved: () => void;
}) {
  const isPaper = type === "paper";

  const [name, setName] = useState("");
  const [model, setModel] = useState("");
  const [unit, setUnit] = useState<"folha" | "pacote" | "rolo">("folha");
  const [quantity, setQuantity] = useState("0");
  const [minQuantity, setMinQuantity] = useState("0");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      alert("Informe o nome.");
      return;
    }

    setIsSaving(true);

    const { error } = await supabase.from("packaging_options").insert({
      type,
      name: name.trim(),
      model: model.trim() || null,
      packaging_unit: isPaper ? unit : null,
      quantity: Number(quantity) || 0,
      min_quantity: Number(minQuantity) || 0,
      description: description.trim() || null,
      active: true,
    });

    setIsSaving(false);

    if (error) {
      alert("Erro: " + error.message);
      return;
    }

    onSaved();
  }

  return (
    <ModalShell
      title={isPaper ? "Adicionar papelaria" : "Adicionar fita"}
      onClose={onClose}
    >
      <Field label="Nome *">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={isPaper ? "Ex: Papel Kraft A5" : "Ex: Fita cetim rosa"}
          style={formInputStyle}
          autoFocus
        />
      </Field>

      {isPaper && (
        <>
          <Field label="Modelo">
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Ex: Floral, Clean, Rústico"
              style={formInputStyle}
            />
          </Field>

          <Field label="Unidade *">
            <select
              value={unit}
              onChange={(e) =>
                setUnit(e.target.value as "folha" | "pacote" | "rolo")
              }
              style={formInputStyle}
            >
              {PACKAGING_UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </Field>
        </>
      )}

      <Field label={isPaper ? "Descrição" : "Cor / Descrição"}>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={
            isPaper ? "Ex: Papel reciclado 120g" : "Ex: Rosa 2cm"
          }
          style={formInputStyle}
        />
      </Field>

      <div style={{ display: "flex", gap: 10 }}>
        <Field label="Qtd. atual" style={{ flex: 1 }}>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            style={formInputStyle}
          />
        </Field>
        <Field label="Qtd. mínima" style={{ flex: 1 }}>
          <input
            type="number"
            value={minQuantity}
            onChange={(e) => setMinQuantity(e.target.value)}
            style={formInputStyle}
          />
        </Field>
      </div>

      <SaveButton
        onClick={handleSave}
        isSaving={isSaving}
        disabled={!name.trim()}
      />
    </ModalShell>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 40,
        }}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(480px, 92%)",
          maxHeight: "90vh",
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
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
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
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {children}
        </div>
      </div>
    </>
  );
}

function Field({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={style}>
      <label
        style={{
          display: "block",
          fontSize: 11,
          fontWeight: 600,
          color: "#7a7a72",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function SaveButton({
  onClick,
  isSaving,
  disabled,
}: {
  onClick: () => void;
  isSaving: boolean;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isSaving || disabled}
      style={{
        marginTop: 8,
        padding: "12px 20px",
        background: isSaving || disabled ? "#a3a3a3" : "#166534",
        color: "#fff",
        border: 0,
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        cursor: isSaving || disabled ? "not-allowed" : "pointer",
      }}
    >
      {isSaving ? "Salvando..." : "Salvar"}
    </button>
  );
}

// ==========================================
// ESTILOS
// ==========================================

const inputStyle: React.CSSProperties = {
  height: 38,
  padding: "0 12px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 13,
  outline: "none",
  minWidth: 220,
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  background: "#fff",
  cursor: "pointer",
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
  padding: 40,
  textAlign: "center",
  color: "#7a7a72",
  fontSize: 13,
  background: "#fff",
  border: "1px solid #e0e0dc",
  borderRadius: 8,
};

const qtyBtnStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#fff",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
  color: "#2f2a26",
};

const qtyInputStyle: React.CSSProperties = {
  width: 64,
  height: 36,
  textAlign: "center",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 14,
  fontWeight: 700,
  color: "#166534",
  outline: "none",
};

const removeBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: 0,
  color: "#991b1b",
  fontSize: 18,
  cursor: "pointer",
  padding: 8,
};

const primaryBtnStyle: React.CSSProperties = {
  padding: "10px 20px",
  background: "#166534",
  color: "#fff",
  border: 0,
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const formInputStyle: React.CSSProperties = {
  width: "100%",
  height: 40,
  padding: "0 12px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 13,
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};