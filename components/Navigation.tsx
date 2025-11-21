import React from 'react';

interface NavigationProps {
  onVent: () => void;
  onReset: () => void;
  onSOS: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ onVent, onReset, onSOS }) => {
  return (
    <aside className="fixed top-0 left-0 w-full h-16 md:h-full md:w-20 z-50 flex md:flex-col justify-between items-center p-4 md:py-8 bg-bg/80 backdrop-blur-md border-b md:border-b-0 md:border-r border-glass-border">
      {/* Logo */}
      <div className="text-white/30 font-title font-extrabold text-lg md:text-2xl tracking-widest md:[writing-mode:vertical-rl] md:rotate-180 select-none">
        IYM PSICO
      </div>

      {/* Buttons */}
      <div className="flex md:flex-col gap-4">
        <button 
          onClick={onVent}
          className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 border border-glass-border flex items-center justify-center text-xl text-gray-200 hover:bg-white/10 hover:text-accent hover:border-accent hover:scale-110 transition-all duration-300"
          title="Desahogarse"
        >
          📝
        </button>
        <button 
          onClick={onReset}
          className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 border border-glass-border flex items-center justify-center text-xl text-gray-200 hover:bg-white/10 hover:text-accent hover:border-accent hover:scale-110 transition-all duration-300"
          title="Reiniciar"
        >
          ↻
        </button>
        <button 
          onClick={onSOS}
          className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-danger/10 border border-danger/30 flex items-center justify-center text-xl text-danger hover:bg-danger/20 hover:shadow-[0_0_15px_rgba(244,63,94,0.4)] hover:scale-110 transition-all duration-300"
          title="Ayuda / SOS"
        >
          ♥
        </button>
      </div>
    </aside>
  );
};

export default Navigation;