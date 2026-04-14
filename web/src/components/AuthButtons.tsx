interface AuthButtonsProps {
  onSignInClick: () => void;
  onSignUpClick: () => void;
}

export function AuthButtons({ onSignInClick, onSignUpClick }: AuthButtonsProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-4">
      <button 
        type="button" 
        onClick={onSignInClick}
        className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all px-4 py-2 opacity-70 hover:opacity-100"
      >
        Entrar
      </button>

      <button 
        type="button" 
        onClick={onSignUpClick}
        className="bg-white text-black text-[10px] sm:text-xs font-black uppercase tracking-widest h-10 sm:h-12 px-6 rounded-full hover:bg-purple-500 hover:text-white transition-all shadow-xl shadow-white/5 active:scale-95 border border-white/10"
      >
        Cadastrar Empresa
      </button>
    </div>
  );
}
