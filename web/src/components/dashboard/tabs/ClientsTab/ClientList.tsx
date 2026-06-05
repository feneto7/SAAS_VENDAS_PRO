"use client";

import { Edit2, Power, MapPin, Phone, User, Map, ExternalLink } from "lucide-react";
import type { Client } from "@/types/client.types";

interface ClientListProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onToggleStatus: (id: string) => void;
  onOpenClient: (client: Client) => void;
}

export function ClientList({ clients, onEdit, onToggleStatus, onOpenClient }: ClientListProps) {
  if (clients.length === 0) {
    return (
      <div className="nm-card nm-card--inset" style={{ textAlign: "center", padding: "4rem 2rem" }}>
        <div className="nm-icon-circle nm-icon-circle--lg" style={{ margin: "0 auto 1rem" }}>
          <User size={32} />
        </div>
        <h3 className="nm-subheading" style={{ marginBottom: "0.5rem" }}>Nenhum cliente encontrado</h3>
        <p className="nm-caption" style={{ maxWidth: "400px", margin: "0 auto" }}>
          Ajuste seus filtros ou cadastre um novo cliente para começar.
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
              <th>Nome / Cliente</th>
              <th>Rota</th>
              <th>Telefone</th>
              <th>Endereço Completo</th>
              <th style={{ textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} style={{ opacity: client.active ? 1 : 0.5, transition: "opacity 0.2s ease" }}>
                <td>
                  <span className="nm-code">
                    {String(client.code).padStart(4, '0')}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontWeight: 600, color: "var(--nm-text-primary)" }}>
                      {client.name}
                    </span>
                    {client.cpf && <span className="nm-caption" style={{ fontFamily: "monospace" }}>{client.cpf}</span>}
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }} className="nm-cell--accent">
                    <Map size={14} />
                    {client.routeName || "Sem Rota"}
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }} className="nm-cell--muted">
                    <Phone size={14} />
                    {client.phone || "---"}
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }} className="nm-cell--muted">
                    <MapPin size={14} style={{ flexShrink: 0 }} />
                    <span style={{ display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {client.street ? `${client.street}${client.number ? `, ${client.number}` : ''} - ${client.state || ''} - ${client.city || ''}` : "Não informado"}
                    </span>
                  </div>
                </td>
                <td className="nm-actions-col">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.3rem" }}>
                    <button 
                      onClick={() => onOpenClient(client)}
                      title="Abrir Cliente"
                      className="nm-btn nm-btn--circle nm-btn--xs"
                    >
                      <ExternalLink size={14} />
                    </button>
                    <button 
                      onClick={() => onEdit(client)}
                      title="Editar"
                      className="nm-btn nm-btn--circle nm-btn--xs"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => onToggleStatus(client.id)}
                      title={client.active ? "Desativar" : "Ativar"}
                      className={`nm-btn nm-btn--circle nm-btn--xs ${client.active ? 'nm-btn--danger' : 'nm-btn--success'}`}
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
