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
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 overflow-hidden">
      <div 
        className="absolute inset-0 bg-[#050505]/90 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onClose} 
      />

      <div className="relative w-full max-w-lg h-[80vh] sm:h-auto bg-[#0c0c0c] border-t sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-500 ease-out">
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-4 mb-2 sm:hidden shrink-0" />

        <header className="px-6 py-4 sm:p-8 border-b border-white/5 flex items-center justify-between shrink-0 bg-gradient-to-r from-purple-500/5 to-transparent">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/10 rounded-xl sm:rounded-2xl flex items-center justify-center border border-purple-500/20">
              <Map className="text-purple-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {route ? "Editar Rota" : "Nova Rota"}
              </h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                {route ? `Código: ${String(route.code).padStart(3, '0')}` : "Configuração de Setor"}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-all outline-none"
          >
            <X size={24} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col">
          <div className="p-6 sm:p-8 space-y-6 flex-1 pb-32 sm:pb-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                Nome da Rota / Descrição Curta
              </label>
              <input 
                required
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-purple-500 focus:bg-white/[0.06] outline-none transition-all placeholder:text-gray-600"
                placeholder="Ex: Rota Centro / Bairro Novo"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                Periodicidade (Dias para Vencimento)
              </label>
              <div className="relative">
                <Clock className="absolute left-4 top-4 text-gray-500" size={18} />
                <input 
                  type="number"
                  required
                  min="1"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-white focus:border-purple-500 focus:bg-white/[0.06] outline-none transition-all placeholder:text-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="Ex: 30"
                  value={formData.periodicity}
                  onChange={e => setFormData({ ...formData, periodicity: e.target.value })}
                />
                <span className="absolute right-5 top-4 text-xs font-bold text-gray-500 uppercase">dias</span>
              </div>
              <p className="text-[10px] text-gray-600 font-medium ml-1 leading-relaxed">
                Define quantos dias a ficha terá de prazo a partir da abertura.
              </p>
            </div>
          </div>

          <footer className="fixed sm:relative bottom-0 left-0 right-0 p-6 sm:p-8 border-t border-white/5 bg-[#0c0c0c] sm:bg-black/20 flex gap-4 shrink-0">
            <button 
              type="button"
              onClick={onClose}
              className="hidden sm:block flex-1 py-4 text-sm font-bold text-gray-400 hover:text-white transition-all bg-white/5 hover:bg-white/10 rounded-2xl"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-[2] sm:flex-1 py-4 bg-white text-black rounded-2xl text-sm font-black flex items-center justify-center gap-2 hover:bg-purple-400 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-white/5"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              {route ? "Salvar Alterações" : "Criar Rota"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
