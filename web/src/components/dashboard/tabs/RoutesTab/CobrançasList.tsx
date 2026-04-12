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
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCobrancas = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${serverUrl}/api/routes/${routeId}/cobrancas`, {
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
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Header with Back Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 hover:text-white transition-all border border-white/10"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={16} className="text-purple-400" />
              <h1 className="text-2xl font-bold tracking-tight">{routeName}</h1>
            </div>
            <p className="text-gray-500 text-sm">Histórico de cobranças e viagens realizadas.</p>
          </div>
        </div>

        <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl px-6 py-3">
          <History size={18} className="text-purple-400 mr-2" />
          <span className="text-sm font-bold text-white uppercase tracking-wider">{cobrancas.length} VIAGENS</span>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {cobrancas.length === 0 ? (
            <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-20 flex flex-col items-center justify-center text-center">
              <List size={48} className="text-gray-600 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Nenhuma viagem registrada</h3>
              <p className="text-gray-500 max-w-sm">
                Ainda não foram realizadas viagens ou cobranças nesta rota.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cobrancas.map((c) => (
                <div 
                  key={c.id} 
                  className={`bg-white/[0.02] border border-white/10 rounded-3xl p-6 hover:bg-white/[0.04] transition-all group relative overflow-hidden`}
                >
                  <div className={`absolute top-0 right-0 p-3 ${c.status === 'aberta' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                    {c.status === 'aberta' ? (
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        Em Aberto
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
                        <CheckCircle2 size={12} />
                        Encerrada
                      </div>
                    )}
                  </div>

                  <div className="mb-6">
                    <span className="text-[10px] font-mono font-black text-gray-500 uppercase tracking-widest">Viagem #</span>
                    <h3 className="text-3xl font-black text-white italic -mt-1 group-hover:text-purple-400 transition-colors">
                      {String(c.code).padStart(3, '0')}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <Calendar size={16} className="text-gray-600" />
                      <span>{format(new Date(c.startDate), "dd 'de' MMMM", { locale: ptBR })}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <Clock size={16} className="text-gray-600" />
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-gray-600">Início</span>
                        <span className="text-white font-medium">{format(new Date(c.startDate), "HH:mm'h'")}</span>
                      </div>
                      {c.endDate && (
                        <div className="flex flex-col ml-4">
                          <span className="text-[10px] uppercase font-bold text-gray-600">Fim</span>
                          <span className="text-white font-medium">{format(new Date(c.endDate), "HH:mm'h'")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-4 border-t border-white/5">
                    <button className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
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
