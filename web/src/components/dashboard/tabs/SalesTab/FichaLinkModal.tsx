"use client";

import { useState, useEffect } from "react";
import { X, Copy, Check, MessageSquare, ExternalLink, Link as LinkIcon, User, Map, Loader2, Share2, Sparkles, QrCode } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { CustomSelect } from "@/components/dashboard/shared/CustomSelect";
import { SearchableSelect } from "@/components/dashboard/shared/SearchableSelect";
import { useIsMobile } from "@/hooks/useIsMobile";

interface FichaLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tenantSlug: string;
}

interface RouteItem {
  id: string;
  code: string;
  name: string;
}

interface SellerItem {
  id: string;
  name: string;
  appCode: string;
}

interface ClientItem {
  id: string;
  name: string;
  city?: string;
  routeId: string;
}

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001";

export function FichaLinkModal({ isOpen, onClose, onSuccess, tenantSlug }: FichaLinkModalProps) {
  const isMobile = useIsMobile();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [sellers, setSellers] = useState<SellerItem[]>([]);
  const [allClients, setAllClients] = useState<ClientItem[]>([]);
  const [clients, setClients] = useState<ClientItem[]>([]);

  // Selection states
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedSellerId, setSelectedSellerId] = useState("");
  
  // Result state
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
      resetForm();
    }
  }, [isOpen, tenantSlug]);

  async function fetchData() {
    try {
      const token = await getToken();
      const headers = { 
        "Authorization": `Bearer ${token}`,
        "x-tenant-slug": tenantSlug 
      };
      
      const [rRes, sRes, cRes] = await Promise.all([
        fetch(`${SERVER_URL}/api/routes?limit=1000`, { headers }).then(r => r.json()),
        fetch(`${SERVER_URL}/api/employees?limit=1000`, { headers }).then(r => r.json()),
        fetch(`${SERVER_URL}/api/clients?limit=1000`, { headers }).then(r => r.json())
      ]);

      setRoutes(rRes.items || []);
      setSellers(sRes.items || []);
      setAllClients(cRes.items || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  useEffect(() => {
    if (selectedRouteId) {
      setClients(allClients.filter(c => c.routeId === selectedRouteId));
      setSelectedClientId("");
    } else {
      setClients([]);
      setSelectedClientId("");
    }
  }, [selectedRouteId, allClients]);

  const resetForm = () => {
    setSelectedRouteId("");
    setSelectedClientId("");
    setSelectedSellerId("");
    setGeneratedLink(null);
    setCopied(false);
  };

  const handleGenerate = async () => {
    if (!selectedRouteId || !selectedClientId || !selectedSellerId) {
      alert("Preencha todos os campos");
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${SERVER_URL}/api/fichas/generate-link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "x-tenant-slug": tenantSlug
        },
        body: JSON.stringify({
          routeId: selectedRouteId,
          clientId: selectedClientId,
          sellerId: selectedSellerId,
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        const fullUrl = `${window.location.origin}${data.url}`;
        setGeneratedLink(fullUrl);
      } else {
        alert("Erro ao gerar link");
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    if (generatedLink) {
      const text = encodeURIComponent(`Olá! Segue o link para você selecionar os produtos do seu pedido: ${generatedLink}`);
      window.open(`https://wa.me/?text=${text}`, "_blank");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/95 backdrop-blur-xl animate-in fade-in duration-500" 
        onClick={onClose} 
      />

      {/* Modal Container */}
      <div className="relative w-full h-[95vh] sm:h-auto sm:max-h-[85vh] sm:max-w-xl bg-[#0c0c0c] border-t sm:border border-white/10 rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-500 ease-out">
        
        {/* Mobile Handle */}
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-4 mb-2 sm:hidden shrink-0" />

        {/* Header */}
        <header className="px-6 py-4 sm:p-8 border-b border-white/5 flex items-center justify-between shrink-0 bg-gradient-to-r from-purple-500/10 to-transparent">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20 shadow-lg shadow-purple-500/5 transition-all">
              <LinkIcon className="text-purple-400" size={isMobile ? 20 : 28} />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-none uppercase italic">Ficha Link</h2>
              <p className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-[0.2em] mt-2 opacity-70">
                {generatedLink ? 'Link pronto para envio' : 'Configure o acesso do cliente'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 sm:p-3 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-all active:scale-90">
            <X size={24} />
          </button>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 custom-scrollbar relative">
          
          {!generatedLink ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Route */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">1. Qual é a Rota?</label>
                <CustomSelect
                  value={selectedRouteId}
                  onChange={(val) => setSelectedRouteId(val)}
                  options={routes.map(r => ({ value: r.id, label: `${r.name} (${String(r.code).padStart(3, '0')})` }))}
                  placeholder="Selecione a Rota..."
                />
              </div>

              {/* Client */}
              <div className={`space-y-2 transition-all ${!selectedRouteId ? 'opacity-30 grayscale' : ''}`}>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">2. Localizar Cliente</label>
                <SearchableSelect
                  value={selectedClientId}
                  onChange={(val) => setSelectedClientId(val)}
                  options={clients.map(c => ({ value: c.id, label: c.name }))}
                  placeholder={selectedRouteId ? "Comece a digitar o nome..." : "Primeiro selecione uma rota"}
                  className="!rounded-2xl !py-4"
                  disabled={!selectedRouteId}
                />
              </div>

              {/* Seller */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">3. Vendedor Responsável</label>
                <CustomSelect
                  value={selectedSellerId}
                  onChange={(val) => setSelectedSellerId(val)}
                  options={sellers.map(s => ({ value: s.id, label: `${s.name} (${s.appCode})` }))}
                  placeholder="Quem está atendendo?"
                />
              </div>

              <div className="pt-4">
                <button
                  onClick={handleGenerate}
                  disabled={loading || !selectedClientId}
                  className="group w-full bg-white text-black py-5 rounded-[1.8rem] text-sm font-black uppercase tracking-[0.1em] flex items-center justify-center gap-3 hover:bg-purple-500 hover:text-white transition-all active:scale-95 disabled:opacity-30 shadow-2xl shadow-white/5"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />}
                  Gerar Link Mágico
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-10 py-4 animate-in zoom-in-95 duration-500">
              
              {/* Success Visual */}
              <div className="text-center space-y-4">
                <div className="relative mx-auto w-24 h-24 sm:w-32 sm:h-32">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-[2.5rem] animate-ping" />
                  <div className="relative w-full h-full bg-emerald-500/20 border-2 border-emerald-500/20 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                    <Check size={isMobile ? 40 : 56} className="text-emerald-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Link Criado!</h3>
                  <p className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-[0.2em] mt-2">Pronto para ser compartilhado com o cliente</p>
                </div>
              </div>

              {/* Share Card */}
              <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode size={14} className="text-purple-400" />
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Endereço da Ficha</span>
                  </div>
                  <button 
                    onClick={handleCopy}
                    className="group py-2 px-4 bg-white/5 hover:bg-emerald-500 hover:text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check size={14} />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy size={14} className="group-hover:rotate-12 transition-transform" />
                        Copiar
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-black/40 border border-white/5 rounded-2xl p-4 sm:p-5">
                  <p className="text-white text-xs sm:text-sm font-mono truncate opacity-60 group-hover:opacity-100 transition-opacity">
                    {generatedLink}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button 
                    onClick={handleShareWhatsApp}
                    className="w-full bg-[#25D366] text-white py-5 rounded-2xl font-black text-[10px] sm:text-xs uppercase flex items-center justify-center gap-3 hover:brightness-110 hover:scale-[1.02] transition-all active:scale-95 shadow-xl shadow-emerald-500/10"
                  >
                    <MessageSquare size={18} />
                    Enviar WhatsApp
                  </button>
                  <a 
                    href={generatedLink} 
                    target="_blank" 
                    className="w-full bg-white/5 text-white py-5 rounded-2xl font-black text-[10px] sm:text-xs uppercase flex items-center justify-center gap-3 border border-white/10 hover:bg-white/10 transition-all active:scale-95"
                  >
                    <ExternalLink size={18} />
                    Ver Ficha
                  </a>
                </div>
              </div>

              <div className="text-center pt-4">
                <button 
                  onClick={onClose}
                  className="px-8 py-3 bg-white/5 text-gray-500 hover:text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Fechar Janela
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info at generation time */}
        {!generatedLink && (
           <footer className="p-8 border-t border-white/5 bg-black/40 hidden sm:flex items-center gap-4 shrink-0">
             <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
               <Share2 size={14} className="text-gray-500" />
             </div>
             <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest leading-tight">
               O cliente poderá selecionar os produtos, ver preços atualizados e enviar o pedido diretamente para o seu WhatsApp.
             </p>
           </footer>
        )}
      </div>
    </div>
  );
}
