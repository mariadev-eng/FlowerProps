"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const TABS = [
  { href: "/admin/assinaturas", label: "Assinaturas" },
  { href: "/admin/produtos", label: "Produtos" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Se for a tela de login, não mostra o layout de abas
  if (pathname.startsWith("/admin/login")) {
    return <>{children}</>;
  }

  async function handleLogout() {
    document.cookie =
      "flower-admin-auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f4f2",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 56,
          padding: "0 24px",
          background: "#2f2a26",
          color: "#fff",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 32,
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.1em",
            }}
          >
            FLOWER CAIXA
          </span>

          <nav style={{ display: "flex", gap: 4 }}>
            {TABS.map((tab) => {
              const isActive = pathname.startsWith(tab.href);

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  style={{
                    padding: "8px 16px",
                    fontSize: 13,
                    fontWeight: 500,
                    color: isActive ? "#2f2a26" : "#d1d1cd",
                    background: isActive ? "#fff" : "transparent",
                    borderRadius: 4,
                    textDecoration: "none",
                    transition: "all 0.15s",
                  }}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          style={{
            padding: "6px 12px",
            background: "transparent",
            color: "#d1d1cd",
            border: "1px solid #4a4440",
            borderRadius: 4,
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Sair
        </button>
      </header>

      {/* CONTEÚDO */}
      <main style={{ padding: 24 }}>{children}</main>
    </div>
  );
}