"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";

type Mode = "login" | "register";

function translateAuthError(message: string): string {
  const msg = message.toLowerCase();

  if (msg.includes("already registered") || msg.includes("already been registered"))
    return "Este e-mail já está cadastrado. Tente fazer login.";
  if (msg.includes("password should be at least"))
    return "A senha precisa ter pelo menos 6 caracteres.";
  if (msg.includes("invalid login credentials"))
    return "E-mail ou senha incorretos. Verifique seus dados.";
  if (msg.includes("email not confirmed"))
    return "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.";
  if (msg.includes("invalid email"))
    return "Informe um e-mail válido.";
  if (msg.includes("rate limit") || msg.includes("too many"))
    return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  if (msg.includes("network") || msg.includes("fetch"))
    return "Falha de conexão. Verifique sua internet e tente novamente.";

  return "Algo deu errado. Tente novamente em instantes.";
}

export default function AccountPage() {
  const router = useRouter();
  const { user, loading: loadingUser, signOut } = useUser();
  const [mode, setMode] = useState<Mode>("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  function clearMessages() {
    setMessage("");
    setMessageType("");
  }

  function changeMode(newMode: Mode) {
    setMode(newMode);
    clearMessages();
    setPassword("");
    setConfirmPassword("");
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    if (!email.trim()) {
      setMessage("Informe seu e-mail.");
      setMessageType("error");
      return;
    }

    if (!password) {
      setMessage("Informe sua senha.");
      setMessageType("error");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(translateAuthError(error.message));
      setMessageType("error");
      return;
    }

    setMessage("Login realizado! Redirecionando...");
    setMessageType("success");

    setTimeout(() => {
      router.push("/conta");
      router.refresh();
    }, 600);
  }

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    if (!name.trim()) {
      setMessage("Informe seu nome.");
      setMessageType("error");
      return;
    }

    if (!email.trim()) {
      setMessage("Informe seu e-mail.");
      setMessageType("error");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setMessage("Informe um e-mail válido.");
      setMessageType("error");
      return;
    }

    if (!password) {
      setMessage("Crie uma senha.");
      setMessageType("error");
      return;
    }

    if (password.length < 6) {
      setMessage("A senha precisa ter pelo menos 6 caracteres.");
      setMessageType("error");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("As senhas não coincidem.");
      setMessageType("error");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name: name.trim(),
        },
        emailRedirectTo: `${window.location.origin}/conta`,
      },
    });

    setLoading(false);

    if (error) {
      setMessage(translateAuthError(error.message));
      setMessageType("error");
      return;
    }

    if (!data.session) {
      setMessage(
        "Conta criada! Verifique seu e-mail para confirmar o cadastro."
      );
      setMessageType("success");
      setPassword("");
      setConfirmPassword("");
      return;
    }

    setMessage("Conta criada com sucesso! Bem-vindo à FLOWER.");
    setMessageType("success");

    setTimeout(() => {
      router.push("/conta");
      router.refresh();
    }, 1000);
  }

  async function handleForgotPassword() {
    clearMessages();

    if (!email.trim()) {
      setMessage("Digite seu e-mail acima para recuperar a senha.");
      setMessageType("error");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/conta`,
      }
    );

    setLoading(false);

    if (error) {
      setMessage(translateAuthError(error.message));
      setMessageType("error");
      return;
    }

    setMessage(
      "Enviamos um link de recuperação para seu e-mail. Verifique sua caixa de entrada."
    );
    setMessageType("success");
  }

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  // ==========================================
  // LOADING (aguarda o useUser carregar)
  // ==========================================

  if (loadingUser) {
    return (
      <main className="account-page">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            color: "#7a7a72",
            fontSize: 13,
          }}
        >
          Carregando...
        </div>
      </main>
    );
  }

  // ==========================================
  // JÁ LOGADO → MOSTRA PAINEL DA CONTA
  // ==========================================

  if (user) {
    return (
      <main className="account-page">
        <header className="account-header">
          <Link href="/" className="account-logo" aria-label="FLOWER">
            FLOWER
          </Link>

          <button
            type="button"
            className="account-back"
            onClick={handleSignOut}
            style={{
              background: "transparent",
              border: 0,
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#68735a",
            }}
          >
            Sair
          </button>
        </header>

        <div
          className="account-container"
          style={{ gridTemplateColumns: "1fr", maxWidth: 720 }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 24,
              padding: "40px 0",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <span className="eyebrow">MINHA CONTA</span>
              <h1
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: "clamp(36px, 5vw, 56px)",
                  fontWeight: 500,
                  margin: "12px 0 8px",
                  color: "#3f493b",
                  lineHeight: 1,
                }}
              >
                Olá, {user.user_metadata?.name?.split(" ")[0] || "flor"}.
              </h1>
              <p
                style={{
                  color: "#7a7a72",
                  fontSize: 13,
                  margin: 0,
                }}
              >
                {user.email}
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 16,
                marginTop: 24,
              }}
            >
              <Link
                href="/conta/pedidos"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  padding: 24,
                  background: "#fff",
                  border: "1px solid #e0e0dc",
                  borderRadius: 8,
                  textDecoration: "none",
                  color: "inherit",
                  transition: "all 0.2s",
                }}
              >
                <span style={{ fontSize: 24 }}>📦</span>
                <strong
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: 22,
                    fontWeight: 500,
                    color: "#3f493b",
                  }}
                >
                  Meus pedidos
                </strong>
                <span
                  style={{
                    fontSize: 12,
                    color: "#7a7a72",
                    lineHeight: 1.6,
                  }}
                >
                  Veja o histórico das suas compras e o status de cada pedido.
                </span>
              </Link>

              <Link
                href="/conta/assinaturas"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  padding: 24,
                  background: "#fff",
                  border: "1px solid #e0e0dc",
                  borderRadius: 8,
                  textDecoration: "none",
                  color: "inherit",
                  transition: "all 0.2s",
                }}
              >
                <span style={{ fontSize: 24 }}>📅</span>
                <strong
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: 22,
                    fontWeight: 500,
                    color: "#3f493b",
                  }}
                >
                  Minhas assinaturas
                </strong>
                <span
                  style={{
                    fontSize: 12,
                    color: "#7a7a72",
                    lineHeight: 1.6,
                  }}
                >
                  Acompanhe suas assinaturas e renove quando quiser.
                </span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================
  // NÃO LOGADO → MOSTRA LOGIN / CADASTRO
  // ==========================================

  return (
    <main className="account-page">
      <header className="account-header">
        <Link href="/" className="account-logo" aria-label="Voltar para a FLOWER">
          FLOWER
        </Link>

        <Link href="/" className="account-back">
          ← Voltar ao ateliê
        </Link>
      </header>

      <div className="account-container">
        <div className="account-card">
          <div className="account-intro">
            <span className="eyebrow">
              {mode === "login" ? "BEM-VINDA À FLOWER" : "FAÇA PARTE DA FLOWER"}
            </span>

            <h1>
              {mode === "login" ? (
                <>
                  Entre na sua
                  <br />
                  <em>conta.</em>
                </>
              ) : (
                <>
                  Crie sua
                  <br />
                  <em>conta.</em>
                </>
              )}
            </h1>

            <p>
              {mode === "login"
                ? "Acesse seus pedidos e acompanhe sua experiência com a FLOWER."
                : "Crie sua conta para acompanhar pedidos e tornar suas próximas compras ainda mais práticas."}
            </p>
          </div>

          <div className="account-tabs">
            <button
              type="button"
              className={mode === "login" ? "account-tab active" : "account-tab"}
              onClick={() => changeMode("login")}
            >
              Entrar
            </button>

            <button
              type="button"
              className={mode === "register" ? "account-tab active" : "account-tab"}
              onClick={() => changeMode("register")}
            >
              Criar conta
            </button>
          </div>

          <form
            className="account-form"
            onSubmit={mode === "login" ? handleLogin : handleRegister}
          >
            {mode === "register" && (
              <label>
                Nome completo
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Digite seu nome"
                  autoComplete="name"
                  disabled={loading}
                />
              </label>
            )}

            <label>
              E-mail
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@email.com"
                autoComplete="email"
                disabled={loading}
              />
            </label>

            <label>
              Senha
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                disabled={loading}
              />
            </label>

            {mode === "register" && (
              <label>
                Confirmar senha
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digite a senha novamente"
                  autoComplete="new-password"
                  disabled={loading}
                />
              </label>
            )}

            {message && (
              <div
                className={`account-message ${
                  messageType === "error" ? "error" : "success"
                }`}
              >
                {message}
              </div>
            )}

            <button type="submit" className="account-submit" disabled={loading}>
              {loading
                ? "Aguarde..."
                : mode === "login"
                ? "Entrar na minha conta"
                : "Criar minha conta"}
              <span>→</span>
            </button>
          </form>

          {mode === "login" && (
            <button
              type="button"
              className="account-forgot"
              onClick={handleForgotPassword}
              disabled={loading}
            >
              Esqueci minha senha
            </button>
          )}

          <div className="account-footer">
            <span>
              {mode === "login"
                ? "Ainda não possui uma conta?"
                : "Já possui uma conta?"}
            </span>

            <button
              type="button"
              onClick={() => changeMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Criar minha conta" : "Entrar"}
            </button>
          </div>
        </div>

        <div className="account-side">
          <span className="eyebrow">FLOWER</span>

          <h2>
            Flores que
            <br />
            <em>contam histórias.</em>
          </h2>

          <p>Sua experiência FLOWER começa aqui.</p>
        </div>
      </div>
    </main>
  );
}