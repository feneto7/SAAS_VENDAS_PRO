import { Package, Hash } from "lucide-react";
import type { Product } from "@/types/product.types";
import { formatCentsToBRL } from "@/utils/money";

interface ProductListProps {
  products: Product[];
  loading: boolean;
}

function SkeletonRow() {
  return (
    <tr className="border-b border-white/5 animate-pulse">
      {[...Array(9)].map((_, i) => (
        <td key={i} className="py-4 px-4"><div className="h-4 bg-white/10 rounded w-full" /></td>
      ))}
    </tr>
  );
}

export function ProductList({ products, loading }: ProductListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/8 rounded-2xl p-4 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-1/4 mb-3" />
            <div className="h-6 bg-white/10 rounded w-3/4 mb-4" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 bg-white/5 rounded-xl" />
              <div className="h-10 bg-white/5 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white/[0.01] border border-white/5 rounded-2xl">
        <Package size={48} className="text-gray-600 mb-4" />
        <h3 className="text-gray-300 font-medium mb-1">Nenhum produto encontrado</h3>
        <p className="text-gray-500 text-sm max-w-xs">Ajuste os filtros para encontrar o que procura.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile view (Cards) */}
      <div className="grid grid-cols-1 gap-4 lg:hidden">
        {products.map((p) => (
          <div key={p.id} className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 hover:bg-white/[0.04] transition-all relative overflow-hidden group">
            {/* SKU Badge */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono font-black text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                {p.sku || "SEM SKU"}
              </span>
              <span className={`text-xs font-bold ${Number(p.stockDeposit) > 0 ? 'text-emerald-400' : 'text-red-500/60'}`}>
                {p.stockDeposit} em estoque
              </span>
            </div>

            {/* Product Info */}
            <div className="mb-4">
              <h3 className="text-base font-bold text-white mb-1">{p.name}</h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 font-bold uppercase">{p.brand || "Sem Marca"}</span>
                <span className="text-gray-800">•</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase">{p.category || "Sem Categoria"}</span>
              </div>
            </div>

            {/* Prices Grid */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
              <div className="p-3 bg-purple-500/5 rounded-xl border border-purple-500/10">
                <p className="text-[9px] text-purple-400/60 font-black uppercase mb-1">Preço CC</p>
                <p className="text-sm font-bold text-purple-400">{formatCentsToBRL(p.priceCC)}</p>
              </div>
              <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                <p className="text-[9px] text-emerald-400/60 font-black uppercase mb-1">Preço SC</p>
                <p className="text-sm font-bold text-emerald-400">{formatCentsToBRL(p.priceSC)}</p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[10px] text-gray-500">
              <span>Custo: {formatCentsToBRL(p.costPrice)}</span>
              <span className="font-medium text-gray-400">ID: {p.id.slice(0,8)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop view (Table) */}
      <div className="hidden lg:block bg-white/[0.02] border border-white/8 rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/[0.03] border-b border-white/10 uppercase tracking-tighter">
            <tr>
              <th className="py-5 px-4 text-[10px] font-black text-gray-400">SKU</th>
              <th className="py-5 px-4 text-[10px] font-black text-gray-400">Descrição</th>
              <th className="py-5 px-4 text-[10px] font-black text-gray-400 text-center">Estoque</th>
              <th className="py-5 px-4 text-[10px] font-black text-gray-400">Custo Unit.</th>
              <th className="py-5 px-4 text-[10px] font-black text-white/40">Subt. Custo</th>
              <th className="py-5 px-4 text-[10px] font-black text-purple-400/60 font-bold">Preço CC</th>
              <th className="py-5 px-4 text-[10px] font-black text-purple-400">Subt. CC</th>
              <th className="py-5 px-4 text-[10px] font-black text-emerald-400/60 font-bold">Preço SC</th>
              <th className="py-5 px-4 text-[10px] font-black text-emerald-400">Subt. SC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {products.map((p) => (
              <tr key={p.id} className="group hover:bg-white/[0.04] transition-colors border-l-2 border-transparent hover:border-purple-500/40">
                <td className="py-4 px-4">
                  <span className="text-[10px] font-mono font-black text-gray-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                    {p.sku || "N/A"}
                  </span>
                </td>
                <td className="py-4 px-4 flex flex-col">
                  <span className="text-sm font-bold text-white leading-tight">{p.name}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] text-gray-500 font-bold uppercase">{p.brand || "Sem Marca"}</span>
                    <span className="text-gray-700 text-[9px]">|</span>
                    <span className="text-[9px] text-gray-500 font-bold uppercase">{p.category || "Sem Cat."}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className={`text-sm font-black ${Number(p.stockDeposit) > 0 ? 'text-white' : 'text-red-500/60'}`}>
                    {p.stockDeposit}
                  </span>
                </td>
                <td className="py-4 px-4 text-xs text-gray-400">
                  {formatCentsToBRL(p.costPrice)}
                </td>
                <td className="py-4 px-4 text-xs font-bold text-white/50">
                  {formatCentsToBRL(p.subtotalCusto)}
                </td>
                <td className="py-4 px-4 text-xs text-purple-400/60">
                  {formatCentsToBRL(p.priceCC)}
                </td>
                <td className="py-4 px-4 text-sm font-black text-purple-400">
                  {formatCentsToBRL(p.subtotalCC)}
                </td>
                <td className="py-4 px-4 text-xs text-emerald-400/60">
                  {formatCentsToBRL(p.priceSC)}
                </td>
                <td className="py-4 px-4 text-sm font-black text-emerald-400">
                  {formatCentsToBRL(p.subtotalSC)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
