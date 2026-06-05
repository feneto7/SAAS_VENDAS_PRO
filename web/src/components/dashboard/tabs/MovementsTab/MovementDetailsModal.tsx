"use client";

import { useState, useEffect } from "react";
import { X, Package, Calendar, User, ArrowRight, ArrowDown, ArrowUp, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pagination } from "@/components/dashboard/shared/Pagination";

interface MovementItem {
  productName: string;
  sku: string;
  quantityBefore: number;
  quantityAfter: number;
  quantityChange: number;
}

interface MovementDetails {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  sellerName: string | null;
  items: MovementItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

interface MovementDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  movementId: string | null;
  tenantSlug: string;
  serverUrl: string;
}

export function MovementDetailsModal({ isOpen, onClose, movementId, tenantSlug, serverUrl }: MovementDetailsModalProps) {
  const [movement, setMovement] = useState<MovementDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (isOpen && movementId) {
      setPage(1);
      fetchDetails(1, movementId);
    } else if (!isOpen) {
      setMovement(null);
    }
  }, [isOpen, movementId]);

  useEffect(() => {
    if (isOpen && movementId) {
      fetchDetails(page, movementId);
    }
  }, [page]);

  async function fetchDetails(p: number, id: string) {
    try {
      setLoading(true);
      const res = await fetch(`${serverUrl}/api/movements/${id}?page=${p}&limit=10`, {
        headers: { "x-tenant-slug": tenantSlug }
      });
      if (res.ok) {
        const data = await res.json();
        setMovement(data);
      }
    } catch (err) {
      console.error("Fetch details error:", err);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen || !movementId) return null;

  const isAdjustment = movement?.type === 'ajuste_manual';

  return (
    <div className="nm-modal-backdrop" onClick={onClose}>
      <div 
        className="nm-modal nm-modal--lg" 
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Mobile Handle */}
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-4 mb-2 sm:hidden shrink-0" />

        {/* Header */}
        <header className="nm-modal__header">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div className={`nm-icon-circle nm-icon-circle--lg nm-icon-circle--double ${isAdjustment ? 'nm-icon-circle--warning' : 'nm-icon-circle--accent'}`}>
              {loading && !movement ? (
                <RefreshCw className="animate-spin" size={24} />
              ) : (
                <Package size={24} />
              )}
            </div>
            <div>
              <h2 className="nm-modal__title">
                {isAdjustment ? 'Ajuste de Estoque' : 'Movimentação'}
              </h2>
              <p className="nm-modal__subtitle" style={{ textTransform: "uppercase", fontWeight: "bold", fontSize: "10px" }}>
                {movement?.description || "Carregando detalhes..."}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="nm-modal__close">
            <X size={18} />
          </button>
        </header>

        {/* Content Body */}
        <div className="nm-modal__body">
          {movement && (
            <>
              {/* Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="nm-card nm-card--sm group hover:bg-white/[0.04] transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={14} className="nm-text-muted group-hover:nm-text-accent transition-colors" />
                    <span className="nm-label">Registrado em</span>
                  </div>
                  <p className="text-sm sm:text-base font-bold text-white">
                    {format(new Date(movement.createdAt), "Pp", { locale: ptBR })}
                  </p>
                </div>
                <div className="nm-card nm-card--sm group hover:bg-white/[0.04] transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <User size={14} className="nm-text-muted group-hover:nm-text-accent transition-colors" />
                    <span className="nm-label">Responsável / Destino</span>
                  </div>
                  <p className="text-sm sm:text-base font-bold text-white truncate">
                    {movement.sellerName || "Depósito Central"}
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="nm-heading flex items-center gap-2">
                      <ArrowRight size={14} />
                      Produtos Alterados
                    </h3>
                    <span className="nm-badge nm-badge--sm nm-badge--accent uppercase">
                      {movement.pagination.total} sku
                    </span>
                </div>

                <div className="nm-table-container relative min-h-[100px]">
                  {loading && (
                      <div className="absolute inset-x-0 -top-2 flex items-center justify-center z-10">
                          <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-2">
                            <RefreshCw className="animate-spin text-emerald-500" size={16} />
                          </div>
                      </div>
                  )}
                  
                  <table className="nm-table">
                    <thead>
                      <tr>
                        <th>Produto</th>
                        <th>Estoque Anterior</th>
                        <th>Estoque Atual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movement.items.map((item, idx) => (
                        <tr key={idx} className="nm-table__row">
                          <td>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 w-fit mb-1">
                                {item.sku}
                              </span>
                              <p className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors truncate">
                                {item.productName}
                              </p>
                            </div>
                          </td>
                          <td>
                            <span className="text-sm font-bold nm-text-muted">{item.quantityBefore}</span>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-white">{item.quantityAfter}</span>
                                <div className={`p-1 rounded-md ${item.quantityChange > 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                                  {item.quantityChange > 0 ? (
                                      <ArrowUp size={12} className="text-emerald-500" />
                                  ) : item.quantityChange < 0 ? (
                                      <ArrowDown size={12} className="text-red-500" />
                                  ) : null}
                                </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {!movement && loading && (
            <div className="py-24 flex flex-col items-center justify-center text-gray-500 gap-6">
              <div className="w-16 h-16 bg-emerald-500/5 rounded-full flex items-center justify-center border border-emerald-500/10 animate-pulse">
                <RefreshCw className="animate-spin text-emerald-500" size={32} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">Sincronizando dados...</p>
            </div>
          )}
        </div>

        {/* Fixed Footer */}
        <footer className="nm-modal__footer">
          <div style={{ flex: 1 }}>
            {movement && movement.pagination.pages > 1 && (
                <Pagination 
                    currentPage={page}
                    totalPages={movement.pagination.pages}
                    onPageChange={setPage}
                    loading={loading}
                />
            )}
          </div>
          <button type="button" onClick={onClose} className="nm-btn nm-btn--accent">
            Fechar Detalhes
          </button>
        </footer>
      </div>
    </div>
  );
}
