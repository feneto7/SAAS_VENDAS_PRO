import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BarChart3, ShieldCheck, Zap } from "lucide-react";

export default async function HomePage() {
  const { userId } = await auth();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505]">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-purple-600/20 blur-[120px] rounded-full opacity-50 pointer-events-none" />

      {/* Header */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Zap className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 tracking-tight">
            Vendas<span className="text-white">Pro</span>
          </span>
        </div>
        
        <div className="flex gap-4">
          {!userId ? (
            <>
              <SignInButton mode="modal">
                <button className="text-sm font-medium text-gray-400 hover:text-white transition-colors px-4 py-2">
                  Entrar
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="bg-white text-black text-sm font-semibold h-10 px-5 rounded-full hover:bg-gray-200 transition-all shadow-xl">
                  Começar Grátis
                </button>
              </SignUpButton>
            </>
          ) : (
            <>
              <Link href="/dashboard" className="text-sm font-medium text-gray-400 hover:text-white transition-colors px-4 py-2 self-center">
                Dashboard
              </Link>
              <UserButton />
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 pt-20 pb-32 px-6 max-w-7xl mx-auto text-center lg:text-left grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-purple-400 text-xs font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            Novo: Análise preditiva com IA agora disponível
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
            Acelere suas vendas com <span className="text-white">Inteligência Real.</span>
          </h1>
          
          <p className="text-lg text-gray-400 mb-10 max-w-xl mx-auto lg:mx-0">
            Gerencie múltiplos projetos, automatize seus relatórios e receba insights inteligentes para aumentar sua conversão em tempo real.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold h-14 px-8 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-2xl shadow-purple-500/20 group">
              Explorar Plataforma
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="bg-white/5 border border-white/10 text-white font-semibold h-14 px-8 rounded-2xl hover:bg-white/10 transition-all backdrop-blur-sm">
              Agendar Demo
            </button>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 flex flex-wrap justify-center lg:justify-start gap-8 opacity-40 grayscale pointer-events-none">
            <div className="flex items-center gap-2 text-sm font-bold"><ShieldCheck className="w-5 h-5" /> SEGURANÇA BANCÁRIA</div>
            <div className="flex items-center gap-2 text-sm font-bold"><BarChart3 className="w-5 h-5" /> 100% DATA DRIVEN</div>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full translate-x-1/2" />
          <div className="relative aspect-square max-w-md mx-auto xl:max-w-none">
             <div className="absolute inset-0 border border-white/10 rounded-3xl backdrop-blur-md bg-white/5 overflow-hidden shadow-2xl">
                <div className="absolute top-0 inset-x-0 h-12 border-b border-white/10 bg-white/5 flex items-center px-4 gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500/50" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                    <div className="w-2 h-2 rounded-full bg-green-500/50" />
                </div>
                <div className="pt-16 px-8 flex flex-col gap-6">
                    <div className="h-4 w-1/3 bg-white/10 rounded-full animate-pulse" />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="h-32 bg-white/5 rounded-2xl border border-white/10 flex flex-col p-4 gap-2">
                            <div className="h-3 w-1/2 bg-white/10 rounded-full" />
                            <div className="mt-auto h-8 w-full bg-gradient-to-r from-purple-600/30 to-blue-500/30 rounded-lg" />
                        </div>
                        <div className="h-32 bg-white/5 rounded-2xl border border-white/10 flex flex-col p-4 gap-2">
                            <div className="h-3 w-3/4 bg-white/10 rounded-full" />
                            <div className="mt-auto flex items-end gap-1">
                                {[30, 50, 40, 80, 60].map((h, i) => (
                                    <div key={i} className="flex-1 bg-blue-500/40 rounded-t-sm" style={{ height: `${h}%` }} />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="h-24 bg-white/5 rounded-2xl border border-white/10 flex items-center px-6 gap-4">
                        <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center">
                            <Zap className="w-6 h-6 text-purple-400" />
                        </div>
                        <div className="flex-1 space-y-2">
                             <div className="h-3 w-2/3 bg-white/10 rounded-full" />
                             <div className="h-2 w-1/2 bg-white/5 rounded-full" />
                        </div>
                    </div>
                </div>
             </div>
          </div>
        </div>
      </main>

      {/* Footer / Features Section */}
      <footer className="relative z-10 border-t border-white/10 py-12 px-6 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-gray-500 text-sm">
          <p>© 2026 VendasPro. Desenvolvido com Antigravity Intelligence.</p>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-white transition-colors">Politica de Privacidade</Link>
            <Link href="#" className="hover:text-white transition-colors">Termos de Uso</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
