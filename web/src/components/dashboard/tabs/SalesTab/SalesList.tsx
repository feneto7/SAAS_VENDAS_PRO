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
      <div className="bg-white/[0.02] border border-white/8 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Código</th>
              <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Cliente</th>
              <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Rota</th>
              <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Valor</th>
              <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Vendedor</th>
              <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(6)].map((_, i) => <SkeletonRow key={i} />)}
          </tbody>
        </table>
      </div>
    );
  }

  if (fichas.length === 0) return <EmptyState />;

  return (
    <div className="bg-white/[0.02] border border-white/8 rounded-2xl overflow-hidden overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead className="bg-white/[0.03] border-b border-white/10">
          <tr>
            <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Código</th>
            <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Cliente</th>
            <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Rota</th>
            <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Valor Total</th>
            <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Vendedor</th>
            <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
            <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {fichas.map((ficha) => (
            <tr 
              key={ficha.id} 
              className="group hover:bg-white/[0.04] transition-colors cursor-pointer"
              onClick={() => onFichaClick?.(ficha)}
            >
              <td className="py-4 px-4">
                <span className="text-xs font-mono text-gray-500 bg-white/5 px-2 py-1 rounded whitespace-nowrap">
                  {ficha.code ? ficha.code : `#${shortId(ficha.id)}`}
                </span>
              </td>
              <td className="py-4 px-4">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">{ficha.clientName}</span>
                </div>
              </td>
              <td className="py-4 px-4 text-sm text-gray-300">
                {ficha.routeName}
              </td>
              <td className="py-4 px-4 text-sm font-bold text-white whitespace-nowrap">
                {formatCentsToBRL(ficha.total)}
              </td>
              <td className="py-4 px-4 text-sm text-gray-400">
                {ficha.sellerName || ficha.sellerEmail}
              </td>
              <td className="py-4 px-4">
                <FichaStatusBadge status={ficha.status} />
              </td>
              <td className="py-4 px-4 text-right">
                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  {ficha.status === 'link_gerado' && ficha.linkToken && (
                    <>
                      <button 
                        onClick={() => handleCopyLink(ficha.linkToken!, ficha.id)}
                        title="Copiar Link"
                        className="p-2 hover:bg-white/10 rounded-lg text-purple-400 hover:text-purple-300 transition-all"
                      >
                        {copiedId === ficha.id ? <CheckCircle2 size={18} /> : <LinkIcon size={18} />}
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm("Deseja realmente cancelar este link?")) {
                            onDelete?.(ficha.id);
                          }
                        }}
                        title="Cancelar Link"
                        className="p-2 hover:bg-red-500/10 rounded-lg text-red-500/60 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => onFichaClick?.(ficha)}
                    className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all"
                  >
                    <Eye size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
