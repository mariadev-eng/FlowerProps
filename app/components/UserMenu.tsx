"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Package, Calendar, User, LogOut, UserRound } from "lucide-react";
import { useUser } from "@/hooks/useUser";

export default function UserMenu() {
  const router = useRouter();
  const { user, loading, signOut } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fecha o menu quando clica fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  async function handleSignOut() {
    await signOut();
    setIsOpen(false);
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <div
        style={{
          width: 42,
          height: 42,
          display: "grid",
          placeItems: "center",
          color: "#3f493b",
        }}
      >
        <UserRound size={20} strokeWidth={1.5} />
      </div>
    );
  }

  // Não logado → botão padrão
  if (!user) {
    return (
      <button
        type="button"
        aria-label="Minha conta"
        onClick={() => router.push("/conta")}
        style={{
          width: 42,
          height: 42,
          display: "grid",
          placeItems: "center",
          padding: 0,
          borderRadius: "50%",
          background: "transparent",
          color: "#3f493b",
          border: 0,
          cursor: "pointer",
          transition: "background 0.25s ease",
        }}
      >
        <UserRound size={20} strokeWidth={1.5} />
      </button>
    );
  }

  // Logado → mostra nome + dropdown
  const firstName = user.user_metadata?.name?.split(" ")[0] || "flor";

  return (
    <div
      ref={menuRef}
      style={{ position: "relative" }}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        aria-label="Menu do usuário"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 14px",
          background: "transparent",
          color: "#3f493b",
          border: 0,
          borderRadius: 6,
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.05em",
          transition: "background 0.2s",
        }}
      >
        <span
          style={{
            display: "grid",
            placeItems: "center",
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "#3f493b",
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            fontFamily: "var(--sans)",
          }}
        >
          {firstName.charAt(0).toUpperCase()}
        </span>
        Olá, {firstName}
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: 4,
            minWidth: 220,
            background: "#fff",
            border: "1px solid #e0e0dc",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            overflow: "hidden",
            zIndex: 100,
          }}
        >
          <MenuItem
            href="/conta/favoritos"
            icon={<Heart size={16} strokeWidth={1.5} />}
            label="Favoritos"
            onClick={() => setIsOpen(false)}
          />
          <MenuItem
            href="/conta/pedidos"
            icon={<Package size={16} strokeWidth={1.5} />}
            label="Meus pedidos"
            onClick={() => setIsOpen(false)}
          />
          <MenuItem
            href="/conta/assinaturas"
            icon={<Calendar size={16} strokeWidth={1.5} />}
            label="Minhas assinaturas"
            onClick={() => setIsOpen(false)}
          />
          <MenuItem
            href="/conta"
            icon={<User size={16} strokeWidth={1.5} />}
            label="Minha conta"
            onClick={() => setIsOpen(false)}
          />

          <div
            style={{
              borderTop: "1px solid #e0e0dc",
              marginTop: 4,
            }}
          />

          <button
            type="button"
            onClick={handleSignOut}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              width: "100%",
              padding: "12px 16px",
              background: "transparent",
              border: 0,
              color: "#991b1b",
              fontSize: 13,
              textAlign: "left",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fef2f2";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <LogOut size={16} strokeWidth={1.5} />
            Sair
          </button>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        color: "#2f2a26",
        fontSize: 13,
        textDecoration: "none",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#f9f9f7";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {icon}
      {label}
    </Link>
  );
}