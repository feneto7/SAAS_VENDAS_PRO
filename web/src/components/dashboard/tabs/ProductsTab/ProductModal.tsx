"use client";

import { useState, useEffect } from "react";
import { X, Save, Package, DollarSign, Tag, Info } from "lucide-react";
import { applyCurrencyMask, parseBRLToCents } from "@/utils/money";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  serverUrl: string;
  tenantSlug: string;
}

export function ProductModal({ isOpen, onClose, onSuccess, serverUrl, tenantSlug }: ProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    brand: "",
    stockDeposit: "0",
    costPrice: "0",
    priceCC: "0",
    priceSC: "0",
  });

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name) return alert("O nome do produto é obrigatório");

    try {
      setLoading(true);
      const res = await fetch(`${serverUrl}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-slug": tenantSlug,
        },
        body: JSON.stringify({
          ...formData, // Spread existing
          costPrice: parseBRLToCents(formData.costPrice),
          priceCC:   parseBRLToCents(formData.priceCC),
          priceSC:   parseBRLToCents(formData.priceSC),
        }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const error = await res.json();
        alert(error.error || "Erro ao salvar produto");
      }
    } catch (err) {
      console.error("Save product error:", err);
      alert("Falha na comunicação com o servidor");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "nm-input";
  const labelClass = "nm-input-group__label mb-1";

  return (
    <div className="nm-modal-backdrop" onClick={onClose}>
      {/* Modal Content */}
      <div className="nm-modal nm-modal--lg" onClick={(e) => e.stopPropagation()}>

        <header className="nm-modal__header">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div className="nm-icon-circle nm-icon-circle--accent nm-icon-circle--lg">
              <Package size={20} />
            </div>
            <div>
              <h2 className="nm-modal__title">Novo Produto</h2>
              <p className="nm-modal__subtitle" style={{ textTransform: "uppercase", fontWeight: "bold", fontSize: "10px" }}>Preencha as informações do estoque.</p>
            </div>
          </div>
          <button onClick={onClose} className="nm-modal__close">
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="nm-modal__body custom-scrollbar">
          <div className="space-y-6">
            {/* Main Info */}
            <div className="nm-card nm-card--sm" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div className="flex items-center gap-2 mb-4">
                <Info size={16} className="nm-text-accent" />
                <span className="nm-heading">Informações Básicas</span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Descrição / Nome <span className="text-red-500">*</span></label>
                  <input 
                    className={inputClass} 
                    placeholder="Ex: Arroz Tio João 5kg"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Código SKU</label>
                    <input 
                      className={`${inputClass}`}
                      style={{ opacity: 0.6 }}
                      placeholder="SET"
                      value={formData.sku}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Estoque</label>
                    <input 
                      type="number"
                      className={`${inputClass}`}
                      style={{ opacity: 0.6 }}
                      placeholder="0"
                      value={formData.stockDeposit}
                      readOnly
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Categoria</label>
                    <input 
                      className={inputClass} 
                      placeholder="Ex: Cereais"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Marca</label>
                    <input 
                      className={inputClass} 
                      placeholder="Ex: Tio João"
                      value={formData.brand}
                      onChange={e => setFormData({...formData, brand: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Info */}
            <div className="nm-card nm-card--sm" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div className="flex items-center gap-2 mb-4">
                <DollarSign size={16} className="nm-text-accent" />
                <span className="nm-heading">Precificação</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Custo</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold nm-text-muted">R$</span>
                    <input 
                      className={`${inputClass}`}
                      style={{ paddingLeft: "2rem" }}
                      placeholder="0,00"
                      value={formData.costPrice}
                      onChange={e => setFormData({...formData, costPrice: applyCurrencyMask(e.target.value)})}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Preço Com Comissão</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-purple-400">R$</span>
                    <input 
                      className={`${inputClass}`}
                      style={{ paddingLeft: "2rem", borderColor: "rgba(168, 85, 247, 0.3)" }}
                      placeholder="0,00"
                      value={formData.priceCC}
                      onChange={e => setFormData({...formData, priceCC: applyCurrencyMask(e.target.value)})}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Preço Sem Comissão</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-400">R$</span>
                    <input 
                      className={`${inputClass}`}
                      style={{ paddingLeft: "2rem", borderColor: "rgba(16, 185, 129, 0.3)" }}
                      placeholder="0,00"
                      value={formData.priceSC}
                      onChange={e => setFormData({...formData, priceSC: applyCurrencyMask(e.target.value)})}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        <footer className="nm-modal__footer">
          <button type="button" onClick={onClose} disabled={loading} className="nm-btn nm-btn--flat" style={{ flex: 1 }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={loading} className="nm-btn nm-btn--accent" style={{ flex: 1 }}>
            {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
            Salvar Produto
          </button>
        </footer>
      </div>
    </div>
  );
}
