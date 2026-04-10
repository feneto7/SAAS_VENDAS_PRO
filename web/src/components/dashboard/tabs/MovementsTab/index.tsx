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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <History className="text-purple-400" />
            Movimentações de Estoque
          </h1>
          <p className="text-sm text-gray-500 mt-1">Histórico completo de entradas e ajustes manuais</p>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-2">
                <Box size={16} className="text-emerald-400" />
                <span className="text-sm font-bold text-white">{pagination.total} registros</span>
            </div>
        </div>
      </div>

      {/* Movements list mapping */}
      <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Tipo</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Descrição / Destino</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Data e Hora</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-8 py-6 h-20 bg-white/[0.01] border-b border-white/5"></td>
                  </tr>
                ))
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <History size={48} className="mx-auto text-gray-800 mb-4" />
                    <p className="text-gray-500 font-medium">Nenhuma movimentação registrada</p>
                  </td>
                </tr>
              ) : (
                movements.map((move) => (
                  <tr key={move.id} className="group hover:bg-white/[0.03] transition-all cursor-pointer" onClick={() => handleViewDetails(move.id)}>
                    <td className="px-8 py-5">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                        move.type === 'entrada_estoque' 
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                          : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}>
                        {move.type === 'entrada_estoque' ? <ArrowUpRight size={12} /> : <Sliders size={12} />}
                        {move.type === 'entrada_estoque' ? 'Entrada' : 'Ajuste'}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{move.description}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1 font-medium">
                        <Box size={10} />
                        Destino: {move.sellerName || 'Depósito Central'}
                      </p>
                    </td>
                    <td className="px-8 py-5 text-sm text-gray-400 font-medium">
                        {format(new Date(move.createdAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </td>
                    <td className="px-8 py-5 text-right">
                        <button 
                            className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails(move.id);
                            }}
                        >
                            <Eye size={18} />
                        </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="p-8 border-t border-white/5 bg-black/20">
            <Pagination 
                currentPage={pagination.page}
                totalPages={pagination.pages}
                onPageChange={fetchMovements}
                loading={loading}
            />
          </div>
        )}
      </div>

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
