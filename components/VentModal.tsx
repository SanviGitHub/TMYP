import React, { useState } from 'react';
import { gsap } from 'gsap';

interface VentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VentModal: React.FC<VentModalProps> = ({ isOpen, onClose }) => {
  const [text, setText] = useState('');

  if (!isOpen) return null;

  const handlePurge = () => {
    const textarea = document.getElementById('vent-area');
    if (textarea) {
      // Visual effect: blur and fade out text to symbolize letting go
      gsap.to(textarea, {
        opacity: 0,
        filter: 'blur(20px)',
        duration: 1.5,
        ease: 'power2.in',
        onComplete: () => {
          setText('');
          gsap.set(textarea, { opacity: 1, filter: 'none' });
          onClose();
        }
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl animate-fade-in">
      <div className="absolute inset-0 bg-gradient-radial from-indigo-900/20 to-black pointer-events-none" />
      
      <div className="w-[90%] max-w-2xl relative z-10 text-center">
        <h2 className="font-title text-3xl md:text-5xl text-gray-200 mb-4 font-bold">Espacio de Desahogo</h2>
        <p className="text-gray-500 mb-8 font-body">Escribí lo que te pesa. Al presionar "Soltar", desaparecerá para siempre.</p>
        
        <textarea
          id="vent-area"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribí acá..."
          className="w-full bg-transparent border-none text-center text-white/90 text-xl md:text-3xl font-title placeholder-white/10 outline-none resize-none h-40"
          spellCheck={false}
        />

        <div className="flex justify-center gap-6 mt-12">
          <button 
            onClick={onClose}
            className="w-12 h-12 rounded-full border border-white/10 text-white/50 hover:bg-white/10 hover:text-white transition-all"
          >
            ✕
          </button>
          <button 
            onClick={handlePurge}
            disabled={!text}
            className="px-8 py-3 rounded-full bg-danger/10 border border-danger/40 text-danger font-bold hover:bg-danger hover:text-white hover:shadow-[0_0_30px_rgba(244,63,94,0.6)] transition-all disabled:opacity-30 disabled:pointer-events-none"
          >
            Soltar
          </button>
        </div>
      </div>
    </div>
  );
};

export default VentModal;