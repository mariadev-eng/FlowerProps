"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// ==========================================
// TIPOS
// ==========================================

type BudgetCategory = {
  id: string;
  name: string;
  monthly_limit: number;
  weekly_limit: number;
  display_order: number;
};

type Expense = {
  id: string;
  category: string;
  description: string | null;
  amount: number;
  spent_at: string;
};

// ==========================================
// PÁGINA
// ==========================================

export default function GastosPage() {
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showNewCategory, setShowNewCategory] = useState(false);

  // Estado do formulário de nova categoria
  const [newName, setNewName] = useState("");
  const [newMonthly, setNewMonthly] = useState("");
  const [newWeekly, setNewWeekly] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Filtro de mês/ano
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  async function loadData() {
    setIsLoading(true);

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 1);

    const [categoriesRes, expensesRes] = await Promise.all([
      supabase
        .from("budget_categories")
        .select("*")
        .order("display_order", { ascending: true }),
      supabase
        .from("expenses")
        .select("*")
        .gte("spent_at", startOfMonth.toISOString().split("T")[0])
        .lt("spent_at", endOfMonth.toISOString().split("T")[0])
        .order("spent_at", { ascending: false }),
    ]);

    if (categoriesRes.error) {
      console.error("Erro ao carregar categorias:", categoriesRes.error);
    } else {
      setCategories(categoriesRes.data ?? []);
    }

    if (expensesRes.error) {
      console.error("Erro ao carregar despesas:", expensesRes.error);
    } else {
      setExpenses(expensesRes.data ?? []);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [month, year]);

  // ==========================================
  // CÁLCULOS
  // ==========================================

  function getSpentForCategory(categoryName: string): number {
    return expenses
      .filter((e) => e.category === categoryName)
      .reduce((sum, e) => sum + Number(e.amount), 0);
  }

  const totalMonthly = categories.reduce(
    (sum, c) => sum + Number(c.monthly_limit),
    0
  );
  const totalWeekly = categories.reduce(
    (sum, c) => sum + Number(c.weekly_limit),
    0
  );
  const totalSpent = expenses.reduce(
    (sum, e) => sum + Number(e.amount),
    0
  );

  // ==========================================
  // EDIÇÃO DE TETO (automática ao sair do campo)
  // ==========================================

  async function updateLimit(
    id: string,
    field: "monthly_limit" | "weekly_limit",
    value: number
  ) {
    setSavingId(id);

    const { error } = await supabase
      .from("budget_categories")
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq("id", id);

    setSavingId(null);

    if (error) {
      alert("Erro ao salvar: " + error.message);
      return;
    }

    setCategories((current) =>
      current.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  }

  // ==========================================
  // NOVA CATEGORIA
  // ==========================================

  async function handleCreateCategory() {
    if (!newName.trim()) {
      alert("Informe o nome da categoria.");
      return;
    }

    const monthly = Number(newMonthly) || 0;
    const weekly = Number(newWeekly) || 0;
    const nextOrder = categories.length + 1;

    setIsCreating(true);

    const { data, error } = await supabase
      .from("budget_categories")
      .insert({
        name: newName.trim(),
        monthly_limit: monthly,
        weekly_limit: weekly,
        display_order: nextOrder,
      })
      .select()
      .single();

    setIsCreating(false);

    if (error || !data) {
      alert("Erro ao criar categoria: " + (error?.message || "desconhecido"));
      return;
    }

    setCategories((current) => [...current, data]);
    setNewName("");
    setNewMonthly("");
    setNewWeekly("");
    setShowNewCategory(false);
  }

  // ==========================================
  // REMOVER CATEGORIA
  // ==========================================

  async function handleRemoveCategory(id: string, name: string) {
    if (
      !confirm(
        `Remover a categoria "${name}"?\n\nAs despesas antigas continuarão aparecendo no histórico, mas a categoria deixará de aparecer na lista.`
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("budget_categories")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Erro ao remover: " + error.message);
      return;
    }

    setCategories((current) => current.filter((c) => c.id !== id));
  }

  // ==========================================
  // HELPERS
  // ==========================================

  function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{
            margin: "0 0 4px",
            fontSize: 22,
            fontWeight: 600,
            color: "#2f2a26",
          }}
        >
          Controle de Gastos
        </h1>
        <p style={{ margin: "0 0 16px", color: "#7a7a72", fontSize: 13 }}>
          Orçamento mensal por categoria
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            style={selectStyle}
          >
            {monthNames.map((name, i) => (
              <option key={i + 1} value={i + 1}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            style={selectStyle}
          >
            {[2024, 2025, 2026, 2027, 2028].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            style={refreshBtnStyle}
          >
            {isLoading ? "..." : "↻"}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={emptyStyle}>Carregando...</div>
      ) : (
        <>
          {/* TABELA PRINCIPAL DE TETOS E GASTOS */}
          <div style={tableWrapperStyle}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr style={{ background: "#f9f9f7" }}>
                  <th style={thStyle}>Categoria</th>
                  <th style={thStyle}>Teto Mensal</th>
                  <th style={thStyle}>Teto Semanal</th>
                  <th style={thStyle}>Gasto Real (Mês)</th>
                  <th style={thStyle}>Saldo</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => {
                  const spent = getSpentForCategory(cat.name);
                  const balance = Number(cat.monthly_limit) - spent;
                  const isOver = balance < 0;
                  const isSaving = savingId === cat.id;

                  return (
                    <tr key={cat.id} style={{ borderTop: "1px solid #f0f0ec" }}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>
                        {cat.name}
                      </td>

                      <td style={tdStyle}>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={cat.monthly_limit}
                          onChange={(e) => {
                            const value = Number(e.target.value) || 0;
                            setCategories((current) =>
                              current.map((c) =>
                                c.id === cat.id
                                  ? { ...c, monthly_limit: value }
                                  : c
                              )
                            );
                          }}
                          onBlur={(e) =>
                            updateLimit(
                              cat.id,
                              "monthly_limit",
                              Number(e.target.value) || 0
                            )
                          }
                          disabled={isSaving}
                          style={inlineInputStyle}
                        />
                      </td>

                      <td style={tdStyle}>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={cat.weekly_limit}
                          onChange={(e) => {
                            const value = Number(e.target.value) || 0;
                            setCategories((current) =>
                              current.map((c) =>
                                c.id === cat.id
                                  ? { ...c, weekly_limit: value }
                                  : c
                              )
                            );
                          }}
                          onBlur={(e) =>
                            updateLimit(
                              cat.id,
                              "weekly_limit",
                              Number(e.target.value) || 0
                            )
                          }
                          disabled={isSaving}
                          style={inlineInputStyle}
                        />
                      </td>

                      <td style={{ ...tdStyle, fontWeight: 600 }}>
                        {formatPrice(spent)}
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          fontWeight: 700,
                          color: isOver ? "#dc2626" : "#166534",
                        }}
                      >
                        {formatPrice(balance)}
                      </td>

                      <td style={tdStyle}>
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveCategory(cat.id, cat.name)
                          }
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
                      </td>
                    </tr>
                  );
                })}

                {/* TOTAL */}
                <tr
                  style={{
                    borderTop: "2px solid #e0e0dc",
                    background: "#f9f9f7",
                  }}
                >
                  <td style={{ ...tdStyle, fontWeight: 700 }}>TOTAL</td>
                  <td style={{ ...tdStyle, fontWeight: 700 }}>
                    {formatPrice(totalMonthly)}
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 700 }}>
                    {formatPrice(totalWeekly)}
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 700 }}>
                    {formatPrice(totalSpent)}
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      fontWeight: 700,
                      color:
                        totalMonthly - totalSpent < 0
                          ? "#dc2626"
                          : "#166534",
                    }}
                  >
                    {formatPrice(totalMonthly - totalSpent)}
                  </td>
                  <td style={tdStyle}></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* NOVA CATEGORIA */}
          <div style={{ marginTop: 20 }}>
            {!showNewCategory ? (
              <button
                type="button"
                onClick={() => setShowNewCategory(true)}
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
                ➕ Nova categoria
              </button>
            ) : (
              <div
                style={{
                  padding: 16,
                  background: "#fff",
                  border: "1px solid #e0e0dc",
                  borderRadius: 8,
                }}
              >
                <h3
                  style={{
                    margin: "0 0 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#2f2a26",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  ➕ Nova categoria
                </h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nome da categoria"
                    style={inputStyle}
                    autoFocus
                  />

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newMonthly}
                    onChange={(e) => setNewMonthly(e.target.value)}
                    placeholder="Teto mês (R$)"
                    style={inputStyle}
                  />

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newWeekly}
                    onChange={(e) => setNewWeekly(e.target.value)}
                    placeholder="Teto semana (R$)"
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={isCreating || !newName.trim()}
                    style={{
                      padding: "8px 16px",
                      background:
                        isCreating || !newName.trim()
                          ? "#a3a3a3"
                          : "#166534",
                      color: "#fff",
                      border: 0,
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor:
                        isCreating || !newName.trim()
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {isCreating ? "Criando..." : "Criar"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowNewCategory(false);
                      setNewName("");
                      setNewMonthly("");
                      setNewWeekly("");
                    }}
                    style={{
                      padding: "8px 16px",
                      background: "transparent",
                      color: "#7a7a72",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* HISTÓRICO DE DESPESAS DO MÊS */}
          <div style={{ marginTop: 32 }}>
            <h2
              style={{
                margin: "0 0 12px",
                fontSize: 14,
                fontWeight: 600,
                color: "#2f2a26",
              }}
            >
              📋 Despesas do mês ({expenses.length})
            </h2>

            {expenses.length === 0 ? (
              <div style={emptyStyle}>
                Nenhuma despesa lançada em {monthNames[month - 1]}/{year}.
              </div>
            ) : (
              <div style={tableWrapperStyle}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 13,
                  }}
                >
                  <thead>
                    <tr style={{ background: "#f9f9f7" }}>
                      <th style={thStyle}>Data</th>
                      <th style={thStyle}>Categoria</th>
                      <th style={thStyle}>Descrição</th>
                      <th style={thStyle}>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr
                        key={expense.id}
                        style={{ borderTop: "1px solid #f0f0ec" }}
                      >
                        <td style={{ ...tdStyle, color: "#7a7a72" }}>
                          {new Date(
                            expense.spent_at + "T12:00:00"
                          ).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 600,
                              background: "#dbeafe",
                              color: "#1e40af",
                            }}
                          >
                            {expense.category}
                          </span>
                        </td>
                        <td style={tdStyle}>{expense.description || "—"}</td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>
                          {formatPrice(expense.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
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
  width: "100%",
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

const inlineInputStyle: React.CSSProperties = {
  width: 100,
  height: 32,
  padding: "0 8px",
  border: "1px solid #d1d5db",
  borderRadius: 4,
  fontSize: 13,
  outline: "none",
  fontFamily: "inherit",
  background: "#fff",
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
  background: "#fff",
  border: "1px solid #e0e0dc",
  borderRadius: 8,
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