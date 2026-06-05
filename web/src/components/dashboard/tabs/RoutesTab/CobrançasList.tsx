"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, Clock, CheckCircle2, History, List, MapPin } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Cobranca {
  id: string;
  code: number;
  status: "aberta" | "encerrada";
  startDate: string;
  endDate?: string;
  sellerId: string;
}

interface CobrancasListProps {
  routeId: string;
  routeName: string;
  serverUrl: string;
  tenantSlug: string;
  onBack: () => void;
}

export function CobrancasList({ routeId, routeName, serverUrl, tenantSlug, onBack }: CobrancasListProps) {
  const [collections, setCobrancas] = useState<Cobranca[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCobrancas = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${serverUrl}/api/routes/${routeId}/collections`, {
        headers: { "x-tenant-slug": tenantSlug }
      });
      if (res.ok) {
        setCobrancas(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCobrancas();
  }, [routeId]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Header with Back Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="nm-icon-circle"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={16} className="nm-text-accent" />
              <h1 className="nm-heading text-2xl">{routeName}</h1>
            </div>
            <p className="nm-text-muted text-sm">Histórico de cobranças e viagens realizadas.</p>
          </div>
        </div>

        <div className="nm-card nm-card--sm flex items-center px-6 py-3" style={{ padding: "0.75rem 1.5rem" }}>
          <History size={18} className="nm-text-accent mr-2" />
          <span className="text-sm font-bold nm-text-primary uppercase tracking-wider">{collections.length} VIAGENS</span>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="pt-12 space-y-4">
          {collections.length === 0 ? (
            <div className="nm-card nm-card--lg p-20 flex flex-col items-center justify-center text-center">
              <List size={48} className="nm-text-muted mb-4" />
              <h3 className="text-xl font-bold nm-text-primary mb-2">Nenhuma viagem registrada</h3>
              <p className="nm-text-secondary max-w-sm">
                Ainda não foram realizadas viagens ou cobranças nesta rota.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {collections.map((c) => (
                <div 
                  key={c.id} 
                  className="nm-card nm-card--sm group relative overflow-hidden flex flex-col"
                >
                  <div className={`absolute top-0 right-0 p-3 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${c.status === 'aberta' ? 'nm-text-warning' : 'nm-text-success'}`}>
                    {c.status === 'aberta' ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--nm-warning)" }} />
                        Em Aberto
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={12} />
                        Encerrada
                      </>
                    )}
                  </div>

                  <div className="mb-6">
                    <span className="text-[10px] font-mono font-black nm-text-muted uppercase tracking-widest">Viagem #</span>
                    <h3 className="text-3xl font-black nm-text-primary italic -mt-1 group-hover:nm-text-accent transition-colors">
                      {String(c.code).padStart(3, '0')}
                    </h3>
                  </div>

                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3 text-sm nm-text-secondary">
                      <Calendar size={16} className="nm-text-muted" />
                      <span>{format(new Date(c.startDate), "dd 'de' MMMM", { locale: ptBR })}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm nm-text-secondary">
                      <Clock size={16} className="nm-text-muted" />
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold nm-text-muted">Início</span>
                        <span className="nm-text-primary font-medium">{format(new Date(c.startDate), "HH:mm'h'")}</span>
                      </div>
                      {c.endDate && (
                        <div className="flex flex-col ml-4">
                          <span className="text-[10px] uppercase font-bold nm-text-muted">Fim</span>
                          <span className="nm-text-primary font-medium">{format(new Date(c.endDate), "HH:mm'h'")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-4" style={{ borderTop: "1px solid var(--nm-border)" }}>
                    <button className="nm-btn nm-btn--flat w-full">
                      Ver Fichas da Viagem
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
