import { Search, X } from "lucide-react";
import type { ProductFilters as IProductFilters } from "@/types/product.types";

interface ProductFiltersProps {
  filters: IProductFilters;
  onChange: (filters: IProductFilters) => void;
  onReset: () => void;
}

const inputClass = `
  w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5
  text-sm text-white placeholder-gray-500
  focus:outline-none focus:border-purple-500/60 focus:bg-white/[0.06]
  transition-all duration-150
`;

const labelClass = "block text-xs font-medium text-gray-400 mb-1.5";

export function ProductFilters({ filters, onChange, onReset }: ProductFiltersProps) {
  function set(key: keyof IProductFilters, value: string) {
    onChange({ ...filters, [key]: value });
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return (
    <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Search size={16} className="text-purple-400" />
          <h2 className="text-sm font-semibold text-white">Pesquisar Produtos</h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <X size={13} />
            Limpar
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className={labelClass}>Descrição</label>
          <input
            className={inputClass}
            placeholder="Nome do produto"
            value={filters.descricao}
            onChange={(e) => set("descricao", e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>Categoria</label>
          <input
            className={inputClass}
            placeholder="Ex: Alimentos, Limpeza"
            value={filters.categoria}
            onChange={(e) => set("categoria", e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>Marca</label>
          <input
            className={inputClass}
            placeholder="Marca do produto"
            value={filters.marca}
            onChange={(e) => set("marca", e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>Código (SKU)</label>
          <input
            className={inputClass}
            placeholder="SKU"
            value={filters.sku}
            onChange={(e) => set("sku", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
