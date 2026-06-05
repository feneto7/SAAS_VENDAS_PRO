"use client";

import { useState, useEffect } from "react";
import { X, Map, Save, Loader2, Clock } from "lucide-react";
import type { Route } from "@/types/route.types";

interface RouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  route?: Route;
  serverUrl: string;
  tenantSlug: string;
}

export function RouteModal({ isOpen, onClose, onSuccess, route, serverUrl, tenantSlug }: RouteModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    periodicity: "30"
  });

  useEffect(() => {
    if (route) {
      setFormData({
        name: route.name,
        periodicity: String(route.periodicity)
      });
    } else {
      setFormData({
        name: "",
        periodicity: "30"
      });
    }
  }, [route, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const url = route 
        ? `${serverUrl}/api/routes/${route.id}` 
        : `${serverUrl}/api/routes`;
      
      const method = route ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-tenant-slug": tenantSlug
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        alert("Erro ao salvar rota");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="nm-modal-backdrop" onClick={onClose}>
      <div className="nm-modal nm-modal--sm" onClick={(e) => e.stopPropagation()}>

        <header className="nm-modal__header">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div className="nm-icon-circle nm-icon-circle--accent nm-icon-circle--lg">
              <Map size={20} />
            </div>
            <div>
              <h2 className="nm-modal__title">
                {route ? "Editar Rota" : "Nova Rota"}
              </h2>
              <p className="nm-modal__subtitle" style={{ textTransform: "uppercase", fontWeight: "bold", fontSize: "10px" }}>
                {route ? `Código: ${String(route.code).padStart(3, '0')}` : "Configuração de Setor"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="nm-modal__close">
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="nm-modal__body">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="nm-input-group__label mb-1">
                Nome da Rota / Descrição Curta
              </label>
              <input 
                required
                className="nm-input"
                placeholder="Ex: Rota Centro / Bairro Novo"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="nm-input-group__label mb-1">
                Periodicidade (Dias para Vencimento)
              </label>
              <div className="nm-input-group nm-input-group--with-icon">
                <Clock className="nm-input-group__icon" size={16} />
                <input 
                  type="number"
                  required
                  min="1"
                  className="nm-input"
                  style={{ paddingRight: "3rem" }}
                  placeholder="Ex: 30"
                  value={formData.periodicity}
                  onChange={e => setFormData({ ...formData, periodicity: e.target.value })}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 uppercase pointer-events-none">dias</span>
              </div>
              <p className="nm-input-group__hint mt-1">
                Define quantos dias a card terá de prazo a partir da abertura.
              </p>
            </div>
          </div>
        </form>

        <footer className="nm-modal__footer">
          <button type="button" onClick={onClose} className="nm-btn nm-btn--flat" style={{ flex: 1 }}>
            Cancelar
          </button>
          <button type="button" onClick={handleSubmit} disabled={loading} className="nm-btn nm-btn--accent" style={{ flex: 1 }}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {route ? "Salvar Alterações" : "Criar Rota"}
          </button>
        </footer>
      </div>
    </div>
  );
}
