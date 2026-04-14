"use client";

import { useSignUp } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Mail, Lock, CheckCircle2, X, ChevronLeft } from "lucide-react";

interface SignUpFormProps {
  onClose: () => void;
  onSignInClick: () => void;
}

export function SignUpForm({ onClose, onSignInClick }: SignUpFormProps) {
  const { isLoaded, signUp, setActive } = useSignUp() as any;
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Password matching validation
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    if (!passwordsMatch) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signUp.create({
        emailAddress: email,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      console.error(err);
      setError(err.errors?.[0]?.message || "Ocorreu um erro ao criar a conta.");
    } finally {
      setLoading(false);
    }
  };

  const onPressVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });
      if (completeSignUp.status !== "complete") {
        console.log(JSON.stringify(completeSignUp, null, 2));
      }
      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        router.push("/setup/personal");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.errors?.[0]?.message || "Código de verificação inválido.");
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    console.log("Tentando cadastro com Google... isLoaded:", isLoaded);
    if (!isLoaded) return;
    try {
        await signUp.authenticateWithRedirect({
            strategy: "oauth_google",
            redirectUrl: window.location.origin,
            redirectUrlComplete: "/setup/personal",
        });
    } catch (err) {
        console.error("Erro fatal no cadastro com Google:", err);
        alert("Falha ao abrir cadastro do Google. Verifique o console.");
    }
  };

  const labelClass = "block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2.5 ml-1";
  const inputClass = "w-full h-12 bg-white/[0.03] border border-white/10 rounded-xl px-4 text-sm text-white outline-none focus:border-purple-500/50 focus:bg-white/[0.06] transition-all placeholder:text-gray-700 disabled:opacity-50";

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 overflow-y-auto">
      <div 
        className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-8 sm:p-10">
          {!pendingVerification ? (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black mb-2 tracking-tight text-white">Criar Conta Business</h2>
                <p className="text-gray-500 text-sm font-medium">Inicie sua jornada no VendasPro</p>
              </div>

              <div className="space-y-4 mb-8">
                <button 
                  onClick={loginWithGoogle}
                  className="w-full h-12 bg-white/[0.05] border border-white/10 rounded-xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest text-white hover:bg-white/[0.1] transition-all cursor-pointer active:scale-[0.98]"
                >
                  <img src="https://www.google.com/favicon.ico" className="w-4 h-4 brightness-200" alt="Google" />
                  Continuar com Google
                </button>
              </div>

              <div className="relative flex items-center gap-4 mb-8">
                <div className="flex-1 h-[1px] bg-white/5" />
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">ou E-mail</span>
                <div className="flex-1 h-[1px] bg-white/5" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className={labelClass}>E-mail profissional</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 w-4 h-4" />
                    <input 
                      type="email" 
                      required 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com" 
                      className={inputClass + " pl-11"}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                    <label className={labelClass}>Senha</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 w-4 h-4" />
                        <input 
                        type="password" 
                        required 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••" 
                        className={inputClass + " pl-11"}
                        disabled={loading}
                        />
                    </div>
                    </div>
                    <div>
                    <label className={labelClass}>Confirmar</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 w-4 h-4" />
                        <input 
                        type="password" 
                        required 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••" 
                        className={inputClass + " pl-11 " + (confirmPassword && !passwordsMatch ? "border-red-500/50" : "")}
                        disabled={loading}
                        />
                    </div>
                    </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                    <p className="text-red-400 text-[11px] font-medium text-center">{error}</p>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading || !passwordsMatch}
                  className="w-full h-14 bg-white text-black rounded-xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 hover:bg-purple-500 hover:text-white transition-all active:scale-95 disabled:opacity-50 disabled:grayscale mt-2 shadow-xl shadow-white/5"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Criar minha conta
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                  Já tem uma conta?{" "}
                  <button onClick={onSignInClick} className="text-white hover:text-purple-400 transition-colors">Entrar</button>
                </p>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Mail className="text-purple-400 w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black mb-2 tracking-tight">Verifique seu E-mail</h2>
              <p className="text-gray-500 text-sm font-medium mb-8">Enviamos um código de confirmação para {email}</p>

              <form onSubmit={onPressVerify} className="space-y-6">
                <div>
                  <label className={labelClass}>Código de 6 dígitos</label>
                  <input 
                    type="text" 
                    maxLength={6}
                    required 
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="000000" 
                    className={inputClass + " text-center text-lg font-black tracking-[0.5em]"}
                    disabled={loading}
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                    <p className="text-red-400 text-[11px] font-medium text-center">{error}</p>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <button 
                    type="submit"
                    disabled={loading || code.length < 6}
                    className="w-full h-14 bg-white text-black rounded-xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 hover:bg-purple-500 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verificar E-mail"}
                  </button>
                  
                  <button 
                    type="button"
                    onClick={() => setPendingVerification(false)}
                    className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white py-2 flex items-center justify-center gap-2"
                  >
                    <ChevronLeft size={12} /> Voltar
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
