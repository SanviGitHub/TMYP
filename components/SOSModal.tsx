import React from 'react';
import { EMERGENCIES } from '../constants';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SOSModal: React.FC<SOSModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in px-4 py-6 md:p-6 overflow-y-auto">
      <div className="w-full max-w-lg relative z-10 my-auto">
        <div className="flex justify-between items-center mb-6 md:mb-8 sticky top-0 bg-black/0 backdrop-blur-sm py-2">
          <h2 className="font-title text-2xl md:text-3xl text-white font-bold">Ayuda Inmediata</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white text-3xl p-2">✕</button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 max-h-[70vh] md:max-h-none overflow-y-auto scrollbar-hide">
          {Object.values(EMERGENCIES).map((e, i) => (
            <a 
              key={i} 
              href={`tel:${e.number}`}
              className="group bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-danger/10 hover:border-danger/50 active:bg-danger/20 transition-all duration-300 block text-decoration-none"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="text-2xl md:text-3xl font-bold text-white group-hover:text-danger font-title">{e.number}</div>
                <div className="text-xl text-white/20 group-hover:text-danger/50">📞</div>
              </div>
              <div className="text-xs uppercase tracking-wider text-danger font-bold">{e.name}</div>
              <div className="text-sm text-gray-400 mt-1 line-clamp-2">{e.desc}</div>
            </a>
          ))}
        </div>
        
        <p className="text-center text-gray-600 text-xs mt-6 md:mt-8 px-4">
          Si tu vida corre peligro, llamá a emergencias o acercate al hospital más cercano.
        </p>
      </div>
    </div>
  );
};

export default SOSModal;