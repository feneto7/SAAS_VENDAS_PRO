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
      <div className="bg-white/[0.02] border border-white/8 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="py-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-tighter w-24">SKU</th>
              <th className="py-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Descrição</th>
              <th className="py-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-tighter text-center">Depósito</th>
              <th className="py-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Custo</th>
              <th className="py-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Subt. Custo</th>
              <th className="py-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Val CC</th>
              <th className="py-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-tighter text-purple-400">Subt. CC</th>
              <th className="py-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Val SC</th>
              <th className="py-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-tighter text-emerald-400">Subt. SC</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(6)].map((_, i) => <SkeletonRow key={i} />)}
          </tbody>
        </table>
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
    <div className="bg-white/[0.02] border border-white/8 rounded-2xl overflow-hidden overflow-x-auto shadow-2xl">
      <table className="w-full text-left border-collapse min-w-[1000px]">
        <thead className="bg-white/[0.03] border-b border-white/10 uppercase tracking-tighter">
          <tr>
            <th className="py-5 px-4 text-[10px] font-black text-gray-400">SKU</th>
            <th className="py-5 px-4 text-[10px] font-black text-gray-400">Descrição</th>
            <th className="py-5 px-4 text-[10px] font-black text-gray-400 text-center">Depósito</th>
            <th className="py-5 px-4 text-[10px] font-black text-gray-400">Custo Unit.</th>
            <th className="py-5 px-4 text-[10px] font-black text-gray-400">Subt. Custo</th>
            <th className="py-5 px-4 text-[10px] font-black text-gray-400">Val. Com Com. (CC)</th>
            <th className="py-5 px-4 text-[10px] font-black text-purple-400/80">Subt. Com Com. (CC)</th>
            <th className="py-5 px-4 text-[10px] font-black text-gray-400">Val. Sem Com. (SC)</th>
            <th className="py-5 px-4 text-[10px] font-black text-emerald-400/80">Subt. Sem Com. (SC)</th>
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
              <td className="py-4 px-4 text-xs text-gray-400">
                {formatCentsToBRL(p.priceCC)}
              </td>
              <td className="py-4 px-4 text-sm font-black text-purple-400">
                {formatCentsToBRL(p.subtotalCC)}
              </td>
              <td className="py-4 px-4 text-xs text-gray-400">
                {formatCentsToBRL(p.priceSC)}
              </td>
              <td className="py-4 px-4 text-sm font-black text-emerald-400 underline decoration-emerald-500/20 underline-offset-4">
                {formatCentsToBRL(p.subtotalSC)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
