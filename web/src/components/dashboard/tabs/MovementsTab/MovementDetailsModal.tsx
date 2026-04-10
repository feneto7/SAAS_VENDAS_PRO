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

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-[#0c0c0c] border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        <header className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                movement?.type === 'ajuste_manual' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-blue-500/10 border-blue-500/20'
            }`}>
              {loading && !movement ? <RefreshCw className="animate-spin text-gray-400" size={24} /> : (
                <Package className={movement?.type === 'ajuste_manual' ? 'text-amber-400' : 'text-blue-400'} size={24} />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Detalhes da Movimentação</h2>
              <p className="text-sm text-gray-500 font-medium">{movement?.description || "Carregando..."}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-all">
            <X size={24} />
          </button>
        </header>

        <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
          {movement && (
            <>
              {/* Movement Header Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Calendar size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Data</span>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {format(new Date(movement.createdAt), "Pp", { locale: ptBR })}
                  </p>
                </div>
                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <User size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Vendedor / Destino</span>
                  </div>
                  <p className="text-sm font-bold text-white">{movement.sellerName || "Depósito Central"}</p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400">Produtos Alterados</h3>
                    <span className="text-xs font-bold text-gray-500">
                        {movement.pagination.total} itens
                    </span>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden min-h-[50px]">
                  {loading && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10 backdrop-blur-[1px]">
                          <RefreshCw className="animate-spin text-emerald-500" />
                      </div>
                  )}
                  <div className="divide-y divide-white/5">
                    {movement.items.map((item, idx) => (
                      <div key={idx} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-all group">
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="text-[10px] font-mono text-emerald-400/60 mb-1">{item.sku}</p>
                          <p className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors truncate">{item.productName}</p>
                        </div>

                        <div className="flex items-center gap-6 shrink-0">
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter mb-0.5">Antes</p>
                            <p className="font-bold text-gray-400">{item.quantityBefore}</p>
                          </div>

                          <ArrowRight size={16} className="text-gray-700" />

                          <div className="text-right min-w-[3rem]">
                            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter mb-0.5">Depois</p>
                            <div className="flex items-center justify-end gap-1">
                                <p className="font-black text-white">{item.quantityAfter}</p>
                                {item.quantityChange > 0 ? (
                                    <ArrowUp size={12} className="text-emerald-500" />
                                ) : item.quantityChange < 0 ? (
                                    <ArrowDown size={12} className="text-red-500" />
                                ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {!movement && loading && (
            <div className="py-20 flex flex-col items-center justify-center text-gray-500 gap-4">
              <RefreshCw className="animate-spin text-emerald-500" size={32} />
              <p className="text-xs font-black uppercase tracking-widest">Carregando detalhes...</p>
            </div>
          )}
        </div>

        <footer className="p-8 border-t border-white/5 bg-black/40 flex items-center justify-between">
          <div className="flex-1">
            {movement && movement.pagination.pages > 1 && (
                <Pagination 
                    currentPage={page}
                    totalPages={movement.pagination.pages}
                    onPageChange={setPage}
                    loading={loading}
                />
            )}
          </div>
          <button 
            onClick={onClose}
            className="py-3 px-8 bg-white/5 text-sm font-bold text-white rounded-2xl hover:bg-white/10 transition-all font-outfit"
          >
            Fechar
          </button>
        </footer>
      </div>
    </div>
  );
}
