"use client";

import { useState, useEffect } from "react";
import { 
  Package, 
  Search, 
  Calendar, 
  ArrowUpRight, 
  Box, 
  History, 
  RefreshCw,
  Sliders,
  ChevronRight,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pagination } from "@/components/dashboard/shared/Pagination";
import { MovementDetailsModal } from "./MovementDetailsModal";

interface MovementListItem {
  id: string;
  type: 'entrada_estoque' | 'ajuste_manual';
  description: string;
  createdAt: string;
  sellerName: string | null;
}

export function MovementsTab({ tenantSlug, serverUrl }: { tenantSlug: string, serverUrl: string }) {
  const [movements, setMovements] = useState<MovementListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  
  // Details Modal
  const [selectedMovementId, setSelectedMovementId] = useState<string | null>(null);

  useEffect(() => {
    fetchMovements(1);
  }, [tenantSlug]);

  async function fetchMovements(page = 1) {
    try {
      setLoading(true);
      const res = await fetch(`${serverUrl}/api/movements?page=${page}&limit=10`, {
        headers: { "x-tenant-slug": tenantSlug }
      });
      if (res.ok) {
        const data = await res.json();
        setMovements(data.items || []);
        setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
      }
    } catch (err) {
      console.error("Fetch movements error:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleViewDetails(id: string) {
    setSelectedMovementId(id);
  }

  return (
    <div className="nm-flex-col nm-gap-lg nm-animate-fade-in">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 className="nm-heading" style={{ fontSize: "var(--nm-text-2xl)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <History size={24} style={{ color: "var(--nm-accent)" }} />
            Movimentações
          </h1>
          <p className="nm-caption" style={{ marginTop: "0.25rem" }}>Histórico completo de estoque</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span className="nm-badge nm-badge--info nm-badge--lg" style={{ pointerEvents: "none" }}>
            <Box size={14} style={{ marginRight: "0.25rem" }} />
            {pagination.total} registros
          </span>
        </div>
      </div>

      <div className="nm-table-wrapper">
        <div className="nm-table-scroll">
          <table className="nm-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Descrição / Destino</th>
                <th>Data e Hora</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td><div className="nm-skeleton" style={{ width: "80px" }} /></td>
                    <td><div className="nm-skeleton" style={{ width: "200px" }} /></td>
                    <td><div className="nm-skeleton" style={{ width: "120px" }} /></td>
                    <td><div className="nm-skeleton" style={{ width: "32px", float: "right" }} /></td>
                  </tr>
                ))
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="nm-card nm-card--inset" style={{ textAlign: "center", padding: "4rem 2rem", margin: "1rem" }}>
                      <div className="nm-icon-circle nm-icon-circle--lg" style={{ margin: "0 auto 1rem" }}>
                        <History size={32} />
                      </div>
                      <h3 className="nm-subheading">Nenhuma movimentação registrada</h3>
                    </div>
                  </td>
                </tr>
              ) : (
                movements.map((move) => (
                  <tr key={move.id} style={{ cursor: "pointer" }} onClick={() => handleViewDetails(move.id)}>
                    <td>
                      <span className={`nm-badge nm-badge--sm ${move.type === 'entrada_estoque' ? 'nm-badge--info' : 'nm-badge--warning'}`}>
                        {move.type === 'entrada_estoque' ? <ArrowUpRight size={12} /> : <Sliders size={12} />}
                        {move.type === 'entrada_estoque' ? 'Entrada' : 'Ajuste'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                        <span style={{ fontWeight: 600, color: "var(--nm-text-primary)", textTransform: "uppercase" }}>{move.description}</span>
                        <span className="nm-caption" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <Box size={10} />
                          Destino: {move.sellerName || 'Depósito Central'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="nm-code" style={{ padding: "0.2rem 0.4rem" }}>
                        {format(new Date(move.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                    </td>
                    <td className="nm-actions-col">
                      <button 
                        className="nm-btn nm-btn--circle nm-btn--xs"
                        onClick={(e) => { e.stopPropagation(); handleViewDetails(move.id); }}
                        title="Ver detalhes"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pagination.pages > 1 && (
        <Pagination 
          currentPage={pagination.page}
          totalPages={pagination.pages}
          onPageChange={fetchMovements}
          loading={loading}
        />
      )}

      <MovementDetailsModal 
        isOpen={!!selectedMovementId}
        onClose={() => setSelectedMovementId(null)}
        movementId={selectedMovementId}
        tenantSlug={tenantSlug}
        serverUrl={serverUrl}
      />
    </div>
  );
}
