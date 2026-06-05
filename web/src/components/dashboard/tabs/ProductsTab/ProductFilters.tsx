import { Search, X } from "lucide-react";
import type { ProductFilters as IProductFilters } from "@/types/product.types";

interface ProductFiltersProps {
  filters: IProductFilters;
  onChange: (filters: IProductFilters) => void;
  onReset: () => void;
}

export function ProductFilters({ filters, onChange, onReset }: ProductFiltersProps) {
  function set(key: keyof IProductFilters, value: string) {
    onChange({ ...filters, [key]: value });
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return (
    <div className="nm-card nm-card--sm" style={{ marginBottom: "0", overflow: "visible", padding: "1rem" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "1rem", flexWrap: "wrap" }}>
        
        {/* Label Pesquisar */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingBottom: "0.4rem", marginRight: "0.5rem" }}>
          <div className="nm-icon-circle nm-icon-circle--sm" style={{ color: "var(--nm-accent)" }}>
            <Search size={14} />
          </div>
          <span style={{ fontSize: "var(--nm-text-sm)", fontWeight: 600, color: "var(--nm-text-primary)" }}>Filtros</span>
          {hasActiveFilters && <span className="nm-badge nm-badge--accent nm-badge--sm">ativos</span>}
        </div>

        <div className="nm-input-group" style={{ flex: 2, minWidth: "150px" }}>
          <label className="nm-input-group__label">Descrição</label>
          <input className="nm-input" placeholder="Nome do produto"
            value={filters.descricao} onChange={(e) => set("descricao", e.target.value)} />
        </div>

        <div className="nm-input-group" style={{ flex: 1, minWidth: "120px" }}>
          <label className="nm-input-group__label">Categoria</label>
          <input className="nm-input" placeholder="Ex: Alimentos"
            value={filters.categoria} onChange={(e) => set("categoria", e.target.value)} />
        </div>

        <div className="nm-input-group" style={{ flex: 1, minWidth: "120px" }}>
          <label className="nm-input-group__label">Marca</label>
          <input className="nm-input" placeholder="Marca"
            value={filters.marca} onChange={(e) => set("marca", e.target.value)} />
        </div>

        <div className="nm-input-group" style={{ flex: 1, minWidth: "100px" }}>
          <label className="nm-input-group__label">SKU</label>
          <input className="nm-input" placeholder="Código"
            value={filters.sku} onChange={(e) => set("sku", e.target.value)} />
        </div>

        {hasActiveFilters && (
          <button onClick={onReset} className="nm-btn nm-btn--flat nm-btn--xs"
            style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.4rem 0.75rem", height: "34px", flexShrink: 0 }}>
            <X size={12} /> Limpar
          </button>
        )}
      </div>
    </div>
  );
}
