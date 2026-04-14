import { useState } from "react";
import { SignInForm } from "./auth/SignInForm";
import { SignUpForm } from "./auth/SignUpForm";

export function AuthButtons() {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  return (
    <div className="flex items-center gap-2 sm:gap-4">
      <button 
        type="button" 
        onClick={() => setShowSignIn(true)}
        className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all px-4 py-2 opacity-70 hover:opacity-100"
      >
        Entrar
      </button>

      <button 
        type="button" 
        onClick={() => setShowSignUp(true)}
        className="bg-white text-black text-[10px] sm:text-xs font-black uppercase tracking-widest h-10 sm:h-12 px-6 rounded-full hover:bg-purple-500 hover:text-white transition-all shadow-xl shadow-white/5 active:scale-95 border border-white/10"
      >
        Cadastrar Empresa
      </button>

      {showSignIn && (
        <SignInForm 
          onClose={() => setShowSignIn(false)} 
          onSignUpClick={() => {
            setShowSignIn(false);
            setShowSignUp(true);
          }}
        />
      )}

      {showSignUp && (
        <SignUpForm 
          onClose={() => setShowSignUp(false)} 
          onSignInClick={() => {
            setShowSignUp(false);
            setShowSignIn(true);
          }}
        />
      )}
    </div>
  );
}
