
import React from 'react';

interface NavigationProps {
  onVent: () => void;
  onReset: () => void;
  onSOS: () => void;
  onBreathe: () => void;
  onMood: () => void;
  onToggleSound: () => void;
  isMuted: boolean;
  highlightMood?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ 
  onVent, onReset, onSOS, onBreathe, onMood, onToggleSound, isMuted, highlightMood 
}) => {
  return (
    <aside className="fixed top-0 left-0 w-full h-16 md:h-full md:w-20 z-50 flex md:flex-col md:justify-start md:gap-5 justify-between items-center p-3 md:py-8 bg-bg/90 md:bg-bg/80 backdrop-blur-lg border-b md:border-b-0 md:border-r border-glass-border transition-all">
      {/* Logo with Glitch Effect */}
      <div 
        className="text-white/30 font-title font-extrabold text-lg md:text-2xl tracking-widest md:[writing-mode:vertical-rl] md:rotate-180 select-none hidden md:block md:h-32 text-center glitch-hover cursor-default transition-colors hover:text-white/80"
        data-text="IYM PSICO"
      >
        IYM PSICO
      </div>
      <div className="md:hidden text-white/30 font-title font-extrabold text-lg glitch-hover" data-text="IYM">IYM</div>

      {/* Buttons */}
      <div className="flex md:flex-col gap-2 md:gap-5 overflow-x-auto md:overflow-visible w-full md:w-auto justify-end md:justify-start pr-2 md:pr-0">
        
        <button 
          onClick={onToggleSound}
          className={`w-10 h-10 md:w-12 md:h-12 rounded-xl border border-glass-border flex items-center justify-center text-xl active:scale-95 transition-all duration-300 touch-manipulation shrink-0 ${isMuted ? 'bg-white/5 text-gray-500 hover:text-white' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.3)]'}`}
          title={isMuted ? "Activar Sonido Ambiente" : "Silenciar"}
          aria-label="Sonido Ambiente"
        >
          {isMuted ? '🔇' : '🎧'}
        </button>

        {/* MOOD BUTTON - Highlighted style is solid, opaque, and sharp (no blur on button) */}
        <button 
          onClick={onMood}
          className={`
            relative w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-xl 
            transition-all duration-300 touch-manipulation shrink-0
            ${highlightMood 
                ? 'z-[60] bg-white text-black border-2 border-white shadow-xl scale-110 opacity-100 cursor-pointer' 
                : 'bg-white/5 border border-glass-border text-pink-200 hover:bg-pink-500/20 hover:text-pink-400 hover:border-pink-400 active:scale-95'}
          `}
          title="Estado de Ánimo"
          aria-label="Cambiar estado de ánimo"
        >
          🎭
        </button>

        <button 
          onClick={onVent}
          className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 border border-glass-border flex items-center justify-center text-xl text-gray-200 hover:bg-white/10 hover:text-accent hover:border-accent active:scale-95 transition-all duration-300 touch-manipulation shrink-0"
          title="Desahogarse"
          aria-label="Modo Desahogo"
        >
          📝
        </button>
        
        <button 
          onClick={onBreathe}
          className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 border border-glass-border flex items-center justify-center text-xl text-cyan-200 hover:bg-cyan-500/20 hover:text-cyan-400 hover:border-cyan-400 active:scale-95 transition-all duration-300 touch-manipulation shrink-0"
          title="Respiración Guiada"
          aria-label="Modo Respiración"
        >
          🌬️
        </button>

        <button 
          onClick={onReset}
          className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 border border-glass-border flex items-center justify-center text-xl text-gray-200 hover:bg-white/10 hover:text-accent hover:border-accent active:scale-95 transition-all duration-300 touch-manipulation shrink-0"
          title="Reiniciar"
          aria-label="Reiniciar conversación"
        >
          ↻
        </button>
        
        <button 
          onClick={onSOS}
          className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-danger/10 border border-danger/30 flex items-center justify-center text-xl text-danger hover:bg-danger/20 active:scale-95 transition-all duration-300 touch-manipulation shadow-[0_0_10px_rgba(244,63,94,0.2)] shrink-0"
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
