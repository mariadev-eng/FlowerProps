"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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

const CATEGORIES = [
  { value: "Embalagens", label: "🎁 Embalagens" },
  { value: "Ursos", label: "🧸 Ursos" },
  { value: "Complementos", label: "🍫 Complementos" },
  { value: "Papelaria", label: "🎨 Papelaria" },
  { value: "Outros", label: "📎 Outros" },
];

export default function EstoquePage() {
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
        current.map((i) => (i.id === id ? { ...i, quantity: item.quantity } : i))
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
    <div>
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
        <div>
          <h1
            style={{
              margin: "0 0 4px",
              fontSize: 22,
              fontWeight: 600,
              color: "#2f2a26",
            }}
          >
            Estoque
          </h1>
          <p style={{ margin: 0, color: "#7a7a72", fontSize: 13 }}>
            {totalItems} {totalItems === 1 ? "item" : "itens"}
            {itemsBelowMin > 0 && (
              <span style={{ color: "#dc2626", marginLeft: 8 }}>
                · {itemsBelowMin} abaixo do mínimo
              </span>
            )}
          </p>
        </div>

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
          {CATEGORIES.map((c) => (
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
                {CATEGORIES.find((c) => c.value === category)?.label ||
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
        <AddItemModal
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            setShowAddModal(false);
            loadItems();
          }}
        />
      )}
    </div>
  );
}

function AddItemModal({
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
      alert("Informe o nome do item.");
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
            Adicionar item ao estoque
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
          <Field label="Nome do item *">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Caixa redonda - Box Bloom"
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
              {CATEGORIES.map((c) => (
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
              placeholder="Ex: 30cm de diâmetro, cor vermelha..."
              rows={2}
              style={{ ...formInputStyle, resize: "vertical" }}
            />
          </Field>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            style={{
              marginTop: 8,
              padding: "12px 20px",
              background: isSaving || !name.trim() ? "#a3a3a3" : "#166534",
              color: "#fff",
              border: 0,
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              cursor: isSaving || !name.trim() ? "not-allowed" : "pointer",
            }}
          >
            {isSaving ? "Salvando..." : "Adicionar"}
          </button>
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