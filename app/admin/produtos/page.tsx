"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

// ==========================================
// TIPOS
// ==========================================

type ProductColor = {
  name: string;
  hex: string;
  image: string;
  active: boolean;
};

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
  requires_packaging: boolean | null;
  colors: ProductColor[] | null;
};

type WeeklyFlower = {
  id: string;
  position: number;
  name: string;
  image: string | null;
  active: boolean;
  extra_price: number | null;
  allowed_products: string[] | null;
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

      {activeTab === "produtos" && <ProdutosTab />}
      {activeTab === "flores" && <FloresTab />}
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
                <th style={thStyle}>Cores</th>
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

                const activeColors = (p.colors || []).filter((c) => c.active);

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
                      <div style={{ display: "flex", gap: 4 }}>
                        {activeColors.slice(0, 5).map((color, i) => (
                          <span
                            key={i}
                            title={color.name}
                            style={{
                              display: "block",
                              width: 18,
                              height: 18,
                              borderRadius: "50%",
                              background: color.hex,
                              border: "1px solid rgba(0,0,0,0.1)",
                            }}
                          />
                        ))}
                        {activeColors.length === 0 && (
                          <span style={{ color: "#9ca3af", fontSize: 12 }}>—</span>
                        )}
                        {activeColors.length > 5 && (
                          <span
                            style={{
                              fontSize: 11,
                              color: "#7a7a72",
                              alignSelf: "center",
                            }}
                          >
                            +{activeColors.length - 5}
                          </span>
                        )}
                      </div>
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
// EDITOR DE PRODUTO
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
  const [form, setForm] = useState<Product>({
    ...product,
    colors: product.colors || [],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [editingColorIndex, setEditingColorIndex] = useState<number | null>(null);
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);

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
        requires_packaging: form.requires_packaging,
        colors: form.colors || [],
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

  // ==========================================
  // VARIAÇÕES DE COR
  // ==========================================

  function openAddColor() {
    setEditingColorIndex(null);
    setIsColorModalOpen(true);
  }

  function openEditColor(index: number) {
    setEditingColorIndex(index);
    setIsColorModalOpen(true);
  }

  function saveColor(color: ProductColor, index: number | null) {
    setForm((current) => {
      const colors = [...(current.colors || [])];

      if (index === null) {
        colors.push(color);
      } else {
        colors[index] = color;
      }

      return { ...current, colors };
    });

    setIsColorModalOpen(false);
    setSuccessMsg("");
  }

  function removeColor(index: number) {
    if (!confirm("Remover essa variação de cor?")) return;

    setForm((current) => ({
      ...current,
      colors: (current.colors || []).filter((_, i) => i !== index),
    }));
    setSuccessMsg("");
  }

  function toggleColorActive(index: number) {
    setForm((current) => ({
      ...current,
      colors: (current.colors || []).map((c, i) =>
        i === index ? { ...c, active: !c.active } : c
      ),
    }));
    setSuccessMsg("");
  }

  const colors = form.colors || [];

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

          {/* ========================================== */}
          {/* 🎨 VARIAÇÕES DE COR */}
          {/* ========================================== */}
          <div
            style={{
              marginTop: 8,
              padding: 16,
              background: "#f9f9f7",
              borderRadius: 8,
              border: "1px solid #e0e0dc",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#2f2a26",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                🎨 Variações de cor ({colors.length})
              </h3>

              <button
                type="button"
                onClick={openAddColor}
                style={{
                  padding: "6px 12px",
                  background: "#166534",
                  color: "#fff",
                  border: 0,
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                ➕ Adicionar
              </button>
            </div>

            {colors.length === 0 ? (
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: "#7a7a72",
                  textAlign: "center",
                  padding: "12px 0",
                }}
              >
                Nenhuma variação cadastrada.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {colors.map((color, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: 8,
                      background: "#fff",
                      border: "1px solid #e0e0dc",
                      borderRadius: 6,
                      opacity: color.active ? 1 : 0.5,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 6,
                        overflow: "hidden",
                        background: "#f2ece6",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {color.image ? (
                        <img
                          src={color.image}
                          alt={color.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <span
                          style={{
                            width: "100%",
                            height: "100%",
                            background: color.hex,
                          }}
                        />
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#2f2a26",
                        }}
                      >
                        {color.name}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "#7a7a72",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          marginTop: 2,
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: color.hex,
                            border: "1px solid rgba(0,0,0,0.1)",
                          }}
                        />
                        {color.hex}
                      </div>
                    </div>

                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11,
                        cursor: "pointer",
                        userSelect: "none",
                        color: "#7a7a72",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={color.active}
                        onChange={() => toggleColorActive(i)}
                      />
                      Ativa
                    </label>

                    <button
                      type="button"
                      onClick={() => openEditColor(i)}
                      style={{
                        padding: "4px 8px",
                        background: "transparent",
                        border: "1px solid #d1d5db",
                        borderRadius: 4,
                        fontSize: 11,
                        cursor: "pointer",
                        color: "#2f2a26",
                      }}
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => removeColor(i)}
                      style={{
                        padding: "4px 8px",
                        background: "transparent",
                        border: "1px solid #fecaca",
                        borderRadius: 4,
                        fontSize: 11,
                        cursor: "pointer",
                        color: "#991b1b",
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p
              style={{
                margin: "10px 0 0",
                fontSize: 10,
                color: "#9ca3af",
                textAlign: "center",
              }}
            >
              💡 Clique em <strong>Salvar alterações</strong> abaixo pra aplicar.
            </p>
          </div>

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
            label="Exige finalização (papelaria + fita)"
            value={!!form.requires_packaging}
            onChange={(v) => updateField("requires_packaging", v)}
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

      {isColorModalOpen && (
        <ColorModal
          color={
            editingColorIndex !== null
              ? colors[editingColorIndex]
              : { name: "", hex: "#000000", image: "", active: true }
          }
          onClose={() => setIsColorModalOpen(false)}
          onSave={(color) => saveColor(color, editingColorIndex)}
        />
      )}
    </>
  );
}

// ==========================================
// MODAL DE COR
// ==========================================

function ColorModal({
  color,
  onClose,
  onSave,
}: {
  color: ProductColor;
  onClose: () => void;
  onSave: (color: ProductColor) => void;
}) {
  const [name, setName] = useState(color.name);
  const [hex, setHex] = useState(color.hex);
  const [image, setImage] = useState(color.image);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (res.ok && result.url) {
        setImage(result.url);
      } else {
        alert("Erro no upload.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro no upload.");
    } finally {
      setIsUploading(false);
    }
  }

  function handleSave() {
    if (!name.trim()) {
      alert("Informe o nome da cor.");
      return;
    }

    if (!hex.trim()) {
      alert("Informe o código da cor (hex).");
      return;
    }

    onSave({
      name: name.trim(),
      hex: hex.trim(),
      image: image.trim(),
      active: color.active,
    });
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 60,
        }}
      />

      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(420px, 92%)",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: 12,
          zIndex: 70,
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
            {color.name ? "Editar variação" : "Nova variação de cor"}
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
          <div>
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
              Nome da cor *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Branco, Cinza, Rosa"
              style={formInputStyle}
              autoFocus
            />
          </div>

          <div>
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
              Cor (hex) *
            </label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="color"
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                style={{
                  width: 48,
                  height: 44,
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  padding: 4,
                  cursor: "pointer",
                  background: "#fff",
                }}
              />
              <input
                type="text"
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                placeholder="#ffffff"
                style={{ ...formInputStyle, flex: 1 }}
              />
            </div>
          </div>

          <div>
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
              Foto da variação
            </label>

            <div
              onClick={() => !isUploading && fileInputRef.current?.click()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: 12,
                background: "#f9f9f7",
                border: "1px dashed #d1d5db",
                borderRadius: 8,
                cursor: isUploading ? "wait" : "pointer",
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 8,
                  overflow: "hidden",
                  background: "#f2ece6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {isUploading ? (
                  <span style={{ fontSize: 11, color: "#7a7a72" }}>...</span>
                ) : image ? (
                  <img
                    src={image}
                    alt="Preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <span style={{ fontSize: 22, color: "#9ca3af" }}>+</span>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#2f2a26",
                  }}
                >
                  {image ? "Trocar imagem" : "Clique pra escolher"}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "#7a7a72",
                    marginTop: 2,
                  }}
                >
                  JPG, PNG ou WEBP
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
                e.target.value = "";
              }}
              style={{ display: "none" }}
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isUploading || !name.trim()}
            style={{
              marginTop: 8,
              padding: "12px 20px",
              background:
                isUploading || !name.trim() ? "#a3a3a3" : "#166534",
              color: "#fff",
              border: 0,
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              cursor:
                isUploading || !name.trim() ? "not-allowed" : "pointer",
            }}
          >
            {isUploading ? "Enviando..." : "Salvar variação"}
          </button>
        </div>
      </div>
    </>
  );
}

// ==========================================
// ABA: FLORES DA SEMANA
// ==========================================

function FloresTab() {
  const [flowers, setFlowers] = useState<WeeklyFlower[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedFlowerId, setExpandedFlowerId] = useState<string | null>(null);

  async function loadData() {
    setIsLoading(true);

    const [flowersRes, productsRes] = await Promise.all([
      supabase
        .from("weekly_flowers")
        .select("*")
        .order("position", { ascending: true }),
      supabase
        .from("products")
        .select("id, name")
        .order("name", { ascending: true }),
    ]);

    if (flowersRes.error) {
      console.error("Erro ao carregar flores:", flowersRes.error);
      setFlowers([]);
    } else {
      setFlowers(flowersRes.data ?? []);
    }

    if (productsRes.error) {
      console.error("Erro ao carregar produtos:", productsRes.error);
      setProducts([]);
    } else {
      setProducts((productsRes.data ?? []) as Product[]);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function updateFlower(id: string, patch: Partial<WeeklyFlower>) {
    setFlowers((current) =>
      current.map((f) => (f.id === id ? { ...f, ...patch } : f))
    );
  }

  function toggleProductForFlower(flower: WeeklyFlower, productName: string) {
    const current = flower.allowed_products || [];
    const exists = current.includes(productName);

    const updated = exists
      ? current.filter((p) => p !== productName)
      : [...current, productName];

    updateFlower(flower.id, { allowed_products: updated });
  }

  async function saveFlower(flower: WeeklyFlower) {
    setSavingId(flower.id);

    const { error } = await supabase
      .from("weekly_flowers")
      .update({
        name: flower.name,
        image: flower.image,
        active: flower.active,
        extra_price: Number(flower.extra_price) || 0,
        allowed_products: flower.allowed_products || [],
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

    updateFlower(id, { image: result.url });

    await supabase
      .from("weekly_flowers")
      .update({ image: result.url, updated_at: new Date().toISOString() })
      .eq("id", id);
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

  function countProducts(flower: WeeklyFlower): number {
    return (flower.allowed_products || []).length;
  }

  return (
    <>
      <p
        style={{
          margin: "0 0 20px",
          color: "#7a7a72",
          fontSize: 13,
          maxWidth: 700,
        }}
      >
        Marque em <strong>quais produtos</strong> cada flor vai aparecer. Se
        não marcar nenhum, a flor <strong>não aparece</strong> em nenhum
        produto. Flores com <strong>preço adicional</strong> (ex: Lírio) somam
        o valor no total.
      </p>

      <div style={{ marginBottom: 16 }}>
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
          ➕ Adicionar flor
        </button>
      </div>

      {isLoading ? (
        <div style={emptyStyle}>Carregando flores...</div>
      ) : flowers.length === 0 ? (
        <div style={emptyStyle}>Nenhuma flor cadastrada.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {flowers.map((flower) => {
            const isExpanded = expandedFlowerId === flower.id;
            const count = countProducts(flower);

            return (
              <div
                key={flower.id}
                style={{
                  background: "#fff",
                  border: "1px solid #e0e0dc",
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    alignItems: "center",
                    padding: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <FlowerImageUpload
                    image={flower.image}
                    onUpload={(file) => handleUpload(flower.id, file)}
                    isLoading={savingId === flower.id}
                  />

                  <input
                    type="text"
                    value={flower.name}
                    onChange={(e) =>
                      updateFlower(flower.id, { name: e.target.value })
                    }
                    style={{ ...inputStyle, flex: "1 1 180px" }}
                  />

                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label
                      style={{
                        fontSize: 10,
                        color: "#7a7a72",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontWeight: 600,
                      }}
                    >
                      Adicional (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={flower.extra_price || ""}
                      onChange={(e) =>
                        updateFlower(flower.id, {
                          extra_price: e.target.value
                            ? Number(e.target.value)
                            : 0,
                        })
                      }
                      placeholder="0,00"
                      style={{ ...inputStyle, width: 100 }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setExpandedFlowerId(isExpanded ? null : flower.id)
                    }
                    style={{
                      padding: "8px 14px",
                      background: isExpanded ? "#2f2a26" : "#f9f9f7",
                      color: isExpanded ? "#fff" : "#2f2a26",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    📦 {count} {count === 1 ? "produto" : "produtos"}
                  </button>

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

                {isExpanded && (
                  <div
                    style={{
                      padding: 16,
                      background: "#f9f9f7",
                      borderTop: "1px solid #e0e0dc",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#7a7a72",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: 12,
                      }}
                    >
                      📦 Aparece em quais produtos:
                    </div>

                    {products.length === 0 ? (
                      <p style={{ fontSize: 13, color: "#7a7a72", margin: 0 }}>
                        Nenhum produto cadastrado.
                      </p>
                    ) : (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fill, minmax(200px, 1fr))",
                          gap: 8,
                        }}
                      >
                        {products.map((product) => {
                          const isChecked = (
                            flower.allowed_products || []
                          ).includes(product.name);

                          return (
                            <label
                              key={product.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "8px 12px",
                                background: "#fff",
                                border: isChecked
                                  ? "1px solid #166534"
                                  : "1px solid #e0e0dc",
                                borderRadius: 6,
                                cursor: "pointer",
                                userSelect: "none",
                                fontSize: 13,
                                color: "#2f2a26",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() =>
                                  toggleProductForFlower(flower, product.name)
                                }
                              />
                              {product.name}
                            </label>
                          );
                        })}
                      </div>
                    )}

                    <p
                      style={{
                        margin: "12px 0 0",
                        fontSize: 11,
                        color: "#7a7a72",
                      }}
                    >
                      💡 Lembre-se de clicar em <strong>Salvar</strong> depois
                      de marcar/desmarcar.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <AddFlowerModal
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            setShowAddModal(false);
            loadData();
          }}
          nextPosition={
            flowers.length > 0
              ? Math.max(...flowers.map((f) => f.position)) + 1
              : 1
          }
          products={products}
        />
      )}
    </>
  );
}

// ==========================================
// MODAL: ADICIONAR FLOR
// ==========================================

function AddFlowerModal({
  onClose,
  onSaved,
  nextPosition,
  products,
}: {
  onClose: () => void;
  onSaved: () => void;
  nextPosition: number;
  products: Product[];
}) {
  const [name, setName] = useState("");
  const [extraPrice, setExtraPrice] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.url) {
        throw new Error(result.error || "Erro no upload");
      }

      setImageUrl(result.url);
    } catch (err: any) {
      console.error("Erro no upload:", err);
      alert("Erro no upload: " + (err?.message || "desconhecido"));
    } finally {
      setIsUploading(false);
    }
  }

  function toggleProduct(productName: string) {
    setSelectedProducts((current) => {
      if (current.includes(productName)) {
        return current.filter((p) => p !== productName);
      }
      return [...current, productName];
    });
  }

  async function handleSave() {
    if (!name.trim()) {
      alert("Informe o nome da flor.");
      return;
    }

    setIsSaving(true);

    const { error } = await supabase.from("weekly_flowers").insert({
      position: nextPosition,
      name: name.trim(),
      image: imageUrl,
      active: true,
      extra_price: extraPrice ? Number(extraPrice.replace(",", ".")) : 0,
      allowed_products: selectedProducts,
    });

    setIsSaving(false);

    if (error) {
      alert("Erro ao adicionar: " + error.message);
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
          width: "min(600px, 92%)",
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
            Adicionar nova flor
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

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
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
              Foto
            </label>

            <div
              onClick={() => !isUploading && fileInputRef.current?.click()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: 16,
                background: "#f9f9f7",
                border: "1px dashed #d1d5db",
                borderRadius: 8,
                cursor: isUploading ? "wait" : "pointer",
              }}
            >
              <div
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
                  flexShrink: 0,
                }}
              >
                {isUploading ? (
                  <span style={{ fontSize: 11, color: "#7a7a72" }}>...</span>
                ) : imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <span style={{ fontSize: 24, color: "#9ca3af" }}>+</span>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#2f2a26",
                  }}
                >
                  {imageUrl ? "Trocar imagem" : "Clique pra escolher uma imagem"}
                </div>
                <div style={{ fontSize: 11, color: "#7a7a72", marginTop: 2 }}>
                  JPG, PNG ou WEBP
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
                e.target.value = "";
              }}
              style={{ display: "none" }}
            />
          </div>

          <div>
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
              Nome da flor *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Lírio, Rosa, Girassol..."
              style={formInputStyle}
              autoFocus
            />
          </div>

          <div>
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
              Adicional (R$)
            </label>
            <input
              type="text"
              value={extraPrice}
              onChange={(e) => setExtraPrice(e.target.value)}
              placeholder="15,00"
              style={formInputStyle}
            />
            <p style={{ margin: "6px 0 0", fontSize: 11, color: "#7a7a72" }}>
              Deixe vazio se a flor não tem valor adicional.
            </p>
          </div>

          <div>
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
              Aparece em quais produtos?
            </label>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 8,
                maxHeight: 240,
                overflowY: "auto",
                padding: 8,
                border: "1px solid #e0e0dc",
                borderRadius: 8,
              }}
            >
              {products.map((product) => {
                const isChecked = selectedProducts.includes(product.name);

                return (
                  <label
                    key={product.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 10px",
                      background: isChecked ? "#f0fdf4" : "#fff",
                      border: isChecked
                        ? "1px solid #166534"
                        : "1px solid #e0e0dc",
                      borderRadius: 6,
                      cursor: "pointer",
                      userSelect: "none",
                      fontSize: 12,
                      color: "#2f2a26",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleProduct(product.name)}
                    />
                    {product.name}
                  </label>
                );
              })}
            </div>

            <p style={{ margin: "6px 0 0", fontSize: 11, color: "#7a7a72" }}>
              Se não marcar nenhum, a flor não aparece no site.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isUploading || !name.trim()}
            style={{
              marginTop: 8,
              padding: "12px 20px",
              background:
                isSaving || isUploading || !name.trim()
                  ? "#a3a3a3"
                  : "#166534",
              color: "#fff",
              border: 0,
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              cursor:
                isSaving || isUploading || !name.trim()
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {isSaving ? "Salvando..." : "Adicionar flor"}
          </button>
        </div>
      </div>
    </>
  );
}

// ==========================================
// UPLOAD DE IMAGEM (FLORES)
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

const formInputStyle: React.CSSProperties = {
  width: "100%",
  height: 44,
  padding: "0 14px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 14,
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};