"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, CreditCard, DollarSign, FileText, ShoppingBag, TrendingUp, User, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCentsToBRL } from "@/utils/money";

interface ClientDetailViewProps {
  clientId: string;
  clientName: string;
  serverUrl: string;
  tenantSlug: string;
  onBack: () => void;
}

interface Ficha {
  id: string;
  code: number;
  status: string;
  total: number;
  saleDate: string;
  sellerName?: string;
}

export function ClientDetailView({ clientId, clientName, serverUrl, tenantSlug, onBack }: ClientDetailViewProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("pendentes");

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${serverUrl}/api/clients/${clientId}/details`, {
        headers: { "x-tenant-slug": tenantSlug }
      });
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [clientId]);

  const stats = data?.stats || { totalSold: 0, totalPaid: 0, totalPending: 0, totalRemaining: 0 };
  const fichas = data?.fichas || [];
  const counts = data?.counts || { novas: 0, pendentes: 0, pagas: 0, pedidos: 0, link_gerado: 0 };

  const filteredFichas = fichas.filter((f: any) => {
    if (activeTab === "pendentes") return f.status === "pendente" || f.status === "link_gerado";
    if (activeTab === "novas") return f.status === "nova";
    if (activeTab === "pagas") return f.status === "paga";
    if (activeTab === "pedidos") return f.status === "pedido";
    return true;
  });

  const formatCurrency = (val: number) => formatCentsToBRL(val);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 hover:text-white transition-all border border-white/10"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <User size={16} className="text-purple-400" />
              <h1 className="text-2xl font-bold tracking-tight">{clientName}</h1>
            </div>
            <p className="text-gray-500 text-sm">Dashboard de faturamento e histórico do cliente.</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              label="Total Vendido" 
              value={formatCurrency(stats.totalSold)} 
              icon={<ShoppingBag size={20} />} 
              color="purple" 
              subtitle="Exceto Pedidos"
            />
            <StatCard 
              label="Valor Lançado" 
              value={formatCurrency(stats.totalPaid)} 
              icon={<CreditCard size={20} />} 
              color="emerald" 
              subtitle="Total de Pagamentos"
            />
            <StatCard 
              label="Em Aberto" 
              value={formatCurrency(stats.totalPending)} 
              icon={<TrendingUp size={20} />} 
              color="blue" 
              subtitle="Novas + Pendentes"
            />
            <StatCard 
              label="Restante" 
              value={formatCurrency(stats.totalRemaining)} 
              icon={<DollarSign size={20} />} 
              color="red" 
              subtitle="Saldo Devedor Real"
            />
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-1">
            <TabButton 
              label="Pendentes" 
              count={counts.pendentes + counts.link_gerado} 
              active={activeTab === "pendentes"} 
              onClick={() => setActiveTab("pendentes")} 
            />
            <TabButton 
              label="Novas" 
              count={counts.novas} 
              active={activeTab === "novas"} 
              onClick={() => setActiveTab("novas")} 
            />
            <TabButton 
              label="Pagas" 
              count={counts.pagas} 
              active={activeTab === "pagas"} 
              onClick={() => setActiveTab("pagas")} 
            />
            <TabButton 
              label="Pedidos" 
              count={counts.pedidos} 
              active={activeTab === "pedidos"} 
              onClick={() => setActiveTab("pedidos")} 
            />
          </div>

          {/* Fichas List */}
          <div className="space-y-3">
            {filteredFichas.length === 0 ? (
              <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-16 flex flex-col items-center justify-center text-center">
                <FileText size={40} className="text-gray-700 mb-3" />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Nenhuma ficha encontrada nesta categoria</p>
              </div>
            ) : (
              filteredFichas.map((f: any) => (
                <div 
                  key={f.id}
                  className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:bg-white/[0.04] transition-all group"
                >
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono font-black text-gray-500 uppercase tracking-widest">Ficha</span>
                      <span className="text-base font-bold text-white group-hover:text-purple-400 transition-colors">
                        #{String(f.code).padStart(4, '0')}
                      </span>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-black text-gray-600 tracking-tighter">Data da Venda</span>
                      <span className="text-xs font-bold text-gray-400">
                        {f.saleDate ? format(new Date(f.saleDate), "dd/MM/yyyy HH:mm'h'") : "---"}
                      </span>
                    </div>

                    <div className="hidden md:flex flex-col">
                      <span className="text-[10px] uppercase font-black text-gray-600 tracking-tighter">Vendedor</span>
                      <span className="text-xs font-bold text-gray-400">{f.sellerName || "---"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase font-black text-gray-600 tracking-tighter">Total da Ficha</span>
                      <span className="text-lg font-black text-white italic">{formatCurrency(f.total)}</span>
                    </div>
                    
                    <button className="p-2.5 bg-white/5 hover:bg-purple-500 hover:text-white rounded-xl text-gray-500 transition-all border border-white/5">
                      <ArrowLeft className="rotate-180" size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color, subtitle }: any) {
  const colors: any = {
    purple: "from-purple-500/10 to-transparent text-purple-400 border-purple-500/20",
    emerald: "from-emerald-500/10 to-transparent text-emerald-400 border-emerald-500/20",
    blue: "from-blue-500/10 to-transparent text-blue-400 border-blue-500/20",
    red: "from-red-500/10 to-transparent text-red-500 border-red-500/20",
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-3xl p-6 relative overflow-hidden backdrop-blur-sm shadow-xl shadow-black/20`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{label}</span>
        <div className={`opacity-50`}>{icon}</div>
      </div>
      <h3 className="text-2xl font-black text-white italic truncate">{value}</h3>
      <p className="text-[10px] font-bold text-gray-600 uppercase mt-1 tracking-tighter">{subtitle}</p>
    </div>
  );
}

function TabButton({ label, count, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`px-6 py-4 flex items-center gap-3 transition-all relative group ${active ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
    >
      <span className="text-xs font-black uppercase tracking-widest leading-none mt-0.5">{label}</span>
      {count > 0 && (
        <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-red-500/20 min-w-[20px] text-center">
          {count}
        </span>
      )}
      {active && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
      )}
    </button>
  );
}
