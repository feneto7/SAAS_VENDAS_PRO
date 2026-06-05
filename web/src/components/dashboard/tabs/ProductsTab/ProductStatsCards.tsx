import { DollarSign, Percent, TrendingUp } from "lucide-react";
import type { ProductStats } from "@/types/product.types";
import { formatCentsToBRL } from "@/utils/money";

interface ProductStatsCardsProps {
  stats: ProductStats;
}

export function ProductStatsCards({ stats }: ProductStatsCardsProps) {
  const cards = [
    {
      label: "Total Preço de Custo",
      value: formatCentsToBRL(stats.totalCost),
      sub: "Soma de todos os subtotais de custo",
      icon: <DollarSign size={16} />,
      variant: "info" as const,
    },
    {
      label: "Total Com Comissão (CC)",
      value: formatCentsToBRL(stats.totalCC),
      sub: "Soma de todos os subtotais CC",
      icon: <Percent size={16} />,
      variant: "accent" as const,
    },
    {
      label: "Total Sem Comissão (SC)",
      value: formatCentsToBRL(stats.totalSC),
      sub: "Soma de todos os subtotais SC",
      icon: <TrendingUp size={16} />,
      variant: "success" as const,
    },
  ];

  return (
    <div className="nm-grid-3" style={{ gap: "1rem" }}>
      {cards.map((card) => (
        <div key={card.label} className="nm-stat-card" style={{ padding: "0.75rem 1.25rem", gap: "0.4rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <div className={`nm-icon-circle nm-icon-circle--${card.variant}`} style={{ width: "24px", height: "24px", minWidth: "24px" }}>
              {card.icon}
            </div>
            <span className="nm-stat-card__label" style={{ textTransform: "none", letterSpacing: "normal", fontSize: "var(--nm-text-sm)", margin: 0 }}>
              {card.label}
            </span>
          </div>
          <div className="nm-stat-card__value nm-stat-card__value--accent" style={{ fontSize: "var(--nm-text-xl)" }}>
            {card.value}
          </div>
          <div className="nm-stat-card__label" style={{ marginTop: "0", fontSize: "10px", opacity: 0.8 }}>
            {card.sub}
          </div>
        </div>
      ))}
    </div>
  );
}
