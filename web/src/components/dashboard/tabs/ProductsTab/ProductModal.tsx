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

  const inputClass = `
    w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3
    text-sm text-white placeholder-gray-500
    focus:outline-none focus:border-purple-500 focus:bg-white/[0.06]
    transition-all duration-200
    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
  `;

  const labelClass = "block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#050505]/90 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl h-[95vh] sm:h-auto sm:max-h-[90vh] bg-[#0f0f0f] border-t sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-500 ease-out">
        {/* Mobile drag handle */}
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-4 mb-2 sm:hidden shrink-0" />

        <header className="px-6 py-4 sm:p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-purple-500/5 to-transparent shrink-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/10 rounded-xl sm:rounded-2xl flex items-center justify-center border border-purple-500/20">
              <Package className="text-purple-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Novo Produto</h2>
              <p className="text-[10px] sm:text-xs text-gray-400">Preencha as informações do estoque.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-all"
          >
            <X size={24} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="px-6 py-4 sm:p-8 overflow-y-auto custom-scrollbar flex-1">
          <div className="space-y-6">
            {/* Main Info */}
            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl space-y-5">
              <div className="flex items-center gap-2 text-purple-400 border-b border-white/5 pb-3">
                <Info size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Informações Básicas</span>
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
                      className={`${inputClass} opacity-40 bg-black/20`}
                      placeholder="SET"
                      value={formData.sku}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Estoque</label>
                    <input 
                      type="number"
                      className={`${inputClass} opacity-40 bg-black/20`}
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
            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl space-y-5">
              <div className="flex items-center gap-2 text-emerald-400 border-b border-white/5 pb-3">
                <DollarSign size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Precificação</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Custo</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-xs text-gray-500 font-bold">R$</span>
                    <input 
                      className={`${inputClass} pl-10`}
                      placeholder="0,00"
                      value={formData.costPrice}
                      onChange={e => setFormData({...formData, costPrice: applyCurrencyMask(e.target.value)})}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Preço Com Comissão</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-xs text-purple-400 font-bold">R$</span>
                    <input 
                      className={`${inputClass} pl-10 border-purple-500/10 focus:border-purple-500`}
                      placeholder="0,00"
                      value={formData.priceCC}
                      onChange={e => setFormData({...formData, priceCC: applyCurrencyMask(e.target.value)})}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Preço Sem Comissão</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-xs text-emerald-400 font-bold">R$</span>
                    <input 
                      className={`${inputClass} pl-10 border-emerald-500/10 focus:border-emerald-500`}
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

        <footer className="relative px-6 py-6 sm:px-8 sm:py-6 bg-zinc-950 border-t border-white/5 flex gap-3 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            disabled={loading}
            className="hidden sm:block flex-1 py-4 px-6 text-sm font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-2xl transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="flex-[2] py-4 px-6 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-xl shadow-purple-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save size={18} className="group-hover:rotate-12 transition-transform" />
                Salvar Produto
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}
