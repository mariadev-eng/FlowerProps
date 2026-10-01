"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

// ==========================================
// TIPOS
// ==========================================

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: number;
  image: string | null;
  available: boolean;
  featured: boolean | null;
  requires_flower_selection: boolean;
  is_complement: boolean | null;
  included_complements: string[] | null;
  max_flowers: number | null;
};

type WeeklyFlower = {
  id: string;
  position: number;
  name: string;
  image: string | null;
  active: boolean;
};

const CATEGORIES = [
  { id: 1, name: "Buquês" },
  { id: 3, name: "Presentes" },
  { id: 4, name: "Acessórios" },
];

const CATEGORY_COLORS: Record<number, { bg: string; color: string }> = {
  1: { bg: "#dbeafe", color: "#1e40af" },
  3: { bg: "#fce7f3", color: "#9f1239" },
  4: { bg: "#fef3c7", color: "#854d0e" },
};

// ==========================================
// PÁGINA
// ==========================================

export default function AdminProdutosPage() {
  const [activeTab, setActiveTab] = useState<"produtos" | "flores">("produtos");

  return (
    <div>
      {/* HEADER + SUB-ABAS */}
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{
            margin: "0 0 16px",
            fontSize: 22,
            fontWeight: 600,
            color: "#2f2a26",
          }}
        >
          Produtos
        </h1>

        <div
          style={{
            display: "flex",
            gap: 4,
            borderBottom: "1px solid #e0e0dc",
          }}
        >
          <SubTab
            active={activeTab === "produtos"}
            onClick={() => setActiveTab("produtos")}
          >
            Produtos
          </SubTab>
          <SubTab
            active={activeTab === "flores"}
            onClick={() => setActiveTab("flores")}
          >
            Flores da Semana
          </SubTab>
        </div>
      </div>

      {/* CONTEÚDO */}
      {activeTab === "produtos" && <ProdutosTab />}
      {activeTab === "flores" && <FloresTab />}
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
// ABA: PRODUTOS
// ==========================================

function ProdutosTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  async function loadProducts() {
    setIsLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Erro ao carregar produtos:", error);
      setProducts([]);
    } else {
      setProducts(data ?? []);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const filtered = products.filter((p) => {
    if (categoryFilter !== "all" && String(p.category_id) !== categoryFilter) {
      return false;
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      if (!p.name.toLowerCase().includes(search)) return false;
    }

    return true;
  });

  function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function getCategoryName(id: number) {
    return CATEGORIES.find((c) => c.id === id)?.name || "—";
  }

  return (
    <>
      {/* FILTROS */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nome..."
          style={inputStyle}
        />

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={selectStyle}
        >
          <option value="all">Todas as categorias</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={loadProducts}
          disabled={isLoading}
          style={refreshBtnStyle}
        >
          {isLoading ? "..." : "↻"}
        </button>
      </div>

      {/* TABELA */}
      <div style={tableWrapperStyle}>
        {isLoading ? (
          <div style={emptyStyle}>Carregando produtos...</div>
        ) : filtered.length === 0 ? (
          <div style={emptyStyle}>Nenhum produto encontrado.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f9f9f7" }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Produto</th>
                <th style={thStyle}>Categoria</th>
                <th style={thStyle}>Preço</th>
                <th style={thStyle}>Disponível</th>
                <th style={thStyle}>Complemento</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const catColor = CATEGORY_COLORS[p.category_id] || {
                  bg: "#f3f4f6",
                  color: "#6b7280",
                };

                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    style={{
                      borderTop: "1px solid #f0f0ec",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f9f9f7")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td style={{ ...tdStyle, color: "#7a7a72" }}>#{p.id}</td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {p.image && (
                          <img
                            src={p.image}
                            alt={p.name}
                            style={{
                              width: 40,
                              height: 40,
                              objectFit: "cover",
                              borderRadius: 4,
                            }}
                          />
                        )}
                        <span style={{ fontWeight: 500 }}>{p.name}</span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          background: catColor.bg,
                          color: catColor.color,
                        }}
                      >
                        {getCategoryName(p.category_id)}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>
                      {formatPrice(p.price)}
                    </td>
                    <td style={tdStyle}>
                      {p.available ? "✅ Sim" : "❌ Não"}
                    </td>
                    <td style={{ ...tdStyle, color: "#7a7a72" }}>
                      {p.is_complement ? "Sim" : "Não"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* PAINEL LATERAL DE EDIÇÃO */}
      {selectedProduct && (
        <ProductEditor
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onSaved={(updated) => {
            setProducts((current) =>
              current.map((p) => (p.id === updated.id ? updated : p))
            );
            setSelectedProduct(updated);
          }}
        />
      )}
    </>
  );
}

// ==========================================
// EDITOR DE PRODUTO (painel lateral)
// ==========================================

function ProductEditor({
  product,
  onClose,
  onSaved,
}: {
  product: Product;
  onClose: () => void;
  onSaved: (p: Product) => void;
}) {
  const [form, setForm] = useState<Product>(product);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  function updateField<K extends keyof Product>(key: K, value: Product[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setSuccessMsg("");
  }

  async function handleSave() {
    setIsSaving(true);
    setSuccessMsg("");

    const { error } = await supabase
      .from("products")
      .update({
        name: form.name,
        description: form.description,
        price: Number(form.price),
        category_id: Number(form.category_id),
        image: form.image,
        available: form.available,
        featured: form.featured,
        requires_flower_selection: form.requires_flower_selection,
        is_complement: form.is_complement,
        included_complements: form.included_complements || [],
        max_flowers: form.max_flowers,
      })
      .eq("id", form.id);

    setIsSaving(false);

    if (error) {
      alert("Erro ao salvar: " + error.message);
      return;
    }

    setSuccessMsg("✅ Salvo!");
    onSaved(form);
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.3)",
          zIndex: 40,
        }}
      />

      <aside style={editorAsideStyle}>
        <div style={editorHeaderStyle}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            Editar #{product.id}
          </h2>
          <button type="button" onClick={onClose} style={closeBtnStyle}>
            ×
          </button>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <InputField
            label="Nome"
            value={form.name}
            onChange={(v) => updateField("name", v)}
          />

          <InputField
            label="Descrição"
            value={form.description}
            onChange={(v) => updateField("description", v)}
            multiline
          />

          <InputField
            label="Preço (R$)"
            value={String(form.price)}
            onChange={(v) => updateField("price", Number(v) || 0)}
            type="number"
          />

          <SelectField
            label="Categoria"
            value={String(form.category_id)}
            onChange={(v) => updateField("category_id", Number(v))}
            options={CATEGORIES.map((c) => ({
              value: String(c.id),
              label: c.name,
            }))}
          />

          <InputField
            label="URL da imagem"
            value={form.image || ""}
            onChange={(v) => updateField("image", v)}
          />

          {form.image && (
            <img
              src={form.image}
              alt="Preview"
              style={{
                width: "100%",
                maxHeight: 200,
                objectFit: "cover",
                borderRadius: 8,
              }}
            />
          )}

          <InputField
            label="Máximo de flores (deixe vazio pra sem limite)"
            value={form.max_flowers ? String(form.max_flowers) : ""}
            onChange={(v) =>
              updateField("max_flowers", v ? Number(v) : null)
            }
            type="number"
          />

          <InputField
            label="Complementos inclusos (separados por vírgula)"
            value={(form.included_complements || []).join(", ")}
            onChange={(v) =>
              updateField(
                "included_complements",
                v
                  .split(",")
                  .map((s) => s.trim().toLowerCase())
                  .filter(Boolean)
              )
            }
          />

          <ToggleField
            label="Disponível"
            value={!!form.available}
            onChange={(v) => updateField("available", v)}
          />

          <ToggleField
            label="Featured (destaque na home)"
            value={!!form.featured}
            onChange={(v) => updateField("featured", v)}
          />

          <ToggleField
            label="Requer escolha de flores"
            value={!!form.requires_flower_selection}
            onChange={(v) => updateField("requires_flower_selection", v)}
          />

          <ToggleField
            label="É complemento"
            value={!!form.is_complement}
            onChange={(v) => updateField("is_complement", v)}
          />

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            style={{
              marginTop: 8,
              padding: "12px 20px",
              background: isSaving ? "#a3a3a3" : "#166534",
              color: "#fff",
              border: 0,
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: isSaving ? "wait" : "pointer",
            }}
          >
            {isSaving ? "Salvando..." : "Salvar alterações"}
          </button>

          {successMsg && (
            <div
              style={{
                padding: 12,
                background: "#dcfce7",
                color: "#166534",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {successMsg}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

// ==========================================
// ABA: FLORES DA SEMANA
// ==========================================

function FloresTab() {
  const [flowers, setFlowers] = useState<WeeklyFlower[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [newFlowerName, setNewFlowerName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  async function loadFlowers() {
    setIsLoading(true);

    const { data, error } = await supabase
      .from("weekly_flowers")
      .select("*")
      .order("position", { ascending: true });

    if (error) {
      console.error("Erro ao carregar flores:", error);
      setFlowers([]);
    } else {
      setFlowers(data ?? []);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadFlowers();
  }, []);

  function updateFlower(id: string, patch: Partial<WeeklyFlower>) {
    setFlowers((current) =>
      current.map((f) => (f.id === id ? { ...f, ...patch } : f))
    );
  }

  async function saveFlower(flower: WeeklyFlower) {
    setSavingId(flower.id);

    const { error } = await supabase
      .from("weekly_flowers")
      .update({
        name: flower.name,
        image: flower.image,
        active: flower.active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", flower.id);

    setSavingId(null);

    if (error) {
      alert("Erro ao salvar: " + error.message);
      return;
    }
  }

  async function handleUpload(id: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);

    setSavingId(id);

    const response = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    setSavingId(null);

    if (!response.ok || !result.url) {
      alert("Erro no upload: " + (result.error || "desconhecido"));
      return;
    }

    // Atualiza a flor com a nova URL
    updateFlower(id, { image: result.url });

    // Salva no banco
    await supabase
      .from("weekly_flowers")
      .update({ image: result.url, updated_at: new Date().toISOString() })
      .eq("id", id);
  }

  async function handleAddFlower() {
    if (!newFlowerName.trim()) return;

    setIsAdding(true);

    const nextPosition =
      flowers.length > 0
        ? Math.max(...flowers.map((f) => f.position)) + 1
        : 1;

    const { data, error } = await supabase
      .from("weekly_flowers")
      .insert({
        position: nextPosition,
        name: newFlowerName.trim(),
        image: null,
        active: true,
      })
      .select()
      .single();

    setIsAdding(false);

    if (error) {
      alert("Erro ao adicionar: " + error.message);
      return;
    }

    setFlowers((current) => [...current, data]);
    setNewFlowerName("");
  }

  async function handleRemoveFlower(id: string) {
    if (!confirm("Remover essa flor?")) return;

    const { error } = await supabase
      .from("weekly_flowers")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Erro ao remover: " + error.message);
      return;
    }

    setFlowers((current) => current.filter((f) => f.id !== id));
  }

  return (
    <>
      <p
        style={{
          margin: "0 0 20px",
          color: "#7a7a72",
          fontSize: 13,
          maxWidth: 600,
        }}
      >
        As flores abaixo aparecem em <strong>todos os produtos</strong> que
        exigem escolha de flores. Quando uma acabar, é só desativar ou remover
        aqui.
      </p>

      {/* LISTA */}
      {isLoading ? (
        <div style={emptyStyle}>Carregando flores...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {flowers.map((flower) => (
            <div
              key={flower.id}
              style={{
                display: "flex",
                gap: 16,
                alignItems: "center",
                padding: 16,
                background: "#fff",
                border: "1px solid #e0e0dc",
                borderRadius: 8,
              }}
            >
              {/* Imagem */}
              <FlowerImageUpload
                image={flower.image}
                onUpload={(file) => handleUpload(flower.id, file)}
                isLoading={savingId === flower.id}
              />

              {/* Nome */}
              <input
                type="text"
                value={flower.name}
                onChange={(e) =>
                  updateFlower(flower.id, { name: e.target.value })
                }
                style={{ ...inputStyle, flex: 1 }}
              />

              {/* Ativo */}
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  color: "#2f2a26",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <input
                  type="checkbox"
                  checked={flower.active}
                  onChange={(e) =>
                    updateFlower(flower.id, { active: e.target.checked })
                  }
                />
                Ativa
              </label>

              {/* Salvar */}
              <button
                type="button"
                onClick={() => saveFlower(flower)}
                disabled={savingId === flower.id}
                style={{
                  padding: "8px 16px",
                  background: "#166534",
                  color: "#fff",
                  border: 0,
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: savingId === flower.id ? "wait" : "pointer",
                }}
              >
                {savingId === flower.id ? "..." : "Salvar"}
              </button>

              {/* Remover */}
              <button
                type="button"
                onClick={() => handleRemoveFlower(flower.id)}
                style={{
                  padding: "8px 12px",
                  background: "transparent",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  borderRadius: 6,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ADICIONAR NOVA */}
      <div
        style={{
          marginTop: 20,
          padding: 16,
          background: "#f9f9f7",
          border: "1px dashed #d1d5db",
          borderRadius: 8,
          display: "flex",
          gap: 12,
          alignItems: "center",
        }}
      >
        <input
          type="text"
          value={newFlowerName}
          onChange={(e) => setNewFlowerName(e.target.value)}
          placeholder="Nome da nova flor"
          style={{ ...inputStyle, flex: 1 }}
        />

        <button
          type="button"
          onClick={handleAddFlower}
          disabled={isAdding || !newFlowerName.trim()}
          style={{
            padding: "10px 20px",
            background: "#2f2a26",
            color: "#fff",
            border: 0,
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            cursor: isAdding ? "wait" : "pointer",
          }}
        >
          {isAdding ? "..." : "+ Adicionar"}
        </button>
      </div>
    </>
  );
}

// ==========================================
// COMPONENTE: UPLOAD DE IMAGEM
// ==========================================

function FlowerImageUpload({
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
        position: "relative",
      }}
    >
      {isLoading ? (
        <span style={{ fontSize: 11, color: "#7a7a72" }}>...</span>
      ) : image ? (
        <img
          src={image}
          alt="Flor"
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
// COMPONENTES AUXILIARES
// ==========================================

function InputField({
  label,
  value,
  onChange,
  type = "text",
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  multiline?: boolean;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#7a7a72",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          style={{
            padding: 10,
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontSize: 13,
            fontFamily: "inherit",
            outline: "none",
            resize: "vertical",
          }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            height: 40,
            padding: "0 12px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontSize: 13,
            outline: "none",
          }}
        />
      )}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#7a7a72",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          height: 40,
          padding: "0 12px",
          border: "1px solid #d1d5db",
          borderRadius: 6,
          fontSize: 13,
          outline: "none",
          background: "#fff",
          cursor: "pointer",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        background: "#f9f9f7",
        border: "1px solid #e0e0dc",
        borderRadius: 6,
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <span style={{ fontSize: 13, color: "#2f2a26", fontWeight: 500 }}>
        {label}
      </span>

      <div
        style={{
          position: "relative",
          width: 36,
          height: 20,
          background: value ? "#166534" : "#d1d5db",
          borderRadius: 10,
          transition: "background 0.2s",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 2,
            left: value ? 18 : 2,
            width: 16,
            height: 16,
            background: "#fff",
            borderRadius: "50%",
            transition: "left 0.2s",
          }}
        />
      </div>
    </label>
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

const tableWrapperStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e0e0dc",
  borderRadius: 8,
  overflow: "hidden",
};

const emptyStyle: React.CSSProperties = {
  padding: 40,
  textAlign: "center",
  color: "#7a7a72",
  fontSize: 13,
};

const thStyle: React.CSSProperties = {
  padding: "12px 16px",
  textAlign: "left",
  fontSize: 11,
  fontWeight: 600,
  color: "#7a7a72",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 16px",
  color: "#2f2a26",
};

const editorAsideStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  right: 0,
  bottom: 0,
  width: "min(520px, 100%)",
  background: "#fff",
  zIndex: 50,
  overflowY: "auto",
  boxShadow: "-4px 0 24px rgba(0,0,0,0.1)",
};

const editorHeaderStyle: React.CSSProperties = {
  position: "sticky",
  top: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "16px 24px",
  background: "#2f2a26",
  color: "#fff",
  zIndex: 1,
};

const closeBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: 0,
  color: "#fff",
  fontSize: 24,
  cursor: "pointer",
  lineHeight: 1,
};