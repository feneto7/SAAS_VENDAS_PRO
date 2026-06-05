"use client";

import { useState, useEffect } from "react";
import { X, Copy, Check, MessageSquare, ExternalLink, Link as LinkIcon, User, Map, Loader2, Share2, Sparkles, QrCode } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Cookies from "js-cookie";
import { CustomSelect } from "@/components/dashboard/shared/CustomSelect";
import { SearchableSelect } from "@/components/dashboard/shared/SearchableSelect";
import { useIsMobile } from "@/hooks/useIsMobile";
import { copyToClipboard } from "@/utils/clipboard";

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
  const { user } = useAuth();
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
      const token = Cookies.get("vendas_token");
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
      const token = Cookies.get("vendas_token");
      const res = await fetch(`${SERVER_URL}/api/cards/generate-link`, {
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

  const handleCopy = async () => {
    if (generatedLink) {
      const success = await copyToClipboard(generatedLink);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
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
    <div className="nm-modal-backdrop" onClick={onClose}>
      {/* Modal Content */}
      <div className="nm-modal nm-modal--md" onClick={(e) => e.stopPropagation()}>
        
        <header className="nm-modal__header">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div className="nm-icon-circle nm-icon-circle--accent nm-icon-circle--lg">
              <LinkIcon size={20} />
            </div>
            <div>
              <h2 className="nm-modal__title">Ficha Link</h2>
              <p className="nm-modal__subtitle" style={{ textTransform: "uppercase", fontWeight: "bold", fontSize: "10px" }}>
                {generatedLink ? 'Link pronto para envio' : 'Configure o acesso do cliente'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="nm-modal__close">
            <X size={18} />
          </button>
        </header>

        <div className="nm-modal__body custom-scrollbar">
          
          {!generatedLink ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Route */}
              <div>
                <label className="nm-input-group__label mb-1">1. Qual é a Rota?</label>
                <CustomSelect
                  value={selectedRouteId}
                  onChange={(val) => setSelectedRouteId(val)}
                  options={routes.map(r => ({ value: r.id, label: `${r.name} (${String(r.code).padStart(3, '0')})` }))}
                  placeholder="Selecione a Rota..."
                />
              </div>

              {/* Client */}
              <div className={`transition-all ${!selectedRouteId ? 'opacity-30 grayscale' : ''}`}>
                <label className="nm-input-group__label mb-1">2. Localizar Cliente</label>
                <SearchableSelect
                  value={selectedClientId}
                  onChange={(val) => setSelectedClientId(val)}
                  options={clients.map(c => ({ value: c.id, label: c.name }))}
                  placeholder={selectedRouteId ? "Comece a digitar o nome..." : "Primeiro selecione uma rota"}
                  disabled={!selectedRouteId}
                />
              </div>

              {/* Seller */}
              <div>
                <label className="nm-input-group__label mb-1">3. Vendedor Responsável</label>
                <CustomSelect
                  value={selectedSellerId}
                  onChange={(val) => setSelectedSellerId(val)}
                  options={sellers.map(s => ({ value: s.id, label: `${s.name} (${s.appCode})` }))}
                  placeholder="Quem está atendendo?"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-8 py-2 animate-in zoom-in-95 duration-500">
              
              {/* Success Visual */}
              <div className="text-center space-y-4">
                <div className="relative mx-auto w-24 h-24">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-[2.5rem] animate-ping" />
                  <div className="relative w-full h-full bg-emerald-500/20 border-2 border-emerald-500/20 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                    <Check size={40} className="text-emerald-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[var(--nm-text-primary)] tracking-tight">Link Criado!</h3>
                  <p className="nm-modal__subtitle mt-2" style={{ textTransform: "uppercase", fontWeight: "bold", fontSize: "10px" }}>Pronto para ser compartilhado com o cliente</p>
                </div>
              </div>

              {/* Share Card */}
              <div className="nm-card nm-card--sm space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode size={14} className="text-purple-400" />
                    <span className="text-[10px] font-black text-[var(--nm-text-muted)] uppercase tracking-widest">Endereço da Ficha</span>
                  </div>
                  <button 
                    onClick={handleCopy}
                    className="group py-2 px-4 bg-[var(--nm-bg-elevated)] hover:bg-emerald-500 hover:text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
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

                <div className="bg-[var(--nm-bg-elevated)] border border-[var(--nm-border)] rounded-2xl p-4">
                  <p className="text-[var(--nm-text-primary)] text-xs font-mono truncate opacity-80">
                    {generatedLink}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  <button 
                    onClick={handleShareWhatsApp}
                    className="nm-btn nm-btn--success"
                    style={{ fontSize: "10px", width: "100%", justifyContent: "center" }}
                  >
                    <MessageSquare size={16} />
                    Enviar WhatsApp
                  </button>
                  <a 
                    href={generatedLink} 
                    target="_blank" 
                    className="nm-btn nm-btn--flat"
                    style={{ fontSize: "10px", width: "100%", justifyContent: "center" }}
                  >
                    <ExternalLink size={16} />
                    Ver Ficha
                  </a>
                </div>
              </div>

              <div className="text-center pt-6">
                <button 
                  onClick={onClose}
                  className="nm-btn nm-btn--flat"
                  style={{ minWidth: "200px" }}
                >
                  Fechar Janela
                </button>
              </div>
            </div>
          )}
        </div>

        {!generatedLink && (
          <footer className="nm-modal__footer">
            <button type="button" onClick={onClose} disabled={loading} className="nm-btn nm-btn--flat" style={{ flex: 1 }}>
              Cancelar
            </button>
            <button onClick={handleGenerate} disabled={loading || !selectedClientId} className="nm-btn nm-btn--accent" style={{ flex: 1 }}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              Gerar Link
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}
