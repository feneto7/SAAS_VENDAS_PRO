import { ClipboardList, Eye, Link as LinkIcon, Trash2, CheckCircle2 } from "lucide-react";
import { FichaStatusBadge } from "./FichaStatusBadge";
import type { FichaListItem } from "@/types/ficha.types";
import { formatCentsToBRL } from "@/utils/money";
import { useState } from "react";

interface SalesListProps {
  fichas: FichaListItem[];
  loading: boolean;
  onFichaClick?: (ficha: FichaListItem) => void;
  onDelete?: (id: string) => void;
  tenantSlug: string;
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(dateStr));
}

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center bg-white/[0.01] border border-white/5 rounded-2xl">
      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
        <ClipboardList size={28} className="text-gray-500" />
      </div>
      <h3 className="text-gray-300 font-medium mb-1">Nenhuma ficha encontrada</h3>
      <p className="text-gray-500 text-sm max-w-xs">
        Ajuste os filtros ou aguarde o vendedor registrar novas fichas pelo aplicativo.
      </p>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-white/5 animate-pulse">
      <td className="py-4 px-4"><div className="h-4 bg-white/10 rounded w-16" /></td>
      <td className="py-4 px-4"><div className="h-4 bg-white/10 rounded w-40" /></td>
      <td className="py-4 px-4"><div className="h-4 bg-white/10 rounded w-24" /></td>
      <td className="py-4 px-4"><div className="h-4 bg-white/10 rounded w-20" /></td>
      <td className="py-4 px-4"><div className="h-4 bg-white/10 rounded w-32" /></td>
      <td className="py-4 px-4"><div className="h-6 bg-white/10 rounded-full w-20" /></td>
      <td className="py-4 px-4"><div className="h-8 bg-white/10 rounded w-8 ml-auto" /></td>
    </tr>
  );
}

export function SalesList({ fichas, loading, onFichaClick, onDelete, tenantSlug }: SalesListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (token: string, id: string) => {
    const url = `${window.location.origin}/public/ficha/${token}?tenant=${tenantSlug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/8 rounded-2xl p-5 animate-pulse">
            <div className="flex justify-between mb-4">
              <div className="h-4 bg-white/10 rounded w-20" />
              <div className="h-6 bg-white/10 rounded-full w-24" />
            </div>
            <div className="h-6 bg-white/10 rounded w-3/4 mb-4" />
            <div className="flex gap-2">
              <div className="h-10 bg-white/5 rounded-xl flex-1" />
              <div className="h-10 bg-white/5 rounded-xl flex-1" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (fichas.length === 0) return <EmptyState />;

  return (
    <div className="space-y-4">
      {/* Mobile/Tablet view (Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-4">
        {fichas.map((ficha) => (
          <div 
            key={ficha.id} 
            className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 hover:bg-white/[0.04] transition-all flex flex-col group active:bg-white/[0.06]"
            onClick={() => onFichaClick?.(ficha)}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-1 rounded border border-white/10">
                {ficha.code ? ficha.code : `#${shortId(ficha.id)}`}
              </span>
              <FichaStatusBadge status={ficha.status} />
            </div>

            <div className="mb-4">
              <h3 className="text-base font-bold text-white mb-1">{ficha.clientName}</h3>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-xs text-gray-500 font-medium uppercase tracking-tight">{ficha.routeName}</span>
                <span className="text-gray-800 hidden sm:inline">•</span>
                <span className="text-xs text-gray-500 font-medium">{ficha.sellerName || "Vendedor Externo"}</span>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Total</p>
                <p className="text-lg font-black text-white">{formatCentsToBRL(ficha.total)}</p>
              </div>

              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {ficha.status === 'link_gerado' && ficha.linkToken && (
                  <button 
                    onClick={() => handleCopyLink(ficha.linkToken!, ficha.id)}
                    className="p-3 bg-purple-500/10 hover:bg-purple-500/20 rounded-xl text-purple-400 transition-all border border-purple-500/20"
                  >
                    {copiedId === ficha.id ? <CheckCircle2 size={18} /> : <LinkIcon size={18} />}
                  </button>
                )}
                <button 
                  onClick={() => onFichaClick?.(ficha)}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 transition-all border border-white/10"
                >
                  <Eye size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop view (Table) */}
      <div className="hidden lg:block bg-white/[0.02] border border-white/8 rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/[0.03] border-b border-white/10 uppercase tracking-tighter">
            <tr>
              <th className="py-5 px-4 text-[10px] font-black text-gray-400">Código</th>
              <th className="py-5 px-4 text-[10px] font-black text-gray-400">Cliente</th>
              <th className="py-5 px-4 text-[10px] font-black text-gray-400">Rota</th>
              <th className="py-5 px-4 text-[10px] font-black text-gray-400">Valor Total</th>
              <th className="py-5 px-4 text-[10px] font-black text-gray-400">Vendedor</th>
              <th className="py-5 px-4 text-[10px] font-black text-gray-400">Status</th>
              <th className="py-5 px-4 text-[10px] font-black text-gray-400 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {fichas.map((ficha) => (
              <tr 
                key={ficha.id} 
                className="group hover:bg-white/[0.04] transition-colors cursor-pointer border-l-2 border-transparent hover:border-purple-500/40"
                onClick={() => onFichaClick?.(ficha)}
              >
                <td className="py-4 px-4">
                  <span className="text-xs font-mono text-gray-500 bg-white/10 px-2 py-1 rounded whitespace-nowrap border border-white/5">
                    {ficha.code ? ficha.code : `#${shortId(ficha.id)}`}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm font-bold text-white">{ficha.clientName}</span>
                </td>
                <td className="py-4 px-4 text-sm text-gray-400">
                  {ficha.routeName}
                </td>
                <td className="py-4 px-4 text-sm font-black text-white">
                  {formatCentsToBRL(ficha.total)}
                </td>
                <td className="py-4 px-4 text-xs text-gray-500 italic">
                  {ficha.sellerName || "Vnd. Externo"}
                </td>
                <td className="py-4 px-4">
                  <FichaStatusBadge status={ficha.status} />
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    {ficha.status === 'link_gerado' && ficha.linkToken && (
                      <button 
                        onClick={() => handleCopyLink(ficha.linkToken!, ficha.id)}
                        className="p-2 hover:bg-purple-500/10 rounded-lg text-purple-400 transition-all"
                      >
                        {copiedId === ficha.id ? <CheckCircle2 size={18} /> : <LinkIcon size={18} />}
                      </button>
                    )}
                    <button 
                      onClick={() => onFichaClick?.(ficha)}
                      className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all"
                    >
                      <Eye size={18} />
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm("Cancelar link?")) onDelete?.(ficha.id);
                      }}
                      className="p-2 hover:bg-red-500/10 rounded-lg text-red-500/40 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={18} />
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
