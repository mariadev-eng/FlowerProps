"use client";

import Link from "next/link";

export default function EncomendasPage() {
  const buques = [
    {
      id: "noiva",
      label: "01 — Noiva",
      name: "Buquês de Noiva",
      description:
        "Delicados, exclusivos e feitos pra durar pra sempre nas fotos e na memória.",
      longDescription:
        "Cada buquê de noiva é montado sob encomenda, com flores selecionadas especialmente pro seu grande dia. Escolhemos as tonalidades, o formato e cada detalhe pra combinar com o seu estilo e com a sua história.",
      image:
        "https://stqpsaaxejtjhkbyapys.supabase.co/storage/v1/object/public/banners/buque-noiva.jpeg",
      objectPosition: "center 65%",
      whatsappMsg:
        "Olá! Vim pelo site e gostaria de saber mais sobre os Buquês de Noiva. Pode me contar mais detalhes sobre valores, tamanhos, prazos e como funciona a encomenda?",
    },
  ];

  return (
    <main>
      <header className="site-header">
        <div className="header-content">
          <Link href="/" className="brand" aria-label="FLOWER">
            <img
              src="/images/logoflowerprops.png"
              alt="FLOWER"
              className="brand-logo"
            />
          </Link>

          <nav className="desktop-nav">
            <Link href="/">Início</Link>
            <Link href="/encomendas">Encomendas</Link>
            <Link href="/#categorias">Categorias</Link>
            <Link href="/#assinaturas">Assinaturas</Link>
            <Link href="/#sobre">Sobre nós</Link>
          </nav>

          <div className="header-actions">
            <Link href="/" aria-label="Voltar">
              ←
            </Link>
          </div>
        </div>
      </header>

      <section className="encomendas-hero">
        <div className="encomendas-hero-content">
          <span className="eyebrow">SOB ENCOMENDA</span>
          <h1>
            Feitos
            <br />
            <em>exclusivamente pra você.</em>
          </h1>
          <p>
            Buquês de noiva e buquês gigantes produzidos um a um,
            com flores frescas, escolhidas a dedo, e uma composição
            única. Cada detalhe pensado pra tornar o seu momento
            inesquecível.
          </p>
        </div>
      </section>

      <section className="encomendas-lista">
        {buques.map((buque, index) => (
          <div
            key={buque.id}
            className={`encomenda-bloco ${
              index % 2 === 1 ? "encomenda-bloco-reverse" : ""
            }`}
          >
            <div className="encomenda-bloco-image">
              <img
                src={buque.image}
                alt={buque.name}
                style={{
                  objectPosition:
                    (buque as any).objectPosition || "center center",
                }}
              />
            </div>

            <div className="encomenda-bloco-content">
              <span className="encomenda-bloco-label">{buque.label}</span>
              <h2>{buque.name}</h2>
              <p className="encomenda-bloco-short">{buque.description}</p>
              <p className="encomenda-bloco-long">{buque.longDescription}</p>

              <a
                href={`https://wa.me/5522992298475?text=${encodeURIComponent(
                  buque.whatsappMsg
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="encomenda-bloco-btn"
              >
                <span>Falar no WhatsApp</span>
                <span className="encomenda-bloco-btn-arrow">→</span>
              </a>
            </div>
          </div>
        ))}
      </section>

      <section className="encomendas-nota">
        <div className="encomendas-nota-inner">
          <span className="eyebrow">IMPORTANTE</span>
          <h3>
            Todas as encomendas são feitas
            <br />
            <em>com antecedência.</em>
          </h3>
          <p>
            Como cada buquê é montado sob encomenda, com flores frescas
            selecionadas especialmente pra você, pedimos que o pedido
            seja feito com pelo menos 3 dias de antecedência.
            Pra buquês de noiva e datas especiais, recomendamos
            entrar em contato com antecedência maior.
          </p>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-brand">
          <img
            src="/images/logoflowerprops.png"
            alt="FLOWER"
            className="footer-logo"
          />
        </div>

        <div className="footer-links">
          <a
            href="https://instagram.com/_flowerprops_"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram
          </a>

          <a
            href="https://wa.me/5522992298475"
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp
          </a>

          <a href="#">Contato</a>
          <a href="#">Política de privacidade</a>
        </div>

        <p>© 2026 FLOWER. Todos os direitos reservados.</p>
      </footer>
    </main>
  );
}