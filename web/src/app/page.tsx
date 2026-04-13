import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BarChart3, ShieldCheck, Zap, Sparkles, Globe, Laptop } from "lucide-react";

export default async function HomePage() {
  const { userId } = await auth();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] selection:bg-purple-500/30">
      {/* Dynamic Backgrounds */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[120%] h-[600px] bg-purple-600/20 blur-[140px] rounded-full opacity-60 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full opacity-40 pointer-events-none" />

      {/* Header */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-8 max-w-7xl mx-auto backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/30 animate-in zoom-in-90 duration-500">
            <Zap className="text-white w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <span className="text-xl sm:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-500 tracking-tighter uppercase italic">
            Vendas<span className="text-white">Pro</span>
          </span>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-6">
          {!userId ? (
            <>
              <SignInButton mode="modal"><button className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all px-4 py-2 opacity-70 hover:opacity-100">Entrar</button></SignInButton>
              <SignUpButton mode="modal"><button className="bg-white text-black text-[10px] sm:text-xs font-black uppercase tracking-widest h-10 sm:h-12 px-6 rounded-full hover:bg-purple-500 hover:text-white transition-all shadow-xl shadow-white/5 active:scale-95 border border-white/10">Começar Grátis</button></SignUpButton>
            </>
          ) : (
            <>
              <Link href="/dashboard" className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all px-4 py-2">
                Dashboard
              </Link>
              <div className="scale-110">
                <UserButton />
              </div>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 pt-12 sm:pt-24 pb-32 px-6 max-w-7xl mx-auto text-center lg:text-left grid lg:grid-cols-2 gap-16 items-center">
        <div className="animate-in slide-in-from-left-8 duration-700">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 text-purple-400 text-[10px] font-black uppercase tracking-widest mb-10 mx-auto lg:mx-0 shadow-lg">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500 shadow-sm shadow-purple-500/50"></span>
            </span>
            <span className="opacity-80">Nova Inteligência Mobile Ativa</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black leading-[0.9] mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-500 tracking-tighter italic">
            Venda Mais com <br/> <span className="text-white non-italic tracking-normal">Real Power.</span>
          </h1>
          
          <p className="text-base sm:text-xl text-gray-500 mb-12 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
            A plataforma SaaS definitiva para quem não aceita menos que a perfeição operacional. Gestão de rota, estoque e vendas em tempo real, agora na palma da sua mão.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
            <button className="group relative bg-white text-black font-black uppercase tracking-[0.2em] text-xs h-16 sm:h-20 px-10 rounded-[2rem] flex items-center justify-center gap-4 hover:bg-purple-600 hover:text-white transition-all shadow-2xl shadow-white/5 active:scale-95">
              Explorar Plataforma
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </button>
            <button className="bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[10px] h-16 sm:h-20 px-10 rounded-[2rem] hover:bg-white/10 transition-all backdrop-blur-md active:scale-95">
              Agendar Demo
            </button>
          </div>

          {/* Social Proof / Badges */}
          <div className="mt-16 flex flex-wrap justify-center lg:justify-start gap-10 opacity-30 grayscale pointer-events-none grayscale-100">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em]"><ShieldCheck size={18} /> Proteção Cloud</div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em]"><Globe size={18} /> Multi-Tenant</div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em]"><Laptop size={18} /> Cross-Platform</div>
          </div>
        </div>

        {/* Hero Visual - Premium Mockup */}
        <div className="relative animate-in zoom-in-95 duration-1000 delay-300">
          <div className="absolute inset-0 bg-purple-500/10 blur-[120px] rounded-full translate-x-12 translate-y-12 animate-pulse" />
          
          <div className="relative aspect-square max-w-lg mx-auto xl:max-w-none group">
             <div className="absolute inset-0 border border-white/20 rounded-[3.5rem] backdrop-blur-3xl bg-white/[0.03] overflow-hidden shadow-[0_0_100px_rgba(168,85,247,0.15)] transition-all group-hover:border-purple-500/40 duration-700">
                {/* Browser bar */}
                <div className="absolute top-0 inset-x-0 h-14 border-b border-white/10 bg-white/5 flex items-center px-6 gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                    <div className="ml-4 h-5 w-1/2 bg-white/5 rounded-full border border-white/5" />
                </div>
                
                {/* Dashboard Mockup Content */}
                <div className="pt-20 px-10 flex flex-col gap-8">
                    <div className="h-6 w-1/3 bg-white/10 rounded-full animate-pulse" />
                    
                    <div className="grid grid-cols-2 gap-6">
                        <div className="h-40 bg-white/5 rounded-[2rem] border border-white/10 flex flex-col p-6 gap-3 group-hover:bg-white/10 transition-colors">
                            <div className="h-4 w-1/2 bg-white/10 rounded-full" />
                            <div className="mt-auto h-12 w-full bg-gradient-to-r from-purple-600/50 to-blue-500/50 rounded-2xl flex items-center justify-center">
                                <Sparkles className="text-white/40" size={20} />
                            </div>
                        </div>
                        <div className="h-40 bg-white/5 rounded-[2rem] border border-white/10 flex flex-col p-6 gap-3">
                            <div className="h-4 w-3/4 bg-white/10 rounded-full" />
                            <div className="mt-auto flex items-end gap-1.5 h-20">
                                {[30, 60, 45, 90, 70, 40, 85].map((h, i) => (
                                    <div key={i} className="flex-1 bg-purple-500/40 rounded-t-lg transition-all duration-1000" style={{ height: `${h}%` }} />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="h-32 bg-gradient-to-r from-purple-500/10 to-transparent rounded-[2rem] border border-white/10 flex items-center px-8 gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center shadow-2xl shadow-purple-600/30">
                            <Zap className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1 space-y-3">
                             <div className="h-4 w-2/3 bg-white/10 rounded-full" />
                             <div className="h-3 w-1/2 bg-white/5 rounded-full" />
                        </div>
                        <ArrowRight className="text-gray-700" size={24} />
                    </div>
                </div>
             </div>
          </div>
        </div>
      </main>

      {/* Feature Grid / Footer Label */}
      <section className="relative z-10 py-12 px-6 border-t border-white/5 bg-black/40 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex flex-col items-center md:items-start">
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-600 mb-1">Engined by</p>
             <h4 className="text-xl font-black text-white italic tracking-tighter">Antigravity<span className="text-gray-600">Core</span></h4>
          </div>
          
          <div className="flex gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">
            <Link href="#" className="hover:text-purple-400 transition-colors">Politica</Link>
            <Link href="#" className="hover:text-purple-400 transition-colors">Termos</Link>
            <Link href="#" className="hover:text-purple-400 transition-colors">Suporte</Link>
          </div>
          
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-700">© 2026 VendasPro. All Rights Reserved.</p>
        </div>
      </section>
    </div>
  );
}
