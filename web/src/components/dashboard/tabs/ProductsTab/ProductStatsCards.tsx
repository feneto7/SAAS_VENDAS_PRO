import { DollarSign, Percent, TrendingUp } from "lucide-react";
import type { ProductStats } from "@/types/product.types";
import { formatCentsToBRL } from "@/utils/money";

interface ProductStatsCardsProps {
  stats: ProductStats;
}

export function ProductStatsCards({ stats }: ProductStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Preço de Custo */}
      <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-5 hover:bg-white/[0.04] transition-all">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <DollarSign size={20} className="text-blue-400" />
          </div>
          <span className="text-sm font-medium text-gray-400">Total Preço de Custo</span>
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-white tracking-tight">
            {formatCentsToBRL(stats.totalCost)}
          </span>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider mt-1 font-semibold">
            Soma de todos os subtotais de custo
          </span>
        </div>
      </div>

      {/* Com Comissão (CC) */}
      <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-5 hover:bg-white/[0.04] transition-all">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Percent size={20} className="text-purple-400" />
          </div>
          <span className="text-sm font-medium text-gray-400">Total Com Comissão (CC)</span>
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-white tracking-tight">
            {formatCentsToBRL(stats.totalCC)}
          </span>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider mt-1 font-semibold">
            Soma de todos os subtotais CC
          </span>
        </div>
      </div>

      {/* Sem Comissão (SC) */}
      <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-5 hover:bg-white/[0.04] transition-all">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <TrendingUp size={20} className="text-emerald-400" />
          </div>
          <span className="text-sm font-medium text-gray-400">Total Sem Comissão (SC)</span>
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-white tracking-tight">
            {formatCentsToBRL(stats.totalSC)}
          </span>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider mt-1 font-semibold">
            Soma de todos os subtotais SC
          </span>
        </div>
      </div>
    </div>
  );
}
