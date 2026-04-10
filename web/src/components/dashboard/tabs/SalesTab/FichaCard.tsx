import { MapPin, User, Calendar, DollarSign, Truck } from "lucide-react";
import { FichaStatusBadge } from "./FichaStatusBadge";
import type { FichaListItem } from "@/types/ficha.types";

interface FichaCardProps {
  ficha: FichaListItem;
  onClick?: (ficha: FichaListItem) => void;
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(dateStr));
}

function shortId(id: string) {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

export function FichaCard({ ficha, onClick }: FichaCardProps) {
  const location = [ficha.city, ficha.state].filter(Boolean).join(", ");

  return (
    <article
      onClick={() => onClick?.(ficha)}
      className={`
        group relative bg-white/[0.03] border border-white/8 rounded-2xl p-5
        hover:bg-white/[0.06] hover:border-white/15
        transition-all duration-200 cursor-pointer
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-gray-500 font-mono mb-0.5">{shortId(ficha.id)}</p>
          <h3 className="font-semibold text-white text-sm leading-tight">{ficha.clientName}</h3>
        </div>
        <FichaStatusBadge status={ficha.status} />
      </div>

      {/* Info grid */}
      <div className="space-y-2">
        {/* Route */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Truck size={13} className="shrink-0 text-purple-400" />
          <span className="truncate">{ficha.routeName}</span>
        </div>

        {/* Location */}
        {location && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <MapPin size={13} className="shrink-0 text-purple-400" />
            <span className="truncate">{location}</span>
          </div>
        )}

        {/* Seller */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <User size={13} className="shrink-0 text-purple-400" />
          <span className="truncate">{ficha.sellerName || ficha.sellerEmail}</span>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Calendar size={13} className="shrink-0 text-purple-400" />
          <span>{formatDate(ficha.saleDate)}</span>
        </div>
      </div>

      {/* Footer: total */}
      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
        <span className="text-xs text-gray-500">Total</span>
        <span className="text-lg font-bold text-white">{formatCurrency(ficha.total)}</span>
      </div>
    </article>
  );
}
