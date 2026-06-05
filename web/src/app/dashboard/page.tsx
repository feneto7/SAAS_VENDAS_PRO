"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/styles/ThemeToggle";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Zap,
  Loader2,
  DollarSign,
  ArrowUpRight,
  Sparkles,
  Map,
  Briefcase,
  History,
  User,
  TrendingUp,
  Bell,
} from "lucide-react";
import { formatCentsToBRL } from "@/utils/money";
import { SalesTab } from "@/components/dashboard/tabs/SalesTab";
import { ProductsTab } from "@/components/dashboard/tabs/ProductsTab";
import { RoutesTab } from "@/components/dashboard/tabs/RoutesTab";
import { ClientsTab } from "@/components/dashboard/tabs/ClientsTab";
import { EmployeesTab } from "@/components/dashboard/tabs/EmployeesTab";
import { MovementsTab } from "@/components/dashboard/tabs/MovementsTab";
import { SettingsTab } from "@/components/dashboard/tabs/SettingsTab";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";

interface DashboardStats {
  totalRevenue: number;
  salesCount: number;
  aiInsight: string;
}

export default function DashboardPage() {
  const { user, isLoaded, step, tenant: tenantInfo } = useOnboardingStatus();
  const { logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeTab, setActiveTab] = useState("insights");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      if (step !== "completed" || !tenantInfo) return;
      try {
        const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001";
        const res = await fetch(`${serverUrl}/api/stats/insights`, {
          headers: { "x-tenant-slug": tenantInfo.slug },
        });
        if (res.ok) setStats(await res.json());
      } catch (err) {
        console.error("Dashboard stats fetch error:", err);
      }
    }
    if (step === "completed") fetchStats();
  }, [step, tenantInfo]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [activeTab]);

  if (isLoaded || step === "loading") {
    return (
      <div className="nm-page nm-flex-center" style={{ minHeight: "100dvh" }}>
        <div className="nm-icon-circle nm-icon-circle--glow nm-icon-circle--lg nm-icon-circle--double">
          <Loader2 size={24} style={{ animation: "nm-spin 0.7s linear infinite" }} />
        </div>
      </div>
    );
  }

  const navItems = [
    { id: "insights",   icon: <LayoutDashboard size={20} />, label: "Insights" },
    { id: "products",   icon: <Package size={20} />,         label: "Produtos" },
    { id: "sales",      icon: <ShoppingCart size={20} />,    label: "Vendas" },
    { id: "rotas",      icon: <Map size={20} />,             label: "Rotas" },
    { id: "clients",    icon: <Users size={20} />,           label: "Clientes" },
    { id: "employees",  icon: <Briefcase size={20} />,       label: "Funcionários" },
    { id: "movements",  icon: <History size={20} />,         label: "Movimentações" },
  ];

  return (
    <div className="nm-page nm-layout" style={{ minHeight: "100dvh", overflow: "hidden" }}>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="nm-mobile-overlay"
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            background: "var(--nm-overlay)",
            backdropFilter: "blur(6px)",
          }}
        />
      )}

      {/* ── SIDEBAR ───────────────────────────────── */}
      <aside
        className={`nm-sidebar ${isSidebarOpen ? "nm-sidebar--mobile-open" : ""}`}
      >
        {/* Brand */}
        <div className="nm-sidebar__brand">
          <div className="nm-sidebar__logo">
            <Zap size={20} />
          </div>
          <span className="nm-sidebar__brand-name">VendasPro</span>
        </div>

        {/* Nav */}
        <nav className="nm-sidebar__nav">
          <div className="nm-nav-section">Principal</div>

          {navItems.map(item => (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              className={`nm-nav-item${activeTab === item.id ? " nm-nav-item--active" : ""}`}
              onClick={() => setActiveTab(item.id)}
              style={{ width: "100%", textAlign: "left" }}
            >
              <div className="nm-nav-item__icon">{item.icon}</div>
              <span className="nm-nav-item__label">{item.label}</span>
            </button>
          ))}

          <div className="nm-divider" style={{ margin: "0.75rem 0" }} />
          <div className="nm-nav-section">Sistema</div>

          <button
            id="nav-settings"
            className={`nm-nav-item${activeTab === "settings" ? " nm-nav-item--active" : ""}`}
            onClick={() => setActiveTab("settings")}
            style={{ width: "100%", textAlign: "left" }}
          >
            <div className="nm-nav-item__icon"><Settings size={20} /></div>
            <span className="nm-nav-item__label">Configurações</span>
          </button>
        </nav>

        {/* Footer */}
        <div className="nm-sidebar__footer">
          <div className="nm-sidebar__user">
            <div className="nm-avatar nm-avatar--sm nm-avatar--accent">
              {user?.name?.charAt(0).toUpperCase() || <User size={14} />}
            </div>
            <div className="nm-sidebar__user-info">
              <div className="nm-sidebar__user-name">{user?.name || "Usuário"}</div>
              <div className="nm-sidebar__user-role">{user?.email}</div>
            </div>
            <button
              id="btn-logout"
              className="nm-btn nm-btn--circle nm-btn--sm nm-btn--flat"
              onClick={logout}
              title="Sair"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ──────────────────────────── */}
      <main className="nm-layout__main" style={{ paddingTop: 0, display: "flex", flexDirection: "column", overflowX: "hidden" }}>
        {/* Topbar */}
        <header className="nm-topbar" style={{ position: "sticky", top: 0, zIndex: 10 }}>
          {/* Mobile burger */}
          <button
            id="btn-sidebar-toggle"
            className="nm-btn nm-btn--circle nm-btn--sm md:hidden shrink-0"
            onClick={() => setIsSidebarOpen(v => !v)}
          >
            <LayoutDashboard size={18} />
          </button>

          <div className="flex flex-col overflow-hidden mr-2">
            <p className="truncate" style={{
              fontSize: "var(--nm-text-lg)",
              fontWeight: "var(--nm-font-bold)",
              color: "var(--nm-text-primary)",
              letterSpacing: "var(--nm-tracking-tight)",
            }}>
              {tenantInfo?.name || "Minha Empresa"}
            </p>
            <p className="nm-label truncate" style={{ marginTop: "0.1rem" }}>
              {tenantInfo?.slug}
            </p>
          </div>

          <div className="nm-topbar__spacer" />

          <div className="nm-topbar__actions">
            {/* Notificações */}
            <div style={{ position: "relative" }}>
              <button id="btn-notifications" className="nm-btn nm-btn--circle nm-btn--sm">
                <Bell size={16} />
              </button>
              <span className="nm-counter" style={{
                position: "absolute",
                top: "-4px",
                right: "-4px",
                minWidth: "1rem",
                height: "1rem",
                fontSize: "0.5rem",
                zIndex: 10,
              }}>3</span>
            </div>

            <ThemeToggle size="sm" />

            {/* Avatar do usuário */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div className="hidden sm:flex flex-col text-right">
                <span style={{ fontSize: "var(--nm-text-sm)", fontWeight: 600, color: "var(--nm-text-primary)" }}>
                  {user?.name}
                </span>
                <span className="nm-caption truncate max-w-[150px]">{user?.email}</span>
              </div>
              <div className="nm-avatar nm-avatar--sm nm-avatar--accent shrink-0">
                {user?.name?.charAt(0).toUpperCase() || <User size={14} />}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div style={{ flex: 1, padding: "1.75rem 0", overflowY: "auto" }}>

          {/* ── INSIGHTS TAB ──────────────────── */}
          {activeTab === "insights" && (
            <div className="nm-flex-col nm-gap-lg nm-animate-fade-in">

              {/* Page title */}
              <div>
                <h1 className="nm-heading" style={{ fontSize: "var(--nm-text-2xl)" }}>
                  Painel de Insights
                </h1>
                <p className="nm-caption" style={{ marginTop: "0.25rem" }}>
                  Visão geral do desempenho da sua operação
                </p>
              </div>

              {/* Stat Cards */}
              <div className="nm-grid-3">
                <NmStatCard
                  label="Faturamento Total"
                  value={formatCentsToBRL(stats?.totalRevenue || 0)}
                  icon={<DollarSign size={22} />}
                  trend="+0%"
                  trendUp={true}
                  iconVariant="success"
                />
                <NmStatCard
                  label="Fichas Abertas"
                  value={(stats?.salesCount || 0).toString()}
                  icon={<ShoppingCart size={22} />}
                  trend="+0%"
                  trendUp={true}
                  iconVariant="accent"
                />
                <NmStatCard
                  label="Taxa de Recebimento"
                  value="0%"
                  icon={<TrendingUp size={22} />}
                  trend="---"
                  trendUp={false}
                  iconVariant="warning"
                />
              </div>

              {/* AI Insights Card */}
              <div className="nm-card nm-card--glow">
                <div className="nm-card__header">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div className="nm-icon-circle nm-icon-circle--glow nm-icon-circle--sm">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <div className="nm-card__title">AI Insights</div>
                      <div className="nm-card__subtitle">Análise inteligente do seu negócio</div>
                    </div>
                  </div>
                  <span className="nm-badge nm-badge--glow">
                    <span className="nm-badge__dot nm-badge__dot--pulse" />
                    Live
                  </span>
                </div>

                <p className="nm-body" style={{
                  fontStyle: "italic",
                  padding: "1rem",
                  background: "var(--nm-surface-deep)",
                  borderRadius: "var(--nm-radius-lg)",
                  boxShadow: "var(--nm-shadow-inset)",
                  border: "1px solid var(--nm-border)",
                }}>
                  &ldquo;{stats?.aiInsight || "Acompanhe suas cards de venda em tempo real e identifique oportunidades de crescimento."}&rdquo;
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1.25rem" }}>
                  <div className="nm-card nm-card--inset nm-card--sm" style={{ minHeight: "7rem" }}>
                    <div className="nm-skeleton" style={{ width: "40%", marginBottom: "0.75rem" }} />
                    <div className="nm-skeleton" style={{ width: "70%", height: "1.5rem", marginTop: "0.5rem" }} />
                  </div>
                  <div className="nm-card nm-card--inset nm-card--sm" style={{ minHeight: "7rem" }}>
                    <div className="nm-skeleton" style={{ width: "55%", marginBottom: "0.75rem" }} />
                    <div className="nm-skeleton" style={{ width: "60%", height: "1.5rem", marginTop: "0.5rem" }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Outras tabs sem mudança funcional */}
          {activeTab === "sales" && tenantInfo && (
            <SalesTab tenantSlug={tenantInfo.slug} />
          )}
          {activeTab === "products" && tenantInfo && (
            <ProductsTab
              serverUrl={process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001"}
              tenantSlug={tenantInfo.slug}
            />
          )}
          {activeTab === "rotas" && tenantInfo && (
            <RoutesTab
              serverUrl={process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001"}
              tenantSlug={tenantInfo.slug}
            />
          )}
          {activeTab === "clients" && tenantInfo && (
            <ClientsTab
              serverUrl={process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001"}
              tenantSlug={tenantInfo.slug}
            />
          )}
          {activeTab === "employees" && tenantInfo && (
            <EmployeesTab
              serverUrl={process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001"}
              tenantSlug={tenantInfo.slug}
            />
          )}
          {activeTab === "movements" && tenantInfo && (
            <MovementsTab
              serverUrl={process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001"}
              tenantSlug={tenantInfo.slug}
            />
          )}
          {activeTab === "settings" && tenantInfo && (
            <SettingsTab
              serverUrl={process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001"}
              tenantSlug={tenantInfo.slug}
            />
          )}
        </div>
      </main>
    </div>
  );
}

/* ── Stat Card Neumórfico ─────────────────────── */
function NmStatCard({
  label,
  value,
  icon,
  trend,
  trendUp,
  iconVariant,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend: string;
  trendUp: boolean;
  iconVariant: "accent" | "success" | "warning" | "danger";
}) {
  return (
    <div className="nm-stat-card">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div className={`nm-icon-circle nm-icon-circle--${iconVariant} nm-icon-circle--sm`}>
          {icon}
        </div>
        <span
          className={`nm-badge nm-badge--${trendUp ? "success" : "danger"} nm-badge--sm`}
          style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}
        >
          {trend}
          <ArrowUpRight size={10} />
        </span>
      </div>

      <div>
        <div className="nm-stat-card__label">{label}</div>
        <div className="nm-stat-card__value nm-stat-card__value--accent" style={{ marginTop: "0.25rem" }}>
          {value}
        </div>
      </div>
    </div>
  );
}
