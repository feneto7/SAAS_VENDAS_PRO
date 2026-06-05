"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { AuthButtons } from "@/components/AuthButtons";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import Link from "next/link";
import { Zap, LogOut, ShieldCheck, Sparkles, Check, ArrowRight } from "lucide-react";

export default function HomePage() {
  const { user, logout } = useAuth();
  const { step } = useOnboardingStatus();
  const userId = user?.id;

  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  return (
    <div
      className="nm-page"
      style={{
        position: "relative",
        minHeight: "100dvh",
        width: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ───── Glow Orbs Decorativos ───── */}
      <div
        className="nm-glow-orb"
        style={{
          top: "-15%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "70%",
          height: "500px",
          background: "var(--nm-accent-glow)",
        }}
      />
      <div
        className="nm-glow-orb"
        style={{
          bottom: "-10%",
          right: "-10%",
          width: "450px",
          height: "450px",
          background: "rgba(116, 185, 255, 0.12)",
          filter: "blur(100px)",
        }}
      />

      {/* ───── Cabeçalho / Navegação ───── */}
      <nav
        style={{
          position: "relative",
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          maxWidth: "1280px",
          marginLeft: "auto",
          marginRight: "auto",
          padding: "2rem clamp(1.5rem, 4vw, 3rem)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            className="nm-surface"
            style={{
              width: "48px",
              height: "48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "1rem",
            }}
          >
            <Zap
              style={{
                color: "var(--nm-accent)",
                width: "28px",
                height: "28px",
                animation: "nm-orb-pulse 3s ease-in-out infinite",
              }}
            />
          </div>
          <span
            style={{
              fontSize: "clamp(1.25rem, 2vw, 1.5rem)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              fontStyle: "italic",
              textTransform: "uppercase",
              background: "linear-gradient(to right, var(--nm-text-primary), var(--nm-text-secondary))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Vendas<span style={{ WebkitTextFillColor: "var(--nm-accent)" }}>Pro</span>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {!userId ? (
            <AuthButtons
              onSignInClick={() => setShowSignIn(true)}
              onSignUpClick={() => setShowSignUp(true)}
            />
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <Link
                href="/dashboard"
                className="nm-btn nm-btn--sm nm-btn--accent"
                style={{ fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.7rem" }}
              >
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="nm-btn nm-btn--sm nm-btn--flat"
                style={{
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontSize: "0.7rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  color: "var(--nm-text-secondary)",
                }}
              >
                <LogOut size={14} />
                Sair
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ───── Hero Section ───── */}
      <main
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: "1280px",
          marginLeft: "auto",
          marginRight: "auto",
          padding: "3rem clamp(1.5rem, 4vw, 3rem)",
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "3rem",
          alignItems: "center",
        }}
      >
        {/* Container responsivo: em telas grandes, 2 colunas */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
            gap: "3rem",
            alignItems: "center",
            width: "100%",
          }}
        >
          {/* ── Lado Esquerdo: Texto + CTAs ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.625rem",
                padding: "0.5rem 1rem",
                borderRadius: "9999px",
                background: "var(--nm-surface-deep)",
                border: "1px solid var(--nm-border)",
                color: "var(--nm-accent)",
                fontSize: "0.625rem",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                boxShadow: "var(--nm-shadow-inset)",
                width: "fit-content",
              }}
            >
              <span style={{ position: "relative", display: "flex", width: "8px", height: "8px" }}>
                <span
                  style={{
                    position: "absolute",
                    display: "inline-flex",
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    background: "var(--nm-accent)",
                    opacity: 0.75,
                    animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
                  }}
                />
                <span
                  style={{
                    position: "relative",
                    display: "inline-flex",
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "var(--nm-accent)",
                  }}
                />
              </span>
              Sistema Corporativo de Elite
            </div>

            {/* Título */}
            <h1
              style={{
                fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
                fontWeight: 900,
                lineHeight: 0.95,
                letterSpacing: "-0.03em",
                fontStyle: "italic",
                background: "linear-gradient(to bottom, var(--nm-text-primary) 40%, var(--nm-text-muted))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                margin: 0,
              }}
            >
              A Próxima Geração de{" "}
              <span
                style={{
                  WebkitTextFillColor: "var(--nm-text-primary)",
                  fontStyle: "normal",
                  letterSpacing: "normal",
                  display: "block",
                }}
              >
                Inteligência Comercial.
              </span>
            </h1>

            {/* Subtítulo */}
            <p
              style={{
                fontSize: "clamp(0.95rem, 1.5vw, 1.125rem)",
                color: "var(--nm-text-secondary)",
                fontWeight: 500,
                lineHeight: 1.7,
                maxWidth: "540px",
                margin: 0,
              }}
            >
              O ERP móvel e local-first mais completo do mercado. Desenvolvido sob medida para faturamento de alta
              performance, roteirização inteligente e sincronismo invisível de dados.
            </p>

            {/* ── Cards de Features ── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: "1rem",
                width: "100%",
              }}
            >
              {[
                {
                  icon: <ShieldCheck size={16} />,
                  title: "Local-First",
                  desc: "Funciona sem internet, salvando no SQLite e sincronizando em segundo plano.",
                },
                {
                  icon: <Sparkles size={16} />,
                  title: "Roteirização",
                  desc: "Logística automatizada e planejamento estratégico de visitas dinâmicas.",
                },
                {
                  icon: <Check size={16} />,
                  title: "Tempo Real",
                  desc: "Dashboards interativos, faturamento rápido e fluxo de caixa blindado.",
                },
              ].map((feat) => (
                <div
                  key={feat.title}
                  className="nm-surface"
                  style={{
                    padding: "1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.625rem",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "0.75rem",
                      background: "var(--nm-surface-deep)",
                      border: "1px solid var(--nm-border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--nm-accent)",
                      boxShadow: "var(--nm-shadow-inset)",
                    }}
                  >
                    {feat.icon}
                  </div>
                  <h3
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "var(--nm-text-primary)",
                      margin: 0,
                    }}
                  >
                    {feat.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 500,
                      color: "var(--nm-text-secondary)",
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    {feat.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* ── Botões CTA ── */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "1rem",
                marginTop: "0.5rem",
              }}
            >
              <button
                onClick={() => setShowSignUp(true)}
                className="nm-btn nm-btn--accent"
                style={{
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontSize: "0.75rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  height: "56px",
                  padding: "0 2rem",
                  borderRadius: "0.875rem",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
              >
                Criar Conta Grátis
                <ArrowRight size={16} />
              </button>

              <a
                href="https://wa.me/5548999999999?text=Olá!%20Gostaria%20de%20solicitar%20uma%20apresentação%20profissional%20do%20sistema%20VendasPro."
                target="_blank"
                rel="noopener noreferrer"
                className="nm-btn"
                style={{
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontSize: "0.75rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  height: "56px",
                  padding: "0 2rem",
                  borderRadius: "0.875rem",
                  background: "linear-gradient(135deg, #059669, #047857)",
                  color: "#ffffff",
                  borderColor: "transparent",
                  boxShadow:
                    "var(--nm-shadow-distance) var(--nm-shadow-distance) var(--nm-shadow-blur) var(--nm-shadow-dark), calc(-1 * var(--nm-shadow-distance)) calc(-1 * var(--nm-shadow-distance)) var(--nm-shadow-blur) var(--nm-shadow-light), 0 4px 20px rgba(5, 150, 105, 0.25)",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
              >
                <svg className="fill-current" style={{ width: "20px", height: "20px" }} viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.725 1.451 5.46.002 9.9-4.437 9.902-9.899.002-2.646-1.02-5.133-2.877-6.99C16.543 1.848 14.06 1.825 11.418 1.825c-5.462 0-9.904 4.44-9.906 9.892-.001 1.708.452 3.3 1.311 4.788L1.651 22.31l4.996-1.31zM17.15 13.9c-.282-.141-1.666-.822-1.924-.916-.257-.095-.445-.141-.632.141-.188.282-.727.916-.892 1.101-.164.185-.328.21-.61.07-.282-.141-1.19-.439-2.267-1.4c-.838-.748-1.405-1.671-1.57-1.953-.164-.282-.018-.434.123-.574.127-.127.282-.328.423-.492.141-.164.188-.282.282-.47.094-.188.047-.352-.023-.493-.07-.141-.632-1.524-.866-2.087-.228-.548-.46-.474-.632-.483-.164-.008-.352-.01-.54-.01-.188 0-.492.07-.75.352-.257.282-.984.962-.984 2.345 0 1.382 1.008 2.72 1.148 2.91.141.188 1.984 3.03 4.81 4.249.672.291 1.2.464 1.61.595.676.215 1.291.185 1.777.113.541-.08 1.666-.68 1.9-.1.233-.55.233-1.02.163-1.101-.07-.08-.258-.127-.54-.268z" />
                </svg>
                Agendar Apresentação
              </a>
            </div>
          </div>

          {/* ── Lado Direito: Mockup do Dashboard ── */}
          <div
            style={{
              position: "relative",
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Glow atrás do mockup */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "var(--nm-accent-glow)",
                filter: "blur(120px)",
                borderRadius: "50%",
                transform: "translate(8px, 8px)",
                opacity: 0.25,
                pointerEvents: "none",
              }}
            />

            {/* Mockup Container */}
            <div
              className="nm-surface"
              style={{
                width: "100%",
                maxWidth: "440px",
                borderRadius: "2rem",
                padding: "6px",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: "100%",
                  borderRadius: "1.75rem",
                  background: "var(--nm-surface-deep)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Top Bar (macOS style) */}
                <div
                  style={{
                    height: "48px",
                    borderBottom: "1px solid var(--nm-border)",
                    background: "var(--nm-surface-deep)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 1.5rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--nm-danger)", opacity: 0.8 }} />
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--nm-warning)", opacity: 0.8 }} />
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--nm-success)", opacity: 0.8 }} />
                  </div>
                  <span
                    className="nm-badge nm-badge--accent nm-badge--sm"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      fontWeight: 900,
                      fontSize: "0.5625rem",
                      padding: "0.25rem 0.75rem",
                    }}
                  >
                    <span style={{ position: "relative", display: "flex", width: "6px", height: "6px" }}>
                      <span
                        style={{
                          position: "absolute",
                          display: "inline-flex",
                          width: "100%",
                          height: "100%",
                          borderRadius: "50%",
                          background: "var(--nm-accent)",
                          opacity: 0.75,
                          animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
                        }}
                      />
                      <span
                        style={{
                          position: "relative",
                          display: "inline-flex",
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "var(--nm-accent)",
                        }}
                      />
                    </span>
                    Offline Active
                  </span>
                </div>

                {/* Dashboard Content */}
                <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: "0.5625rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.25em", color: "var(--nm-text-muted)" }}>
                        Visão Consolidada
                      </span>
                      <div style={{ marginTop: "0.375rem", height: "20px", width: "128px", background: "var(--nm-surface)", border: "1px solid var(--nm-border)", borderRadius: "9999px", boxShadow: "var(--nm-shadow-inset)" }} />
                    </div>
                    <div style={{ height: "24px", width: "64px", background: "var(--nm-surface)", border: "1px solid var(--nm-border)", borderRadius: "0.375rem", boxShadow: "var(--nm-shadow-raised)" }} />
                  </div>

                  {/* Metrics 2-column */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div
                      className="nm-surface"
                      style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}
                    >
                      <span style={{ fontSize: "0.5625rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--nm-text-secondary)" }}>
                        Vendas de Hoje
                      </span>
                      <span style={{ fontSize: "1.125rem", fontWeight: 900, color: "var(--nm-text-primary)" }}>
                        R$ 14.850,00
                      </span>
                      <div
                        style={{
                          height: "8px",
                          width: "100%",
                          background: "var(--nm-surface-deep)",
                          border: "1px solid var(--nm-border)",
                          borderRadius: "9999px",
                          overflow: "hidden",
                          boxShadow: "var(--nm-shadow-inset)",
                          marginTop: "0.25rem",
                        }}
                      >
                        <div style={{ height: "100%", width: "70%", background: "var(--nm-accent)", borderRadius: "9999px" }} />
                      </div>
                    </div>

                    <div
                      className="nm-surface--inset"
                      style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}
                    >
                      <span style={{ fontSize: "0.5625rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--nm-text-secondary)" }}>
                        Sincronismo
                      </span>
                      <span style={{ fontSize: "1.125rem", fontWeight: 900, color: "var(--nm-accent)" }}>
                        100% OK
                      </span>
                      <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "20px", marginTop: "0.25rem" }}>
                        {[30, 45, 60, 35, 80, 100].map((h, i) => (
                          <div key={i} style={{ flex: 1, borderRadius: "2px 2px 0 0", background: "var(--nm-accent)", height: `${h}%`, opacity: 0.65 }} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Rota Status */}
                  <div
                    className="nm-surface"
                    style={{
                      padding: "1.25rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "0.75rem",
                          background: "var(--nm-surface-deep)",
                          border: "1px solid var(--nm-border)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "var(--nm-shadow-inset)",
                        }}
                      >
                        <Zap style={{ width: "20px", height: "20px", color: "var(--nm-accent)" }} />
                      </div>
                      <div>
                        <span style={{ fontSize: "0.5625rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--nm-text-secondary)", display: "block" }}>
                          Próximo Ponto
                        </span>
                        <div style={{ marginTop: "0.25rem", height: "14px", width: "96px", background: "var(--nm-surface-deep)", border: "1px solid var(--nm-border)", borderRadius: "9999px", boxShadow: "var(--nm-shadow-inset)" }} />
                      </div>
                    </div>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "var(--nm-surface-deep)",
                        border: "1px solid var(--nm-border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "var(--nm-shadow-inset)",
                      }}
                    >
                      <ArrowRight size={14} style={{ color: "var(--nm-accent)" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ───── Rodapé ───── */}
      <footer
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          padding: "2rem 0",
          borderTop: "1px solid var(--nm-border)",
          background: "var(--nm-surface-deep)",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "1280px",
            marginLeft: "auto",
            marginRight: "auto",
            padding: "0 clamp(1.5rem, 4vw, 3rem)",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1.5rem",
          }}
        >
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            {["Política de Privacidade", "Termos de Uso", "Suporte"].map((label) => (
              <Link
                key={label}
                href="#"
                style={{
                  fontSize: "0.625rem",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: "var(--nm-text-secondary)",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
              >
                {label}
              </Link>
            ))}
          </div>

          <p style={{ fontSize: "0.625rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--nm-text-muted)", margin: 0 }}>
            © 2026 VendasPro. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* ───── Modais de Autenticação ───── */}
      {showSignIn && (
        <SignInForm
          onClose={() => setShowSignIn(false)}
          onSignUpClick={() => {
            setShowSignIn(false);
            setShowSignUp(true);
          }}
        />
      )}

      {showSignUp && (
        <SignUpForm
          onClose={() => setShowSignUp(false)}
          onSignInClick={() => {
            setShowSignUp(false);
            setShowSignIn(true);
          }}
        />
      )}
    </div>
  );
}
