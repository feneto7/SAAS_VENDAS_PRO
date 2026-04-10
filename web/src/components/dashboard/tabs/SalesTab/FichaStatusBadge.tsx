import type { FichaStatus } from "@/types/ficha.types";

const STATUS_CONFIG: Record<FichaStatus, { label: string; className: string; dot: string }> = {
  nova:     { label: "Nova",     className: "bg-blue-500/15   text-blue-400   border-blue-500/30",   dot: "bg-blue-400"   },
  pendente: { label: "Pendente", className: "bg-amber-500/15  text-amber-400  border-amber-500/30",  dot: "bg-amber-400"  },
  paga:     { label: "Paga",     className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-400" },
};

interface FichaStatusBadgeProps {
  status: FichaStatus;
}

export function FichaStatusBadge({ status }: FichaStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
