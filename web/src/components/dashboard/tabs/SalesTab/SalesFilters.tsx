import { Search, X } from "lucide-react";
import type { FichaFilters, Route } from "@/types/card.types";
import { CustomSelect } from "@/components/dashboard/shared/CustomSelect";

interface SalesFiltersProps {
  filters: FichaFilters;
  routes: Route[];
  onChange: (filters: FichaFilters) => void;
  onReset: () => void;
}

export function SalesFilters({ filters, routes, onChange, onReset }: SalesFiltersProps) {
  function set(key: keyof FichaFilters, value: string) {
    onChange({ ...filters, [key]: value });
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return (
    <div className="nm-card nm-card--sm" style={{ position: "relative", zIndex: 20, overflow: "visible", padding: "1rem" }}>
      
      {/* Top Row: "Filtros" + Text Inputs */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-4 sm:flex-wrap">
        
        {/* Label Filtros */}
        <div className="flex items-center gap-2 pb-0 sm:pb-2 sm:mr-2">
          <div className="nm-icon-circle nm-icon-circle--sm" style={{ color: "var(--nm-accent)" }}>
            <Search size={14} />
          </div>
          <span style={{ fontSize: "var(--nm-text-sm)", fontWeight: 600, color: "var(--nm-text-primary)" }}>Filtros</span>
          {hasActiveFilters && <span className="nm-badge nm-badge--accent nm-badge--sm">ativos</span>}
        </div>

        <div className="nm-input-group w-full sm:flex-1 sm:min-w-[120px]">
          <label className="nm-input-group__label">Cliente</label>
          <input className="nm-input" style={{ padding: "0.4rem 0.75rem", fontSize: "var(--nm-text-sm)" }} placeholder="Nome do cliente"
            value={filters.cliente} onChange={(e) => set("cliente", e.target.value)} />
        </div>
        
        <div className="nm-input-group w-full sm:flex-1 sm:min-w-[120px]">
          <label className="nm-input-group__label">Vendedor</label>
          <input className="nm-input" style={{ padding: "0.4rem 0.75rem", fontSize: "var(--nm-text-sm)" }} placeholder="Nome ou e-mail"
            value={filters.vendedor} onChange={(e) => set("vendedor", e.target.value)} />
        </div>

        <div className="nm-input-group w-full sm:flex-1 sm:min-w-[100px]">
          <label className="nm-input-group__label">Estado</label>
          <input className="nm-input" style={{ padding: "0.4rem 0.75rem", fontSize: "var(--nm-text-sm)" }} placeholder="Ex: SP, RJ"
            value={filters.estado} onChange={(e) => set("estado", e.target.value)} />
        </div>

        <div className="nm-input-group w-full sm:flex-1 sm:min-w-[120px]">
          <label className="nm-input-group__label">Cidade</label>
          <input className="nm-input" style={{ padding: "0.4rem 0.75rem", fontSize: "var(--nm-text-sm)" }} placeholder="Nome da cidade"
            value={filters.cidade} onChange={(e) => set("cidade", e.target.value)} />
        </div>

        <div className="nm-input-group w-full sm:flex-1 sm:min-w-[120px]">
          <label className="nm-input-group__label">Rua</label>
          <input className="nm-input" style={{ padding: "0.4rem 0.75rem", fontSize: "var(--nm-text-sm)" }} placeholder="Nome da rua"
            value={filters.rua} onChange={(e) => set("rua", e.target.value)} />
        </div>

      </div>

      {/* Second Row: Selects and Period */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:flex-wrap">
        
        <div className="nm-input-group w-full sm:flex-1 sm:min-w-[150px]">
          <label className="nm-input-group__label">Rota</label>
          <CustomSelect
            options={[
              { value: "", label: "Todas as rotas" },
              ...routes.map(r => ({ value: r.id, label: r.name })),
            ]}
            value={filters.rotaId}
            onChange={val => set("rotaId", val)}
            className="sm"
          />
        </div>

        <div className="nm-input-group w-full sm:flex-1 sm:min-w-[150px]">
          <label className="nm-input-group__label">Status</label>
          <CustomSelect
            options={[
              { value: "", label: "Todos" },
              { value: "nova", label: "Nova" },
              { value: "pendente", label: "Pendente" },
              { value: "paga", label: "Paga" },
            ]}
            value={filters.status}
            onChange={val => set("status", val)}
            className="sm"
          />
        </div>

        <div className="nm-input-group w-full sm:flex-[2] sm:min-w-[200px]">
          <label className="nm-input-group__label">Período</label>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <input type="date" className="nm-input" style={{ flex: 1, padding: "0.4rem 0.75rem", fontSize: "var(--nm-text-sm)" }}
              value={filters.dataInicio} onChange={(e) => set("dataInicio", e.target.value)} />
            <span style={{ color: "var(--nm-text-muted)", fontSize: "var(--nm-text-xs)" }}>~</span>
            <input type="date" className="nm-input" style={{ flex: 1, padding: "0.4rem 0.75rem", fontSize: "var(--nm-text-sm)" }}
              value={filters.dataFim} onChange={(e) => set("dataFim", e.target.value)} />
          </div>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="nm-btn nm-btn--flat nm-btn--xs w-full sm:w-auto mt-2 sm:mt-0"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem", padding: "0.4rem 0.75rem", height: "34px", flexShrink: 0 }}
          >
            <X size={12} />
            Limpar
          </button>
        )}
      </div>

    </div>
  );
}
