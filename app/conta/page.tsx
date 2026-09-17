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
  const { user, signOut } = useUser();

  const [mode, setMode] = useState<Mode>("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  // Se já estiver logado, redireciona pra home
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/");
      }
    });
  }, [router]);

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
      router.push("/");
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

    // Se o Supabase exigir confirmação de e-mail, não terá session
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
      router.push("/");
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

      {user && (
        <div className="account-logged">
          <p>
            Você está logado como <strong>{user.email}</strong>
          </p>
          <button
            type="button"
            className="account-submit"
            onClick={handleSignOut}
          >
            Sair da conta
            <span>→</span>
          </button>
        </div>
      )}
    </main>
  );
}