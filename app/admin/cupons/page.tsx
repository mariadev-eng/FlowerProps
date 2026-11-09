"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Coupon = {
  id: number;
  code: string;
  discount_type: "fixed" | "percentage";
  discount_value: number;
  min_order_value: number;
  is_active: boolean;
  valid_until: string | null;
};

export default function AdminCuponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Form states
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [isActive, setIsActive] = useState(true);

  async function loadCoupons() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setCoupons(data ?? []);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    loadCoupons();
  }, []);

  function openNewModal() {
    setEditingCoupon(null);
    setCode("");
    setDiscountType("percentage");
    setDiscountValue("");
    setMinOrderValue("");
    setValidUntil("");
    setIsActive(true);
    setIsModalOpen(true);
  }

  function openEditModal(coupon: Coupon) {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setDiscountType(coupon.discount_type);
    setDiscountValue(String(coupon.discount_value));
    setMinOrderValue(String(coupon.min_order_value));
    setValidUntil(coupon.valid_until ? coupon.valid_until.split("T")[0] : "");
    setIsActive(coupon.is_active);
    setIsModalOpen(true);
  }

  async function handleSave() {
    if (!code.trim() || !discountValue) {
      alert("Preencha o código e o valor do desconto.");
      return;
    }

    const payload = {
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: Number(discountValue),
      min_order_value: Number(minOrderValue) || 0,
      valid_until: validUntil ? new Date(validUntil + "T23:59:59").toISOString() : null,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    };

    if (editingCoupon) {
      const { error } = await supabase.from("coupons").update(payload).eq("id", editingCoupon.id);
      if (error) return alert("Erro ao atualizar: " + error.message);
    } else {
      const { error } = await supabase.from("coupons").insert(payload);
      if (error) return alert("Erro ao criar: " + error.message);
    }

    setIsModalOpen(false);
    loadCoupons();
  }

  async function handleDelete(id: number) {
    if (!confirm("Tem certeza que deseja apagar este cupom?")) return;
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) return alert("Erro ao apagar: " + error.message);
    loadCoupons();
  }

  async function toggleActive(coupon: Coupon) {
    const { error } = await supabase
      .from("coupons")
      .update({ is_active: !coupon.is_active })
      .eq("id", coupon.id);

    if (error) return alert("Erro ao alterar status: " + error.message);
    setCoupons((current) =>
      current.map((c) => (c.id === coupon.id ? { ...c, is_active: !c.is_active } : c))
    );
  }

  function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: "#2f2a26" }}>Cupons de Desconto</h1>
        <button
          onClick={openNewModal}
          style={{ padding: "10px 20px", background: "#166534", color: "#fff", border: 0, borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          ➕ Novo Cupom
        </button>
      </div>

      {isLoading ? (
        <p>Carregando...</p>
      ) : (
        <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e0e0dc", overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f9f9f7" }}>
                <th style={{ padding: 12, textAlign: "left", fontSize: 11, color: "#7a7a72", textTransform: "uppercase" }}>Código</th>
                <th style={{ padding: 12, textAlign: "left", fontSize: 11, color: "#7a7a72", textTransform: "uppercase" }}>Desconto</th>
                <th style={{ padding: 12, textAlign: "left", fontSize: 11, color: "#7a7a72", textTransform: "uppercase" }}>Mín. Compra</th>
                <th style={{ padding: 12, textAlign: "left", fontSize: 11, color: "#7a7a72", textTransform: "uppercase" }}>Validade</th>
                <th style={{ padding: 12, textAlign: "left", fontSize: 11, color: "#7a7a72", textTransform: "uppercase" }}>Status</th>
                <th style={{ padding: 12, textAlign: "right", fontSize: 11, color: "#7a7a72", textTransform: "uppercase" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#7a7a72" }}>Nenhum cupom cadastrado.</td></tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} style={{ borderTop: "1px solid #f0f0ec" }}>
                    <td style={{ padding: 12, fontWeight: 600 }}>{coupon.code}</td>
                    <td style={{ padding: 12 }}>
                      {coupon.discount_type === "percentage"
                        ? `${coupon.discount_value}%`
                        : formatPrice(coupon.discount_value)}
                    </td>
                    <td style={{ padding: 12 }}>{formatPrice(coupon.min_order_value)}</td>
                    <td style={{ padding: 12, color: "#7a7a72" }}>
                      {coupon.valid_until ? new Date(coupon.valid_until).toLocaleDateString("pt-BR") : "Sem validade"}
                    </td>
                    <td style={{ padding: 12 }}>
                      <button
                        onClick={() => toggleActive(coupon)}
                        style={{
                          padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, border: 0, cursor: "pointer",
                          background: coupon.is_active ? "#dcfce7" : "#fee2e2",
                          color: coupon.is_active ? "#166534" : "#991b1b"
                        }}
                      >
                        {coupon.is_active ? "Ativo" : "Inativo"}
                      </button>
                    </td>
                    <td style={{ padding: 12, textAlign: "right" }}>
                      <button onClick={() => openEditModal(coupon)} style={{ marginRight: 8, background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontWeight: 600 }}>Editar</button>
                      <button onClick={() => handleDelete(coupon.id)} style={{ background: "none", border: "none", color: "#991b1b", cursor: "pointer", fontWeight: 600 }}>Apagar</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#fff", padding: 24, borderRadius: 12, width: "100%", maxWidth: 450 }}>
            <h2 style={{ margin: "0 0 16px", fontSize: 18 }}>{editingCoupon ? "Editar Cupom" : "Novo Cupom"}</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#7a7a72" }}>CÓDIGO DO CUPOM</label>
                <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Ex: BLOOM10" style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 6, marginTop: 4 }} />
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#7a7a72" }}>TIPO</label>
                  <select value={discountType} onChange={(e) => setDiscountType(e.target.value as any)} style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 6, marginTop: 4 }}>
                    <option value="percentage">Porcentagem (%)</option>
                    <option value="fixed">Valor Fixo (R$)</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#7a7a72" }}>VALOR DO DESCONTO</label>
                  <input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder={discountType === "percentage" ? "10" : "20.00"} style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 6, marginTop: 4 }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#7a7a72" }}>VALOR MÍNIMO DA COMPRA (R$)</label>
                <input type="number" value={minOrderValue} onChange={(e) => setMinOrderValue(e.target.value)} placeholder="0.00" style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 6, marginTop: 4 }} />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#7a7a72" }}>VÁLIDO ATÉ (Opcional)</label>
                <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 6, marginTop: 4 }} />
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginTop: 8 }}>
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                Cupom Ativo
              </label>

              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                <button onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: 12, background: "#fff", border: "1px solid #ccc", borderRadius: 6, cursor: "pointer" }}>Cancelar</button>
                <button onClick={handleSave} style={{ flex: 1, padding: 12, background: "#166534", color: "#fff", border: 0, borderRadius: 6, fontWeight: 700, cursor: "pointer" }}>Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}