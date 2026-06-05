"use client";

import { useState } from "react";
import { ThemeToggle } from "@/styles/ThemeToggle";
import { useTheme } from "@/styles/ThemeProvider";
import {
  Zap, Music, MapPin, Play, Pause, SkipBack, SkipForward,
  Power, Heart, Star, Lock, User, Search, RefreshCw, Shuffle,
  Plus, X, Square, ShieldCheck, Volume2, VolumeX, Settings,
  Bell, Home, BarChart3, Users, Package, ChevronRight, LogOut,
} from "lucide-react";

export default function DesignSystemPage() {
  const { isDark } = useTheme();

  const [switchOn, setSwitchOn] = useState(true);
  const [switchOn2, setSwitchOn2] = useState(false);
  const [sliderVal, setSliderVal] = useState(65);
  const [activeTab, setActiveTab] = useState("buttons");
  const [activeKnob, setActiveKnob] = useState<number | null>(2);
  const [activeToggleGroup, setActiveToggleGroup] = useState("light");

  const tabs = [
    { id: "buttons",   label: "Botões" },
    { id: "cards",     label: "Cards" },
    { id: "inputs",    label: "Inputs" },
    { id: "badges",    label: "Badges" },
    { id: "toggles",   label: "Toggles" },
    { id: "circles",   label: "Círculos" },
    { id: "table",     label: "Tabela" },
    { id: "sidebar",   label: "Sidebar" },
  ];

  return (
    <div className="nm-page" style={{ minHeight: "100dvh", padding: "2rem" }}>

      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "2.5rem",
      }}>
        <div>
          <div className="nm-label" style={{ marginBottom: "0.4rem" }}>Design System</div>
          <h1 className="nm-display" style={{ fontSize: "var(--nm-text-4xl)" }}>
            Neumorphic{" "}
            <span className="nm-text-gradient">UI Kit</span>
          </h1>
          <p className="nm-caption" style={{ marginTop: "0.4rem" }}>
            Double-Shot Lighting · Light & Dark themes · VendasPro
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span className="nm-badge nm-badge--accent">
            <span className="nm-badge__dot nm-badge__dot--pulse" />
            {isDark ? "Dark Mode" : "Light Mode"}
          </span>
          <ThemeToggle size="lg" />
        </div>
      </div>

      {/* Tab Nav */}
      <div className="nm-toggle-group" style={{ marginBottom: "2rem", maxWidth: "680px" }}>
        {tabs.map(t => (
          <button
            key={t.id}
            className={`nm-toggle-group__item${activeTab === t.id ? " nm-toggle-group__item--active" : ""}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── BOTÕES ──────────────────────────────── */}
      {activeTab === "buttons" && (
        <div className="nm-flex-col nm-gap-xl">
          <section>
            <div className="nm-label" style={{ marginBottom: "1rem" }}>Botões — Variantes</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
              <button className="nm-btn">Default</button>
              <button className="nm-btn nm-btn--accent">Accent</button>
              <button className="nm-btn nm-btn--glow">Glow</button>
              <button className="nm-btn nm-btn--inset">Inset</button>
              <button className="nm-btn nm-btn--ghost">Ghost</button>
              <button className="nm-btn nm-btn--flat">Flat</button>
              <button className="nm-btn nm-btn--danger">Danger</button>
              <button className="nm-btn" disabled>Disabled</button>
            </div>
          </section>

          <section>
            <div className="nm-label" style={{ marginBottom: "1rem" }}>Botões — Tamanhos</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
              <button className="nm-btn nm-btn--xs nm-btn--accent">XS</button>
              <button className="nm-btn nm-btn--sm nm-btn--accent">Pequeno</button>
              <button className="nm-btn nm-btn--accent">Médio</button>
              <button className="nm-btn nm-btn--lg nm-btn--accent">Grande</button>
              <button className="nm-btn nm-btn--xl nm-btn--accent">Extra Grande</button>
            </div>
          </section>

          <section>
            <div className="nm-label" style={{ marginBottom: "1rem" }}>Botões Circulares</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
              <button className="nm-btn nm-btn--circle nm-btn--sm"><SkipBack size={14} /></button>
              <button className="nm-btn nm-btn--circle"><Play size={18} /></button>
              <button className="nm-btn nm-btn--circle nm-btn--accent nm-btn--lg"><Pause size={22} /></button>
              <button className="nm-btn nm-btn--circle nm-btn--glow nm-btn--xl"><Zap size={26} /></button>
              <button className="nm-btn nm-btn--circle"><SkipForward size={18} /></button>
              <button className="nm-btn nm-btn--circle nm-btn--danger"><Power size={18} /></button>
            </div>
          </section>

          <section>
            <div className="nm-label" style={{ marginBottom: "1rem" }}>Grupo de Botões</div>
            <div className="nm-btn-group">
              <button className="nm-btn nm-btn--sm">Dia</button>
              <button className="nm-btn nm-btn--sm nm-btn--inset">Semana</button>
              <button className="nm-btn nm-btn--sm">Mês</button>
            </div>
          </section>
        </div>
      )}

      {/* ── CARDS ───────────────────────────────── */}
      {activeTab === "cards" && (
        <div className="nm-grid-3" style={{ gap: "1.5rem" }}>
          <div className="nm-card">
            <div className="nm-card__header">
              <div>
                <div className="nm-card__title">Card Padrão</div>
                <div className="nm-card__subtitle">Raised (convexo)</div>
              </div>
              <div className="nm-icon-circle"><Settings size={18} /></div>
            </div>
            <p className="nm-body">Superfície elevada com sombra dupla — luz no topo-esquerda e sombra no baixo-direita.</p>
            <div className="nm-card__footer">
              <button className="nm-btn nm-btn--sm nm-btn--ghost">Cancelar</button>
              <button className="nm-btn nm-btn--sm nm-btn--accent">Confirmar</button>
            </div>
          </div>

          <div className="nm-card nm-card--inset">
            <div className="nm-card__header">
              <div>
                <div className="nm-card__title">Card Inset</div>
                <div className="nm-card__subtitle">Côncavo (afundado)</div>
              </div>
            </div>
            <p className="nm-body">Elemento "afundado" na superfície. Ideal para área de conteúdo ou campos.</p>
          </div>

          <div className="nm-card nm-card--glow">
            <div className="nm-card__header">
              <div>
                <div className="nm-card__title" style={{ color: "var(--nm-accent)" }}>Card Glow</div>
                <div className="nm-card__subtitle">Com halo luminoso accent</div>
              </div>
              <div className="nm-icon-circle nm-icon-circle--glow"><Zap size={18} /></div>
            </div>
            <p className="nm-body">Atração visual máxima. Use para destacar conteúdo premium.</p>
          </div>

          {/* Stat Cards */}
          <div className="nm-stat-card">
            <div className="nm-stat-card__label">Total de Vendas</div>
            <div className="nm-stat-card__value nm-stat-card__value--accent">R$ 48.290</div>
            <div className="nm-stat-card__delta nm-stat-card__delta--up">↑ 12.4% esse mês</div>
          </div>

          <div className="nm-stat-card">
            <div className="nm-stat-card__label">Clientes Ativos</div>
            <div className="nm-stat-card__value">1.847</div>
            <div className="nm-stat-card__delta nm-stat-card__delta--up">↑ 3.2% essa semana</div>
          </div>

          <div className="nm-stat-card">
            <div className="nm-stat-card__label">Conversão</div>
            <div className="nm-stat-card__value">68,4%</div>
            <div className="nm-stat-card__delta nm-stat-card__delta--down">↓ 1.1% hoje</div>
          </div>
        </div>
      )}

      {/* ── INPUTS ──────────────────────────────── */}
      {activeTab === "inputs" && (
        <div className="nm-grid-2" style={{ gap: "2rem", maxWidth: "800px" }}>
          <div className="nm-input-group">
            <label className="nm-input-group__label">Nome completo</label>
            <input className="nm-input" type="text" placeholder="Digite seu nome..." />
            <span className="nm-input-group__hint">Mínimo 3 caracteres</span>
          </div>

          <div className="nm-input-group nm-input-group--with-icon">
            <label className="nm-input-group__label">E-mail</label>
            <div style={{ position: "relative" }}>
              <span className="nm-input-group__icon" style={{ top: "50%", transform: "translateY(-50%)", left: "0.85rem", position: "absolute" }}>
                <User size={16} />
              </span>
              <input className="nm-input" type="email" placeholder="seu@email.com" style={{ paddingLeft: "2.75rem" }} />
            </div>
          </div>

          <div className="nm-input-group">
            <label className="nm-input-group__label">Buscar</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "var(--nm-text-muted)" }}>
                <Search size={16} />
              </span>
              <input className="nm-input nm-input--search" type="search" placeholder="Pesquisar..." style={{ paddingLeft: "2.75rem" }} />
            </div>
          </div>

          <div className="nm-input-group">
            <label className="nm-input-group__label">Categoria</label>
            <div className="nm-select-wrapper">
              <select className="nm-select">
                <option>Vendas</option>
                <option>Estoque</option>
                <option>Financeiro</option>
                <option>Clientes</option>
              </select>
            </div>
          </div>

          <div className="nm-input-group">
            <label className="nm-input-group__label">Com erro</label>
            <input className="nm-input nm-input--error" type="text" placeholder="Campo inválido..." value="valor errado" readOnly />
            <span className="nm-input-group__error">Este campo é obrigatório</span>
          </div>

          <div className="nm-input-group">
            <label className="nm-input-group__label">Com sucesso</label>
            <input className="nm-input nm-input--success" type="text" placeholder="" value="joao@empresa.com" readOnly />
          </div>

          <div className="nm-input-group" style={{ gridColumn: "1/-1" }}>
            <label className="nm-input-group__label">Observações</label>
            <textarea className="nm-textarea" placeholder="Digite uma observação..." rows={4} />
          </div>
        </div>
      )}

      {/* ── BADGES ──────────────────────────────── */}
      {activeTab === "badges" && (
        <div className="nm-flex-col nm-gap-xl">
          <section>
            <div className="nm-label" style={{ marginBottom: "1rem" }}>Badges — Status</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
              <span className="nm-badge">Padrão</span>
              <span className="nm-badge nm-badge--accent">
                <span className="nm-badge__dot nm-badge__dot--pulse" />
                Accent
              </span>
              <span className="nm-badge nm-badge--success">
                <span className="nm-badge__dot" />
                Ativo
              </span>
              <span className="nm-badge nm-badge--danger">
                <span className="nm-badge__dot" />
                Erro
              </span>
              <span className="nm-badge nm-badge--warning">
                <span className="nm-badge__dot" />
                Atenção
              </span>
              <span className="nm-badge nm-badge--info">
                <span className="nm-badge__dot" />
                Info
              </span>
              <span className="nm-badge nm-badge--glow">✦ Premium</span>
              <span className="nm-badge nm-badge--solid">Solid</span>
              <span className="nm-badge nm-badge--solid-danger">Cancelado</span>
              <span className="nm-badge nm-badge--inset">Inset</span>
            </div>
          </section>

          <section>
            <div className="nm-label" style={{ marginBottom: "1rem" }}>Pills</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
              <span className="nm-pill">Todos</span>
              <span className="nm-pill nm-pill--active">Ativos</span>
              <span className="nm-pill">Pendentes</span>
              <span className="nm-pill">Inativos</span>
              <span className="nm-counter">3</span>
              <span className="nm-counter">12</span>
              <span className="nm-counter">99+</span>
            </div>
          </section>
        </div>
      )}

      {/* ── TOGGLES ─────────────────────────────── */}
      {activeTab === "toggles" && (
        <div className="nm-flex-col nm-gap-xl">
          <section>
            <div className="nm-label" style={{ marginBottom: "1rem" }}>Switches</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <label
                className={`nm-switch${switchOn ? " nm-switch--on" : ""}`}
                onClick={() => setSwitchOn(v => !v)}
                style={{ cursor: "pointer" }}
              >
                <div className="nm-switch__track">
                  <div className="nm-switch__thumb" />
                  <span className="nm-switch__track-label">{switchOn ? "ON" : "OFF"}</span>
                </div>
                <span className="nm-switch__label">Notificações push</span>
              </label>

              <label
                className={`nm-switch${switchOn2 ? " nm-switch--on" : ""}`}
                onClick={() => setSwitchOn2(v => !v)}
                style={{ cursor: "pointer" }}
              >
                <div className="nm-switch__track">
                  <div className="nm-switch__thumb" />
                  <span className="nm-switch__track-label">{switchOn2 ? "ON" : "OFF"}</span>
                </div>
                <span className="nm-switch__label">Sincronização automática</span>
              </label>
            </div>
          </section>

          <section>
            <div className="nm-label" style={{ marginBottom: "1rem" }}>Knobs / Botões Circulares Interativos</div>
            <div style={{ display: "flex", gap: "1.25rem", alignItems: "center" }}>
              {[0, 1, 2, 3, 4].map(i => (
                <button
                  key={i}
                  className={`nm-knob nm-knob--lg${activeKnob === i ? " nm-knob--active" : ""}`}
                  onClick={() => setActiveKnob(activeKnob === i ? null : i)}
                >
                  <div className="nm-knob__inner">
                    {i === 0 && <VolumeX size={20} />}
                    {i === 1 && <Volume2 size={20} />}
                    {i === 2 && <Zap size={20} />}
                    {i === 3 && <Music size={20} />}
                    {i === 4 && <Settings size={20} />}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="nm-label" style={{ marginBottom: "1rem" }}>Toggle Group</div>
            <div className="nm-toggle-group" style={{ maxWidth: "300px" }}>
              {["light", "dark", "system"].map(t => (
                <button
                  key={t}
                  className={`nm-toggle-group__item${activeToggleGroup === t ? " nm-toggle-group__item--active" : ""}`}
                  onClick={() => setActiveToggleGroup(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="nm-label" style={{ marginBottom: "1rem" }}>Slider</div>
            <div style={{ maxWidth: "400px" }}>
              <div className="nm-slider-wrapper">
                <div className="nm-slider-wrapper__label">
                  <span className="nm-slider-wrapper__name">Volume</span>
                  <span className="nm-slider-wrapper__value">{sliderVal}%</span>
                </div>
                <input
                  className="nm-slider nm-slider--accent"
                  type="range"
                  min="0"
                  max="100"
                  value={sliderVal}
                  onChange={e => setSliderVal(Number(e.target.value))}
                />
              </div>

              <div style={{ marginTop: "1.5rem" }}>
                <div className="nm-progress-wrapper">
                  <div className="nm-progress-wrapper__header">
                    <span className="nm-progress-wrapper__label">Progresso do Mês</span>
                    <span className="nm-progress-wrapper__value">72%</span>
                  </div>
                  <div className="nm-progress nm-progress--lg">
                    <div className="nm-progress__fill" style={{ width: "72%" }} />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ── ICON CIRCLES ────────────────────────── */}
      {activeTab === "circles" && (
        <div className="nm-flex-col nm-gap-xl">
          <section>
            <div className="nm-label" style={{ marginBottom: "1rem" }}>Icon Circles — Variantes</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
              <div className="nm-icon-circle"><MapPin size={20} /></div>
              <div className="nm-icon-circle nm-icon-circle--glow nm-icon-circle--double"><Music size={20} /></div>
              <div className="nm-icon-circle nm-icon-circle--accent"><Zap size={20} /></div>
              <div className="nm-icon-circle nm-icon-circle--danger"><X size={20} /></div>
              <div className="nm-icon-circle nm-icon-circle--success"><ShieldCheck size={20} /></div>
              <div className="nm-icon-circle nm-icon-circle--glow nm-icon-circle--lg nm-icon-circle--double"><Play size={24} /></div>
              <div className="nm-icon-circle nm-icon-circle--accent nm-icon-circle--xl"><Zap size={32} /></div>
            </div>
          </section>

          <section>
            <div className="nm-label" style={{ marginBottom: "1rem" }}>Avatares</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
              <div className="nm-avatar nm-avatar--sm">JS</div>
              <div className="nm-avatar">AB</div>
              <div className="nm-avatar nm-avatar--lg nm-avatar--accent">VP</div>
              <div className="nm-avatar nm-avatar--xl nm-avatar--glow">
                <User size={28} />
              </div>
              <div style={{ position: "relative" }}>
                <div className="nm-avatar">MR</div>
                <div className="nm-avatar__status nm-avatar__status--online" />
              </div>
              <div style={{ position: "relative" }}>
                <div className="nm-avatar nm-avatar--accent">FK</div>
                <div className="nm-avatar__status nm-avatar__status--away" />
              </div>
            </div>
          </section>

          <section>
            <div className="nm-label" style={{ marginBottom: "1rem" }}>Avatar Group</div>
            <div className="nm-avatar-group">
              <div className="nm-avatar nm-avatar-group__more nm-avatar--sm">+5</div>
              <div className="nm-avatar nm-avatar--sm nm-avatar--accent">AB</div>
              <div className="nm-avatar nm-avatar--sm">CD</div>
              <div className="nm-avatar nm-avatar--sm">EF</div>
              <div className="nm-avatar nm-avatar--sm" style={{ background: "var(--nm-gradient-danger)", color: "#fff" }}>GH</div>
            </div>
          </section>
        </div>
      )}

      {/* ── TABELA ──────────────────────────────── */}
      {activeTab === "table" && (
        <div className="nm-table-wrapper">
          <div className="nm-table-scroll">
            <table className="nm-table">
              <thead>
                <tr>
                  <th className="nm-sortable nm-sort-active">Vendedor</th>
                  <th className="nm-sortable">Rota</th>
                  <th>Status</th>
                  <th className="nm-sortable">Total</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "João Silva",  route: "Centro",  status: "success", total: "R$ 4.200", initials: "JS" },
                  { name: "Maria Lima",  route: "Norte",   status: "warning", total: "R$ 2.890", initials: "ML" },
                  { name: "Pedro Costa", route: "Sul",     status: "danger",  total: "R$ 980",   initials: "PC" },
                  { name: "Ana Souza",   route: "Leste",   status: "success", total: "R$ 6.100", initials: "AS" },
                  { name: "Carlos Melo", route: "Oeste",   status: "success", total: "R$ 3.450", initials: "CM" },
                ].map((row, i) => (
                  <tr key={i} className={i === 3 ? "nm-row--selected" : ""}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div className="nm-avatar nm-avatar--sm nm-avatar--accent">{row.initials}</div>
                        <span>{row.name}</span>
                      </div>
                    </td>
                    <td className="nm-cell--muted">{row.route}</td>
                    <td>
                      <span className={`nm-badge nm-badge--${row.status}`}>
                        <span className="nm-badge__dot" />
                        {{success:"Ativo",warning:"Pendente",danger:"Inativo"}[row.status]}
                      </span>
                    </td>
                    <td className="nm-cell--accent">{row.total}</td>
                    <td className="nm-actions-col">
                      <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end" }}>
                        <button className="nm-btn nm-btn--circle nm-btn--sm"><Settings size={13} /></button>
                        <button className="nm-btn nm-btn--circle nm-btn--sm nm-btn--ghost"><X size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SIDEBAR PREVIEW ──────────────────────── */}
      {activeTab === "sidebar" && (
        <div className="nm-card nm-card--lg" style={{ maxWidth: "320px" }}>
          <div className="nm-sidebar__brand" style={{ padding: "0 0 1rem", margin: "0 0 1rem", borderBottom: "1px solid var(--nm-border)" }}>
            <div className="nm-sidebar__logo"><Zap size={20} /></div>
            <span className="nm-sidebar__brand-name">VendasPro</span>
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <div className="nm-nav-section" style={{ padding: "0 0.5rem 0.3rem" }}>Principal</div>

            {[
              { icon: <Home size={18} />,     label: "Dashboard",  active: true },
              { icon: <BarChart3 size={18} />, label: "Relatórios", active: false },
              { icon: <Users size={18} />,     label: "Clientes",   active: false },
              { icon: <Package size={18} />,   label: "Produtos",   active: false },
            ].map((item, i) => (
              <div
                key={i}
                className={`nm-nav-item${item.active ? " nm-nav-item--active" : ""}`}
              >
                <div className="nm-nav-item__icon">{item.icon}</div>
                <span className="nm-nav-item__label">{item.label}</span>
                {item.active && <span className="nm-counter">3</span>}
                {!item.active && <ChevronRight size={14} style={{ opacity: 0.3 }} />}
              </div>
            ))}

            <div className="nm-divider" style={{ margin: "0.75rem 0" }} />

            <div className="nm-nav-section" style={{ padding: "0 0.5rem 0.3rem" }}>Sistema</div>
            <div className="nm-nav-item">
              <div className="nm-nav-item__icon"><Settings size={18} /></div>
              <span className="nm-nav-item__label">Configurações</span>
            </div>
            <div className="nm-nav-item">
              <div className="nm-nav-item__icon"><Bell size={18} /></div>
              <span className="nm-nav-item__label">Notificações</span>
              <span className="nm-counter">7</span>
            </div>
          </nav>

          <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid var(--nm-border)" }}>
            <div className="nm-sidebar__user">
              <div className="nm-avatar nm-avatar--sm nm-avatar--accent">VP</div>
              <div className="nm-sidebar__user-info">
                <div className="nm-sidebar__user-name">Admin VendasPro</div>
                <div className="nm-sidebar__user-role">Administrador</div>
              </div>
              <button className="nm-btn nm-btn--circle nm-btn--sm nm-btn--flat"><LogOut size={14} /></button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: "4rem", paddingTop: "1.5rem", borderTop: "1px solid var(--nm-border)" }}>
        <p className="nm-caption" style={{ textAlign: "center" }}>
          Neumorphic Design System · VendasPro Web · Double-Shot Lighting
        </p>
      </div>
    </div>
  );
}
