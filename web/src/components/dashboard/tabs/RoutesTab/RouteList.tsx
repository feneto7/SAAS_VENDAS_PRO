"use client";

import { Edit2, ExternalLink, Power, Users, Clock, MapPin } from "lucide-react";
import type { Route } from "@/types/route.types";

interface RouteListProps {
  routes: Route[];
  onEdit: (route: Route) => void;
  onToggleStatus: (id: string) => void;
  onOpenRoute: (route: Route) => void;
}

export function RouteList({ routes, onEdit, onToggleStatus, onOpenRoute }: RouteListProps) {
  if (routes.length === 0) {
    return (
      <div className="nm-card nm-card--inset" style={{ textAlign: "center", padding: "4rem 2rem" }}>
        <div className="nm-icon-circle nm-icon-circle--lg" style={{ margin: "0 auto 1rem" }}>
          <MapPin size={32} />
        </div>
        <h3 className="nm-subheading" style={{ marginBottom: "0.5rem" }}>Nenhuma rota encontrada</h3>
        <p className="nm-caption" style={{ maxWidth: "400px", margin: "0 auto" }}>
          Você ainda não cadastrou nenhuma rota de venda. Clique no botão "Nova Rota" para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="nm-table-wrapper">
      <div className="nm-table-scroll">
        <table className="nm-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Descrição / Nome</th>
              <th>Periodicidade</th>
              <th style={{ textAlign: "center" }}>Clientes</th>
              <th style={{ textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((route) => (
              <tr key={route.id} style={{ opacity: route.active ? 1 : 0.5, transition: "opacity 0.2s ease" }}>
                <td>
                  <span className="nm-code">
                    {String(route.code).padStart(3, '0')}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontWeight: 600, color: "var(--nm-text-primary)" }}>
                      {route.name}
                    </span>
                    {route.description && (
                      <span className="nm-cell--muted" style={{ display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {route.description}
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }} className="nm-cell--muted">
                    <Clock size={14} />
                    {route.periodicity} dias
                  </div>
                </td>
                <td style={{ textAlign: "center" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }} className="nm-badge nm-badge--info">
                    <Users size={12} />
                    {route.clientCount}
                  </div>
                </td>
                <td className="nm-actions-col">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.3rem" }}>
                    <button 
                      onClick={() => onOpenRoute(route)}
                      title="Abrir Rota"
                      className="nm-btn nm-btn--circle nm-btn--xs"
                    >
                      <ExternalLink size={14} />
                    </button>
                    <button 
                      onClick={() => onEdit(route)}
                      title="Editar"
                      className="nm-btn nm-btn--circle nm-btn--xs"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => onToggleStatus(route.id)}
                      title={route.active ? "Desativar" : "Ativar"}
                      className={`nm-btn nm-btn--circle nm-btn--xs ${route.active ? 'nm-btn--danger' : 'nm-btn--success'}`}
                    >
                      <Power size={14} />
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
