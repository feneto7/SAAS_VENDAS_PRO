import { ClipboardList, Eye, Link as LinkIcon, Trash2, CheckCircle2 } from "lucide-react";
import { FichaStatusBadge } from "./FichaStatusBadge";
import type { FichaListItem } from "@/types/card.types";
import { formatCentsToBRL } from "@/utils/money";
import { useState } from "react";
import { copyToClipboard } from "@/utils/clipboard";

interface SalesListProps {
  cards: FichaListItem[];
  loading: boolean;
  onFichaClick?: (card: FichaListItem) => void;
  onDelete?: (id: string) => void;
  tenantSlug: string;
}

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

function EmptyState() {
  return (
    <div className="nm-card nm-card--inset" style={{ textAlign: "center", padding: "3rem 1rem" }}>
      <div className="nm-icon-circle nm-icon-circle--lg" style={{ margin: "0 auto 1rem" }}>
        <ClipboardList size={26} />
      </div>
      <h3 className="nm-subheading" style={{ marginBottom: "0.35rem" }}>Nenhuma card encontrada</h3>
      <p className="nm-caption">Ajuste os filtros ou aguarde o vendedor registrar novas cards.</p>
    </div>
  );
}

function SkeletonRows() {
  return (
    <>
      {[...Array(4)].map((_, i) => (
        <tr key={i} style={{ borderBottom: "1px solid var(--nm-border-subtle)" }}>
          {[16, 40, 24, 20, 32, 20, 16].map((w, j) => (
            <td key={j} style={{ padding: "0.85rem 1.1rem" }}>
              <div className="nm-skeleton" style={{ width: `${w * 4}px` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function SalesList({ cards, loading, onFichaClick, onDelete, tenantSlug }: SalesListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = async (token: string, id: string) => {
    const url = `${window.location.origin}/public/card/${token}?tenant=${tenantSlug}`;
    const success = await copyToClipboard(url);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  if (!loading && cards.length === 0) return <EmptyState />;

  return (
    <div className="nm-table-wrapper">
      <div className="nm-table-scroll">
        <table className="nm-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Cliente</th>
              <th>Rota</th>
              <th>Valor Total</th>
              <th>Vendedor</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows />
            ) : (
              cards.map((card) => (
                <tr
                  key={card.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => onFichaClick?.(card)}
                >
                  <td>
                    <span className="nm-code" style={{ whiteSpace: "nowrap" }}>
                      {card.code ? card.code : `#${shortId(card.id)}`}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: "var(--nm-text-primary)" }}>
                      {card.clientName}
                    </span>
                  </td>
                  <td className="nm-cell--muted">{card.routeName}</td>
                  <td className="nm-cell--accent" style={{ fontWeight: 700 }}>
                    {formatCentsToBRL(card.total)}
                  </td>
                  <td className="nm-cell--muted" style={{ fontStyle: "italic" }}>
                    {card.sellerName || "Vnd. Externo"}
                  </td>
                  <td>
                    <FichaStatusBadge status={card.status} />
                  </td>
                  <td className="nm-actions-col" onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.3rem" }}>
                      {card.status === "link_gerado" && card.linkToken && (
                        <button
                          className="nm-btn nm-btn--circle nm-btn--xs"
                          style={{ color: "var(--nm-accent)" }}
                          onClick={() => handleCopyLink(card.linkToken!, card.id)}
                          title="Copiar link"
                        >
                          {copiedId === card.id ? <CheckCircle2 size={14} /> : <LinkIcon size={14} />}
                        </button>
                      )}
                      <button
                        className="nm-btn nm-btn--circle nm-btn--xs"
                        onClick={() => onFichaClick?.(card)}
                        title="Ver detalhes"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="nm-btn nm-btn--circle nm-btn--xs nm-btn--danger"
                        onClick={() => { if (confirm("Cancelar link?")) onDelete?.(card.id); }}
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
