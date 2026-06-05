"use client";

import React from 'react';
import { Edit2, ShieldAlert, ShieldCheck, Mail, Phone, Hash, Map, Package, Globe } from 'lucide-react';
import { Employee } from '@/types/employee.types';

const ROUTE_COLORS = [
  'var(--nm-accent)',
  'var(--nm-success)',
  'var(--nm-info)',
  'var(--nm-warning)',
  'var(--nm-danger)',
];

const getRouteColor = (id: string) => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return ROUTE_COLORS[hash % ROUTE_COLORS.length];
};

interface Props {
  employees: Employee[];
  loading: boolean;
  onEdit: (employee: Employee) => void;
  onToggleStatus: (id: string) => void;
  onViewStock: (employee: Employee) => void;
}

export default function EmployeeList({ employees, loading, onEdit, onToggleStatus, onViewStock }: Props) {
  if (loading) {
    return (
      <div className="nm-table-wrapper">
        <div className="nm-table-scroll">
          <table className="nm-table">
            <thead>
              <tr>
                <th>Colaborador</th>
                <th>Cargo / Código</th>
                <th>Contato</th>
                <th>Rotas</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((i) => (
                <tr key={i}>
                  <td><div className="nm-skeleton" style={{ width: "120px" }} /></td>
                  <td><div className="nm-skeleton" style={{ width: "80px" }} /></td>
                  <td><div className="nm-skeleton" style={{ width: "100px" }} /></td>
                  <td><div className="nm-skeleton" style={{ width: "60px" }} /></td>
                  <td><div className="nm-skeleton" style={{ width: "80px", float: "right" }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="nm-card nm-card--inset" style={{ textAlign: "center", padding: "4rem 2rem" }}>
        <div className="nm-icon-circle nm-icon-circle--lg" style={{ margin: "0 auto 1rem" }}>
          <Hash size={32} />
        </div>
        <h3 className="nm-subheading" style={{ marginBottom: "0.5rem" }}>Nenhum funcionário encontrado</h3>
        <p className="nm-caption">Cadastre o seu primeiro colaborador para começar.</p>
      </div>
    );
  }

  return (
    <div className="nm-table-wrapper">
      <div className="nm-table-scroll">
        <table className="nm-table">
          <thead>
            <tr>
              <th>Colaborador</th>
              <th>Cargo / Código</th>
              <th>Contato</th>
              <th>Rotas</th>
              <th style={{ textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} style={{ opacity: emp.active ? 1 : 0.5, transition: "opacity 0.2s ease" }}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div className="nm-avatar" style={{ '--avatar-color': emp.active ? 'var(--nm-success)' : 'var(--nm-text-muted)' } as any}>
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600, color: "var(--nm-text-primary)", textTransform: "uppercase" }}>
                      {emp.name}
                    </span>
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span className="nm-badge nm-badge--sm" style={{ fontWeight: 700 }}>
                        {emp.role === 'seller' ? 'Vendedor' : emp.role === 'admin' ? 'Administrador' : emp.role}
                      </span>
                      {emp.webAccess && (
                        <span className="nm-badge nm-badge--info nm-badge--sm" title="Acesso Web Ativo">
                          <Globe size={10} /> Web
                        </span>
                      )}
                    </div>
                    <span className="nm-caption" style={{ fontFamily: "monospace" }}>APP: {emp.appCode || '---'}</span>
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                    <span style={{ fontWeight: 600, fontSize: "var(--nm-text-sm)", color: "var(--nm-text-primary)" }}>{emp.phone || '---'}</span>
                    <span className="nm-caption" style={{ display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden", maxWidth: "150px" }}>{emp.email}</span>
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                    {emp.routeIds?.length > 0 ? (
                      emp.routeIds.slice(0, 3).map((rid) => (
                        <div key={rid} style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: getRouteColor(rid), boxShadow: "var(--nm-shadow-inner)" }} title="Rota ativa" />
                      ))
                    ) : (
                      <span className="nm-caption" style={{ fontStyle: "italic" }}>Nenhuma</span>
                    )}
                    {emp.routeIds?.length > 3 && <span className="nm-caption" style={{ fontWeight: 700 }}>+{emp.routeIds.length - 3}</span>}
                  </div>
                </td>
                <td className="nm-actions-col">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.3rem" }}>
                    {emp.role === 'seller' && (
                      <button 
                        onClick={() => onViewStock(emp)}
                        className="nm-btn nm-btn--circle nm-btn--xs"
                        style={{ color: "var(--nm-info)" }}
                        title="Ver Estoque"
                      >
                        <Package size={14} />
                      </button>
                    )}
                    <button 
                      onClick={() => onEdit(emp)}
                      className="nm-btn nm-btn--circle nm-btn--xs"
                      title="Editar"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => onToggleStatus(emp.id)}
                      className={`nm-btn nm-btn--circle nm-btn--xs ${emp.active ? 'nm-btn--danger' : 'nm-btn--success'}`}
                      title={emp.active ? "Desativar" : "Ativar"}
                    >
                      {emp.active ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
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
