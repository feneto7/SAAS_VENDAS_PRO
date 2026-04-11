"use client";

import { useState, useEffect } from "react";
import { X, Copy, Check, MessageSquare, ExternalLink, Link as LinkIcon, User, Map, Loader2 } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { CustomSelect } from "@/components/dashboard/shared/CustomSelect";
import { SearchableSelect } from "@/components/dashboard/shared/SearchableSelect";

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
      const headers = { 
        "Authorization": `Bearer ${await getToken()}`,
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
        // Construct full URL
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-purple-500/10 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <LinkIcon size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Gerar Ficha Link</h2>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Inicie um pedido para o cliente</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
          {!generatedLink ? (
            <div className="space-y-6">
              {/* Route */}
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Selecione a Rota</label>
                <div className="relative group">
                  <CustomSelect
                    value={selectedRouteId}
                    onChange={(val) => setSelectedRouteId(val)}
                    options={routes.map(r => ({ value: r.id, label: `${r.name} (${String(r.code).padStart(3, '0')})` }))}
                    placeholder="Selecione a Rota..."
                  />
                </div>
              </div>

              {/* Client */}
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Selecione o Cliente</label>
                <div className="relative group">
                  <SearchableSelect
                    value={selectedClientId}
                    onChange={(val) => setSelectedClientId(val)}
                    options={clients.map(c => ({ value: c.id, label: c.name }))}
                    placeholder={selectedRouteId ? "Pesquisar Cliente..." : "Selecione uma rota primeiro"}
                    className={!selectedRouteId ? "opacity-50 pointer-events-none" : ""}
                    disabled={!selectedRouteId}
                  />
                </div>
              </div>

              {/* Seller */}
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Selecione o Vendedor Responsável</label>
                <div className="relative group">
                  <CustomSelect
                    value={selectedSellerId}
                    onChange={(val) => setSelectedSellerId(val)}
                    options={sellers.map(s => ({ value: s.id, label: `${s.name} (${s.appCode})` }))}
                    placeholder="Selecione o Vendedor..."
                  />
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-white text-black py-5 rounded-[1.5rem] font-black uppercase tracking-tighter text-sm flex items-center justify-center gap-3 hover:bg-purple-500 hover:text-white transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : <LinkIcon size={20} />}
                Gerar Link da Ficha
              </button>
            </div>
          ) : (
            <div className="space-y-8 py-4 text-center">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-500/20">
                <Check size={40} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white mb-2">Link Gerado!</h3>
                <p className="text-gray-500 text-sm">O link está pronto para ser enviado ao cliente.</p>
              </div>

              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex items-center justify-between group gap-4">
                <div className="text-left overflow-hidden">
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">URL da Ficha</p>
                  <p className="text-white text-xs font-mono truncate">{generatedLink}</p>
                </div>
                <button 
                  onClick={handleCopy}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all"
                >
                  {copied ? <Check size={20} className="text-emerald-400" /> : <Copy size={20} />}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button 
                  onClick={handleShareWhatsApp}
                  className="bg-[#25D366] text-white py-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-95"
                >
                  <MessageSquare size={16} />
                  WhatsApp
                </button>
                <a 
                  href={generatedLink} 
                  target="_blank" 
                  className="bg-white/5 text-white py-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 border border-white/10 hover:bg-white/10 transition-all active:scale-95"
                >
                  <ExternalLink size={16} />
                  Testar Link
                </a>
              </div>

              <button 
                onClick={onClose}
                className="text-gray-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
              >
                Voltar para Listagem
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
