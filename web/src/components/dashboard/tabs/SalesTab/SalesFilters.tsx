import { Search, X } from "lucide-react";
import type { FichaFilters, Route } from "@/types/ficha.types";
import { CustomSelect } from "@/components/dashboard/shared/CustomSelect";

interface SalesFiltersProps {
  filters: FichaFilters;
  routes: Route[];
  onChange: (filters: FichaFilters) => void;
  onReset: () => void;
}

const inputClass = `
  w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5
  text-sm text-white placeholder-gray-500
  focus:outline-none focus:border-purple-500/60 focus:bg-white/[0.06]
  transition-all duration-150
`;

const labelClass = "block text-xs font-medium text-gray-400 mb-1.5";

export function SalesFilters({ filters, routes, onChange, onReset }: SalesFiltersProps) {
  function set(key: keyof FichaFilters, value: string) {
    onChange({ ...filters, [key]: value });
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return (
    <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-5 relative z-20">
      {/* Title row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Search size={16} className="text-purple-400" />
          <h2 className="text-sm font-semibold text-white">Filtros</h2>
          {hasActiveFilters && (
            <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-0.5 rounded-full border border-purple-500/30">
              ativos
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <X size={13} />
            Limpar filtros
          </button>
        )}
      </div>

      {/* Filter grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4">
        {/* Cliente */}
        <div className="lg:col-span-1">
          <label className={labelClass}>Cliente</label>
          <input
            className={inputClass}
            placeholder="Nome do cliente"
            value={filters.cliente}
            onChange={(e) => set("cliente", e.target.value)}
          />
        </div>

        {/* Vendedor */}
        <div>
          <label className={labelClass}>Vendedor</label>
          <input
            className={inputClass}
            placeholder="Nome ou e-mail"
            value={filters.vendedor}
            onChange={(e) => set("vendedor", e.target.value)}
          />
        </div>

        {/* Rota */}
        <div>
          <label className={labelClass}>Rota</label>
          <CustomSelect
            options={[
              { value: "", label: "Todas as rotas" },
              ...routes.map(r => ({ value: r.id, label: r.name }))
            ]}
            value={filters.rotaId}
            onChange={val => set("rotaId", val)}
          />
        </div>

        {/* Status */}
        <div>
          <label className={labelClass}>Status</label>
          <CustomSelect
            options={[
              { value: "", label: "Todos" },
              { value: "nova", label: "Nova" },
              { value: "pendente", label: "Pendente" },
              { value: "paga", label: "Paga" }
            ]}
            value={filters.status}
            onChange={val => set("status", val)}
          />
        </div>

        {/* Estado */}
        <div>
          <label className={labelClass}>Estado</label>
          <input
            className={inputClass}
            placeholder="Ex: SP, RJ"
            value={filters.estado}
            onChange={(e) => set("estado", e.target.value)}
          />
        </div>

        {/* Cidade */}
        <div>
          <label className={labelClass}>Cidade</label>
          <input
            className={inputClass}
            placeholder="Nome da cidade"
            value={filters.cidade}
            onChange={(e) => set("cidade", e.target.value)}
          />
        </div>

        {/* Rua */}
        <div>
          <label className={labelClass}>Rua</label>
          <input
            className={inputClass}
            placeholder="Nome da rua"
            value={filters.rua}
            onChange={(e) => set("rua", e.target.value)}
          />
        </div>

        {/* Período */}
        <div className="lg:col-span-1">
          <label className={labelClass}>Período</label>
          <div className="flex items-center gap-1">
            <input
              type="date"
              className={`${inputClass} !px-1.5 !text-[11px] h-[40px] flex-1 min-w-0`}
              value={filters.dataInicio}
              onChange={(e) => set("dataInicio", e.target.value)}
            />
            <span className="text-gray-500 text-[9px] font-bold uppercase shrink-0">~</span>
            <input
              type="date"
              className={`${inputClass} !px-1.5 !text-[11px] h-[40px] flex-1 min-w-0`}
              value={filters.dataFim}
              onChange={(e) => set("dataFim", e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
