import React from 'react';

interface NavigationProps {
  onVent: () => void;
  onReset: () => void;
  onSOS: () => void;
  onBreathe: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ onVent, onReset, onSOS, onBreathe }) => {
  return (
    <aside className="fixed top-0 left-0 w-full h-16 md:h-full md:w-20 z-50 flex md:flex-col justify-between items-center p-3 md:py-8 bg-bg/90 md:bg-bg/80 backdrop-blur-lg border-b md:border-b-0 md:border-r border-glass-border transition-all">
      {/* Logo */}
      <div className="text-white/30 font-title font-extrabold text-lg md:text-2xl tracking-widest md:[writing-mode:vertical-rl] md:rotate-180 select-none">
        IYM PSICO
      </div>

      {/* Buttons */}
      <div className="flex md:flex-col gap-3 md:gap-4">
        <button 
          onClick={onVent}
          className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 border border-glass-border flex items-center justify-center text-xl text-gray-200 hover:bg-white/10 hover:text-accent hover:border-accent active:scale-95 transition-all duration-300 touch-manipulation"
          title="Desahogarse"
          aria-label="Modo Desahogo"
        >
          📝
        </button>
        
        <button 
          onClick={onBreathe}
          className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 border border-glass-border flex items-center justify-center text-xl text-cyan-200 hover:bg-cyan-500/20 hover:text-cyan-400 hover:border-cyan-400 active:scale-95 transition-all duration-300 touch-manipulation"
          title="Respiración Guiada"
          aria-label="Modo Respiración"
        >
          🌬️
        </button>

        <button 
          onClick={onReset}
          className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 border border-glass-border flex items-center justify-center text-xl text-gray-200 hover:bg-white/10 hover:text-accent hover:border-accent active:scale-95 transition-all duration-300 touch-manipulation"
          title="Reiniciar"
          aria-label="Reiniciar conversación"
        >
          ↻
        </button>
        
        <button 
          onClick={onSOS}
          className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-danger/10 border border-danger/30 flex items-center justify-center text-xl text-danger hover:bg-danger/20 active:scale-95 transition-all duration-300 touch-manipulation shadow-[0_0_10px_rgba(244,63,94,0.2)]"
          title="Ayuda / SOS"
          aria-label="Botón SOS Ayuda"
        >
          ♥
        </button>
      </div>
    </aside>
  );
};

export default Navigation;