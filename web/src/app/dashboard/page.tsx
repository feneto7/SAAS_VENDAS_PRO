"use client";

import { useEffect, useState } from "react";
import { useUser, SignOutButton } from "@clerk/nextjs";
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
  History
} from "lucide-react";
import { formatCentsToBRL } from "@/utils/money";
import { SalesTab } from "@/components/dashboard/tabs/SalesTab";
import { ProductsTab } from "@/components/dashboard/tabs/ProductsTab";
import { RoutesTab } from "@/components/dashboard/tabs/RoutesTab";
import { ClientsTab } from "@/components/dashboard/tabs/ClientsTab";
import { EmployeesTab } from "@/components/dashboard/tabs/EmployeesTab";
import { MovementsTab } from "@/components/dashboard/tabs/MovementsTab";

interface TenantInfo {
  name: string;
  slug: string;
}

interface DashboardStats {
  totalRevenue: number;
  salesCount: number;
  aiInsight: string;
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("insights");

  useEffect(() => {
    async function initDashboard() {
      const slug = localStorage.getItem("tenant_slug");
      if (!slug) {
        router.push("/setup");
        return;
      }

      try {
        const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001";
        
        // 1. Fetch Tenant Info
        const infoRes = await fetch(`${serverUrl}/tenant/info`, {
          headers: { "x-tenant-slug": slug }
        });
        if (infoRes.ok) {
          const info = await infoRes.json();
          setTenantInfo(info);
        }

        // 2. Fetch Stats
        const statsRes = await fetch(`${serverUrl}/api/stats/insights`, {
          headers: { "x-tenant-slug": slug }
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      } catch (err) {
        console.error("Dashboard data fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    if (isLoaded) {
      initDashboard();
    }
  }, [isLoaded, router]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-white/[0.02] backdrop-blur-xl flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">Vendas SaaS</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Insights" 
            active={activeTab === "insights"} 
            onClick={() => setActiveTab("insights")} 
          />
          <NavItem 
            icon={<Package size={20} />} 
            label="Produtos" 
            active={activeTab === "products"} 
            onClick={() => setActiveTab("products")} 
          />
          <NavItem 
            icon={<ShoppingCart size={20} />} 
            label="Vendas" 
            active={activeTab === "sales"} 
            onClick={() => setActiveTab("sales")} 
          />
          <NavItem 
            icon={<Map size={20} />} 
            label="Rotas" 
            active={activeTab === "rotas"} 
            onClick={() => setActiveTab("rotas")} 
          />
          <NavItem 
            icon={<Users size={20} />} 
            label="Clientes" 
            active={activeTab === "clients"} 
            onClick={() => setActiveTab("clients")} 
          />
          <NavItem 
            icon={<Briefcase size={20} />} 
            label="Funcionários" 
            active={activeTab === "employees"} 
            onClick={() => setActiveTab("employees")} 
          />
          <NavItem 
            icon={<History size={20} />} 
            label="Movimentações" 
            active={activeTab === "movements"} 
            onClick={() => setActiveTab("movements")} 
          />
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          <NavItem icon={<Settings size={20} />} label="Configurações" active={false} onClick={() => {}} />
          <SignOutButton>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
              <LogOut size={20} />
              <span>Sair</span>
            </button>
          </SignOutButton>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />

        <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between sticky top-0 bg-[#050505]/80 backdrop-blur-md z-10">
          <div>
            <h2 className="text-xl font-semibold">{tenantInfo?.name || "Minha Empresa"}</h2>
            <p className="text-xs text-gray-500 uppercase tracking-widest">{tenantInfo?.slug}</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-500">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
            <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-white/5">
              {user?.imageUrl && <img src={user.imageUrl} alt="Avatar" className="w-full h-full object-cover" />}
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8">
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
              <section className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Sparkles className="text-purple-400 w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold">Insights</h3>
                </div>
                <p className="text-gray-300 leading-relaxed italic">
                  "{stats?.aiInsight || "Acompanhe suas fichas de venda em tempo real."}"
                </p>
                <div className="mt-8 flex gap-4">
                  <div className="flex-1 h-32 bg-white/5 rounded-2xl animate-pulse" />
                  <div className="flex-1 h-32 bg-white/5 rounded-2xl animate-pulse" />
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
              serverUrl={process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001"} 
              tenantSlug={tenantInfo.slug} 
            />
          )}

          {/* Routes Tab */}
          {activeTab === "rotas" && tenantInfo && (
            <RoutesTab 
              serverUrl={process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001"} 
              tenantSlug={tenantInfo.slug} 
            />
          )}

          {/* Clients Tab */}
          {activeTab === "clients" && tenantInfo && (
            <ClientsTab 
              serverUrl={process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001"} 
              tenantSlug={tenantInfo.slug} 
            />
          )}

          {/* Employees Tab */}
          {activeTab === "employees" && tenantInfo && (
            <EmployeesTab 
              serverUrl={process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001"} 
              tenantSlug={tenantInfo.slug} 
            />
          )}

          {/* Movements Tab */}
          {activeTab === "movements" && tenantInfo && (
            <MovementsTab 
              serverUrl={process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001"} 
              tenantSlug={tenantInfo.slug} 
            />
          )}
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        active 
          ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" 
          : "text-gray-400 hover:text-white hover:bg-white/5"
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

function StatCard({ label, value, icon, trend }: { label: string, value: string, icon: any, trend: string }) {
  return (
    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-white/20 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-white/5 rounded-lg group-hover:scale-110 transition-transform">{icon}</div>
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
