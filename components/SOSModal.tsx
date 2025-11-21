import React from 'react';
import { EMERGENCIES } from '../constants';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SOSModal: React.FC<SOSModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in p-6">
      <div className="w-full max-w-lg relative z-10">
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-title text-3xl text-white font-bold">Ayuda Inmediata</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white text-2xl">✕</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.values(EMERGENCIES).map((e, i) => (
            <a 
              key={i} 
              href={`tel:${e.number}`}
              className="group bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-danger/10 hover:border-danger/50 transition-all duration-300 block text-decoration-none"
            >
              <div className="text-3xl font-bold text-white group-hover:text-danger mb-2 font-title">{e.number}</div>
              <div className="text-xs uppercase tracking-wider text-danger font-bold">{e.name}</div>
              <div className="text-sm text-gray-400 mt-1">{e.desc}</div>
            </a>
          ))}
        </div>
        
        <p className="text-center text-gray-600 text-xs mt-8">
          Si tu vida corre peligro, llamá a emergencias o acercate al hospital más cercano.
        </p>
      </div>
    </div>
  );
};

export default SOSModal;