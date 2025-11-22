
import React from 'react';

interface TutorialOverlayProps {
  isVisible: boolean;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    // Fondo oscuro pero SIN desenfoque (backdrop-blur eliminado)
    <div className="fixed inset-0 z-[45] bg-black/60 animate-fade-in pointer-events-none transition-all duration-500">
      
      {/* DESKTOP CONTAINER: Align with 2nd Button (Mood) approx 270px from top (Logo + Gap + Btn1 + Gap) */}
      <div className="hidden md:flex absolute top-[270px] left-24 flex-row items-center animate-pulse-slow">
         {/* Text Bubble */}
         <div className="bg-white text-bg px-6 py-4 rounded-2xl shadow-xl border border-gray-200 max-w-xs relative">
            {/* Arrow indicator pointing Left */}
            <div className="absolute top-1/2 -left-2 w-4 h-4 bg-white transform -translate-y-1/2 rotate-45 border-l border-b border-gray-200"></div>
            <h3 className="font-title font-bold text-xl mb-1">¿Cómo te sentís?</h3>
            <p className="font-body text-sm leading-tight text-gray-800">
                Seleccioná tu estado para empezar.
            </p>
         </div>
      </div>

      {/* MOBILE CONTAINER: Adjusted to align with Mood Button (Now 2nd Button) */}
      {/* Position: Logo (~40px) + Gap + Btn1 (~40px) + Gap -> Start ~100px. Center ~120px */}
      <div className="md:hidden absolute top-[70px] left-28 flex flex-col items-center animate-pulse-slow z-50">
         {/* Arrow indicator pointing UP */}
         <div className="w-4 h-4 bg-white transform rotate-45 mb-[-6px] z-10 border-l border-t border-gray-200"></div>
         
         {/* Text Bubble - Width fixed to fit on small screens */}
         <div className="bg-white text-bg px-4 py-3 rounded-2xl shadow-xl border border-gray-200 w-[160px] text-center relative">
            <h3 className="font-title font-bold text-lg mb-1">¿Cómo te sentís?</h3>
            <p className="font-body text-xs leading-tight text-gray-800">
                Tocá la máscara para elegir tu estado.
            </p>
         </div>
      </div>

    </div>
  );
};

export default TutorialOverlay;
