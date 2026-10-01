"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Senha incorreta.");
      }

      // Redireciona pro painel
      router.push("/admin/assinaturas");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Erro ao entrar.");
      setIsLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f4f4f2",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 360,
          padding: 32,
          background: "#fff",
          border: "1px solid #e0e0dc",
          borderRadius: 8,
        }}
      >
        <h1
          style={{
            margin: "0 0 8px",
            fontSize: 20,
            fontWeight: 600,
            color: "#2f2a26",
          }}
        >
          FLOWER — Caixa
        </h1>

        <p
          style={{
            margin: "0 0 24px",
            fontSize: 13,
            color: "#7a7a72",
          }}
        >
          Digite a senha para acessar.
        </p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          autoFocus
          style={{
            width: "100%",
            height: 44,
            padding: "0 14px",
            marginBottom: 12,
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontSize: 14,
            outline: "none",
            boxSizing: "border-box",
          }}
        />

        {error && (
          <p
            style={{
              margin: "0 0 12px",
              padding: "8px 12px",
              background: "#fef2f2",
              color: "#b91c1c",
              fontSize: 12,
              borderRadius: 6,
            }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading || !password}
          style={{
            width: "100%",
            height: 44,
            background: isLoading ? "#a3a3a3" : "#2f2a26",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
        >
          {isLoading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}