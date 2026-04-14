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
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/95 backdrop-blur-xl animate-in fade-in duration-500" 
        onClick={onClose} 
      />
      
      {/* Modal Container */}
      <div className="relative w-full h-[95vh] sm:h-auto sm:max-h-[85vh] sm:max-w-2xl bg-[#0c0c0c] border-t sm:border border-white/10 rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-500 ease-out">
        
        {/* Mobile Handle */}
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-4 mb-2 sm:hidden shrink-0" />

        {/* Header */}
        <header className="p-6 sm:p-8 border-b border-white/5 flex items-center justify-between shrink-0 bg-gradient-to-r from-blue-500/5 to-transparent">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center border transition-colors ${
                isAdjustment ? 'bg-amber-500/10 border-amber-500/20 shadow-lg shadow-amber-500/5' : 'bg-blue-500/10 border-blue-500/20 shadow-lg shadow-blue-500/5'
            }`}>
              {loading && !movement ? (
                <RefreshCw className="animate-spin text-gray-400" size={24} />
              ) : (
                <Package className={isAdjustment ? 'text-amber-400' : 'text-blue-400'} size={24} />
              )}
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight leading-none">
                {isAdjustment ? 'Ajuste de Estoque' : 'Movimentação'}
              </h2>
              <p className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-widest mt-2 opacity-70">
                {movement?.description || "Carregando detalhes..."}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 sm:p-3 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-all active:scale-90 outline-none">
            <X size={24} />
          </button>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 custom-scrollbar">
          {movement && (
            <>
              {/* Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/5 p-5 rounded-2xl group hover:bg-white/[0.07] transition-all">
                  <div className="flex items-center gap-2 text-gray-500 mb-2">
                    <Calendar size={14} className="group-hover:text-blue-400 transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-[0.1em]">Registrado em</span>
                  </div>
                  <p className="text-sm sm:text-base font-bold text-white">
                    {format(new Date(movement.createdAt), "Pp", { locale: ptBR })}
                  </p>
                </div>
                <div className="bg-white/5 border border-white/5 p-5 rounded-2xl group hover:bg-white/[0.07] transition-all">
                  <div className="flex items-center gap-2 text-gray-500 mb-2">
                    <User size={14} className="group-hover:text-blue-400 transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-[0.1em]">Responsável / Destino</span>
                  </div>
                  <p className="text-sm sm:text-base font-bold text-white truncate">
                    {movement.sellerName || "Depósito Central"}
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 flex items-center gap-2">
                      <ArrowRight size={10} />
                      Produtos Alterados
                    </h3>
                    <span className="text-[10px] font-black text-gray-600 bg-white/5 px-2 py-1 rounded-md uppercase">
                      {movement.pagination.total} sku
                    </span>
                </div>

                <div className="space-y-3 relative min-h-[100px]">
                  {loading && (
                      <div className="absolute inset-x-0 -top-2 flex items-center justify-center z-10">
                          <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-2">
                            <RefreshCw className="animate-spin text-emerald-500" size={16} />
                          </div>
                      </div>
                  )}
                  
                  {movement.items.map((item, idx) => (
                    <div key={idx} className="bg-white/[0.03] border border-white/5 p-5 rounded-[1.5rem] hover:bg-white/5 transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      {/* Product Name & SKU */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            {item.sku}
                          </span>
                        </div>
                        <p className="text-sm sm:text-base font-bold text-gray-200 group-hover:text-white transition-colors truncate">
                          {item.productName}
                        </p>
                      </div>

                      {/* Stock Comparison */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 bg-black/20 sm:bg-transparent p-3 sm:p-0 rounded-xl">
                        
                        <div className="text-center sm:text-right">
                          <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Anterior</p>
                          <p className="text-sm font-bold text-gray-400">{item.quantityBefore}</p>
                        </div>

                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                          <ArrowRight size={14} className="text-gray-600 group-hover:text-emerald-500 transition-colors" />
                        </div>

                        <div className="text-center sm:text-right min-w-[4rem]">
                          <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Atual</p>
                          <div className="flex items-center justify-center sm:justify-end gap-1.5">
                              <p className="text-base font-black text-white">{item.quantityAfter}</p>
                              <div className={`p-1 rounded-md ${item.quantityChange > 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                                {item.quantityChange > 0 ? (
                                    <ArrowUp size={12} className="text-emerald-500" />
                                ) : item.quantityChange < 0 ? (
                                    <ArrowDown size={12} className="text-red-500" />
                                ) : null}
                              </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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
        <footer className="relative p-6 sm:p-8 border-t border-white/5 bg-[#121212]/80 backdrop-blur-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
          <div className="flex-1">
            {movement && movement.pagination.pages > 1 && (
                <div className="flex justify-center sm:justify-start">
                  <Pagination 
                      currentPage={page}
                      totalPages={movement.pagination.pages}
                      onPageChange={setPage}
                      loading={loading}
                  />
                </div>
            )}
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto py-4 px-12 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-400 transition-all active:scale-95 shadow-xl shadow-white/5"
          >
            Fechar Detalhes
          </button>
        </footer>
      </div>
    </div>
  );
}
