import { Package, Edit2, Trash2 } from "lucide-react";
import type { Product } from "@/types/product.types";
import { formatCentsToBRL } from "@/utils/money";

interface ProductListProps {
  products: Product[];
  loading: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

export function ProductList({ products, loading, onEdit, onDelete }: ProductListProps) {
  if (loading) {
    return (
      <div className="nm-table-wrapper">
        <div className="nm-table-scroll">
          <table className="nm-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Descrição</th>
                <th style={{ textAlign: "center" }}>Estoque</th>
                <th>Custo Unit.</th>
                <th>Subt. Custo</th>
                <th style={{ color: "var(--nm-accent)" }}>Preço CC</th>
                <th style={{ color: "var(--nm-accent)" }}>Subt. CC</th>
                <th style={{ color: "var(--nm-success)" }}>Preço SC</th>
                <th style={{ color: "var(--nm-success)" }}>Subt. SC</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td><div className="nm-skeleton" style={{ width: "60px" }} /></td>
                  <td><div className="nm-skeleton" style={{ width: "150px" }} /></td>
                  <td style={{ textAlign: "center" }}><div className="nm-skeleton" style={{ width: "30px", margin: "0 auto" }} /></td>
                  <td><div className="nm-skeleton" style={{ width: "80px" }} /></td>
                  <td><div className="nm-skeleton" style={{ width: "80px" }} /></td>
                  <td><div className="nm-skeleton" style={{ width: "80px" }} /></td>
                  <td><div className="nm-skeleton" style={{ width: "80px" }} /></td>
                  <td><div className="nm-skeleton" style={{ width: "80px" }} /></td>
                  <td><div className="nm-skeleton" style={{ width: "80px" }} /></td>
                  <td><div className="nm-skeleton" style={{ width: "60px", float: "right" }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="nm-table-wrapper">
        <table className="nm-table">
          <tbody>
            <tr>
              <td>
                <div className="nm-card nm-card--inset" style={{ textAlign: "center", padding: "4rem 2rem", margin: "1rem" }}>
                  <div className="nm-icon-circle nm-icon-circle--lg" style={{ margin: "0 auto 1rem" }}>
                    <Package size={32} />
                  </div>
                  <h3 className="nm-subheading">Nenhum produto encontrado</h3>
                  <p className="nm-caption">Ajuste os filtros para encontrar o que procura.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="nm-table-wrapper nm-animate-fade-in">
      <div className="nm-table-scroll">
        <table className="nm-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Descrição</th>
              <th style={{ textAlign: "center" }}>Estoque</th>
              <th>Custo Unit.</th>
              <th>Subt. Custo</th>
              <th style={{ color: "var(--nm-accent)" }}>Preço CC</th>
              <th style={{ color: "var(--nm-accent)" }}>Subt. CC</th>
              <th style={{ color: "var(--nm-success)" }}>Preço SC</th>
              <th style={{ color: "var(--nm-success)" }}>Subt. SC</th>
              <th style={{ textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  <span className="nm-code" style={{ padding: "0.2rem 0.4rem" }}>
                    {p.sku || "N/A"}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                    <span style={{ fontWeight: 600, color: "var(--nm-text-primary)" }}>{p.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span className="nm-caption" style={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase" }}>{p.brand || "Sem Marca"}</span>
                      <span style={{ color: "var(--nm-border-accent)", fontSize: "10px" }}>|</span>
                      <span className="nm-caption" style={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase" }}>{p.category || "Sem Cat."}</span>
                    </div>
                  </div>
                </td>
                <td style={{ textAlign: "center" }}>
                  <span style={{ 
                    fontWeight: 800, 
                    color: Number(p.stockDeposit) > 0 ? "var(--nm-success)" : "var(--nm-danger)" 
                  }}>
                    {p.stockDeposit}
                  </span>
                </td>
                <td className="nm-cell--muted">{formatCentsToBRL(p.costPrice)}</td>
                <td className="nm-cell--muted" style={{ fontWeight: 600 }}>{formatCentsToBRL(p.subtotalCusto)}</td>
                <td style={{ color: "var(--nm-accent)", opacity: 0.8 }}>{formatCentsToBRL(p.priceCC)}</td>
                <td style={{ color: "var(--nm-accent)", fontWeight: 800 }}>{formatCentsToBRL(p.subtotalCC)}</td>
                <td style={{ color: "var(--nm-success)", opacity: 0.8 }}>{formatCentsToBRL(p.priceSC)}</td>
                <td style={{ color: "var(--nm-success)", fontWeight: 800 }}>{formatCentsToBRL(p.subtotalSC)}</td>
                <td className="nm-actions-col">
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.4rem" }}>
                    <button 
                      className="nm-btn nm-btn--circle nm-btn--xs nm-btn--flat"
                      onClick={() => onEdit && onEdit(p)}
                      title="Editar Produto"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button 
                      className="nm-btn nm-btn--circle nm-btn--xs nm-btn--danger"
                      onClick={() => onDelete && onDelete(p)}
                      title="Excluir Produto"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
