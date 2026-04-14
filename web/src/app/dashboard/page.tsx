"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { formatCentsToBRL } from "@/utils/money";
import { SalesTab } from "@/components/dashboard/tabs/SalesTab";
import { ProductsTab } from "@/components/dashboard/tabs/ProductsTab";
import { RoutesTab } from "@/components/dashboard/tabs/RoutesTab";
import { ClientsTab } from "@/components/dashboard/tabs/ClientsTab";
import { EmployeesTab } from "@/components/dashboard/tabs/EmployeesTab";
import { MovementsTab } from "@/components/dashboard/tabs/MovementsTab";
import { SettingsTab } from "@/components/dashboard/tabs/SettingsTab";

interface TenantInfo {
  name: string;
  slug: string;
}

interface DashboardStats {
  totalRevenue: number;
  salesCount: number;
  aiInsight: string;
}

import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";

export default function DashboardPage() {
  const { user, isLoaded, step, tenant: tenantInfo } = useOnboardingStatus();
  const { logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [activeTab, setActiveTab ] = useState("insights");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      if (step !== "completed" || !tenantInfo) return;

      try {
        const serverUrl =
          process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001";

        const statsRes = await fetch(`${serverUrl}/api/stats/insights`, {
          headers: { "x-tenant-slug": tenantInfo.slug },
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      } catch (err) {
        console.error("Dashboard stats fetch error:", err);
      } finally {
        setLoadingStats(false);
      }
    }
    
    if (step === "completed") {
        fetchStats();
    }
  }, [step, tenantInfo]);

  // Close sidebar on tab change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [activeTab]);

  if (isLoaded || step === "loading") {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 bg-[#080808] border-r border-white/5 
          transition-all duration-300 ease-in-out flex flex-col
          ${isSidebarOpen ? "w-72 translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-64"}
        `}
      >
        <div
          className={`p-4 lg:p-6 flex items-center ${isSidebarOpen || "justify-center lg:justify-between"} justify-between`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-600/20 shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            {/* Desktop Label */}
            <span className="font-black text-lg tracking-tighter uppercase hidden lg:block">
              Vendas PRO
            </span>
            {/* Mobile Label (only when sidebar is expanded) */}
            {isSidebarOpen && (
              <span className="font-black text-lg tracking-tighter uppercase lg:hidden animate-in fade-in slide-in-from-left-2 duration-500">
                Vendas PRO
              </span>
            )}
          </div>
        </div>

        <nav className="flex-1 px-2 lg:px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
          <NavItem
            icon={<LayoutDashboard size={22} />}
            label="Insights"
            active={activeTab === "insights"}
            onClick={() => setActiveTab("insights")}
            collapsed={!isSidebarOpen}
          />
          <NavItem
            icon={<Package size={22} />}
            label="Produtos"
            active={activeTab === "products"}
            onClick={() => setActiveTab("products")}
            collapsed={!isSidebarOpen}
          />
          <NavItem
            icon={<ShoppingCart size={22} />}
            label="Vendas"
            active={activeTab === "sales"}
            onClick={() => setActiveTab("sales")}
            collapsed={!isSidebarOpen}
          />
          <NavItem
            icon={<Map size={22} />}
            label="Rotas"
            active={activeTab === "rotas"}
            onClick={() => setActiveTab("rotas")}
            collapsed={!isSidebarOpen}
          />
          <NavItem
            icon={<Users size={22} />}
            label="Clientes"
            active={activeTab === "clients"}
            onClick={() => setActiveTab("clients")}
            collapsed={!isSidebarOpen}
          />
          <NavItem
            icon={<Briefcase size={22} />}
            label="Funcionários"
            active={activeTab === "employees"}
            onClick={() => setActiveTab("employees")}
            collapsed={!isSidebarOpen}
          />
          <NavItem
            icon={<History size={22} />}
            label="Movimentações"
            active={activeTab === "movements"}
            onClick={() => setActiveTab("movements")}
            collapsed={!isSidebarOpen}
          />
        </nav>

        <div className="p-2 lg:p-4 border-t border-white/5 space-y-2">
          <NavItem
            icon={<Settings size={22} />}
            label="Configurações"
            active={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
            collapsed={!isSidebarOpen}
          />
          <button
            onClick={logout}
            className={`w-full flex items-center transition-all p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-2xl group ${!isSidebarOpen ? "justify-center lg:justify-start lg:px-4" : "gap-3 px-4"}`}
          >
            <LogOut
              size={22}
              className="group-hover:-translate-x-1 transition-transform"
            />
            <span
              className={`font-bold text-[11px] uppercase tracking-widest lg:block ${isSidebarOpen ? "block" : "hidden"}`}
            >
              Sair
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 lg:pl-64 min-h-screen relative overflow-hidden bg-[#050505]">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />

        <header className="h-16 lg:h-20 border-b border-white/5 px-4 lg:px-8 flex items-center justify-between sticky top-0 bg-[#050505]/80 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white"
            >
              <LayoutDashboard size={24} />
            </button>
            <div className="min-w-0">
              <h2 className="text-lg lg:text-xl font-semibold truncate">
                {tenantInfo?.name || "Minha Empresa"}
              </h2>
              <p className="text-[10px] lg:text-xs text-gray-500 uppercase tracking-widest truncate">
                {tenantInfo?.slug}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-[10px] text-gray-500 truncate max-w-[150px]">
                {user?.email}
              </p>
            </div>
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full border border-white/10 overflow-hidden bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center shrink-0">
               <User className="w-5 h-5 text-purple-400" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-8 space-y-6 lg:space-y-8 scroll-smooth">
          {/* Insights Tab */}
          {activeTab === "insights" && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                  label="Faturamento Total"
                  value={formatCentsToBRL(stats?.totalRevenue || 0)}
                  icon={<DollarSign className="text-green-400" />}
                  trend="+0%"
                />
                <StatCard
                  label="Fichas Abertas"
                  value={(stats?.salesCount || 0).toString()}
                  icon={<ShoppingCart className="text-blue-400" />}
                  trend="+0%"
                />
                <StatCard
                  label="Taxa de Recebimento"
                  value="0%"
                  icon={<Sparkles className="text-purple-400" />}
                  trend="---"
                />
              </div>

              {/* AI Insights Card */}
              <section className="bg-white/5 border border-white/10 rounded-3xl p-4 lg:p-8 relative overflow-hidden">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Sparkles className="text-purple-400 w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold">Insights</h3>
                </div>
                <p className="text-gray-300 leading-relaxed italic text-sm lg:text-base">
                  "
                  {stats?.aiInsight ||
                    "Acompanhe suas fichas de venda em tempo real."}
                  "
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 h-24 lg:h-32 bg-white/5 rounded-2xl animate-pulse" />
                  <div className="flex-1 h-24 lg:h-32 bg-white/5 rounded-2xl animate-pulse" />
                </div>
              </section>
            </>
          )}

          {/* Sales Tab */}
          {activeTab === "sales" && tenantInfo && (
            <SalesTab tenantSlug={tenantInfo.slug} />
          )}

          {/* Products Tab */}
          {activeTab === "products" && tenantInfo && (
            <ProductsTab
              serverUrl={
                process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001"
              }
              tenantSlug={tenantInfo.slug}
            />
          )}

          {/* Routes Tab */}
          {activeTab === "rotas" && tenantInfo && (
            <RoutesTab
              serverUrl={
                process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001"
              }
              tenantSlug={tenantInfo.slug}
            />
          )}

          {/* Clients Tab */}
          {activeTab === "clients" && tenantInfo && (
            <ClientsTab
              serverUrl={
                process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001"
              }
              tenantSlug={tenantInfo.slug}
            />
          )}

          {/* Employees Tab */}
          {activeTab === "employees" && tenantInfo && (
            <EmployeesTab
              serverUrl={
                process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001"
              }
              tenantSlug={tenantInfo.slug}
            />
          )}

          {/* Movements Tab */}
          {activeTab === "movements" && tenantInfo && (
            <MovementsTab
              serverUrl={
                process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001"
              }
              tenantSlug={tenantInfo.slug}
            />
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && tenantInfo && (
            <SettingsTab
              serverUrl={
                process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001"
              }
              tenantSlug={tenantInfo.slug}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function NavItem({
  icon,
  label,
  active,
  onClick,
  collapsed,
}: {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
  collapsed?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center transition-all duration-300 rounded-2xl group ${
        active
          ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
          : "text-gray-400 hover:text-white hover:bg-white/5"
      } ${collapsed ? "justify-center p-3 lg:justify-start lg:px-4 lg:gap-3" : "gap-3 px-4 py-3"}`}
    >
      <div
        className={`transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"}`}
      >
        {icon}
      </div>
      <span
        className={`font-bold text-[11px] uppercase tracking-widest leading-none lg:block ${collapsed ? "hidden" : "block"} animate-in fade-in slide-in-from-left-2 duration-500`}
      >
        {label}
      </span>
    </button>
  );
}

function StatCard({
  label,
  value,
  icon,
  trend,
}: {
  label: string;
  value: string;
  icon: any;
  trend: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-white/20 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-white/5 rounded-lg group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div className="text-xs font-medium text-green-400 flex items-center gap-1">
          {trend}
          <ArrowUpRight size={14} />
        </div>
      </div>
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
