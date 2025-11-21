import React, { useEffect, useRef, useState } from 'react';
import { Message } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  isTalking: boolean;
  onSendMessage: (text: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, isTalking, onSendMessage }) => {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTalking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTalking) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    // PERFORMANCE: Reduced backdrop-blur to 'md' on mobile to save GPU resources.
    // Uses 'h-[65dvh]' (Dynamic Viewport Height) to fix mobile browser bar issues.
    <main className="fixed bottom-0 left-0 md:left-20 right-0 h-[65dvh] md:h-[80vh] md:static md:w-[480px] md:max-w-lg bg-glass/80 md:bg-glass/30 backdrop-blur-md md:backdrop-blur-3xl border-t md:border border-white/10 md:rounded-3xl flex flex-col shadow-[0_-8px_32px_rgba(0,0,0,0.5)] md:shadow-[0_8px_32px_rgba(0,0,0,0.3)] z-40 transition-all duration-500 ease-out md:mr-12 md:mb-8 overflow-hidden ring-1 ring-white/5">
      
      {/* Header */}
      <header className="px-5 py-4 md:px-6 md:py-5 border-b border-white/5 flex items-center justify-between bg-white/5 shrink-0">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${isTalking ? 'bg-accent shadow-[0_0_12px_#00fff2] scale-110' : 'bg-emerald-500/50'}`} />
            {isTalking && <div className="absolute inset-0 rounded-full bg-accent animate-ping opacity-75"></div>}
          </div>
          <div>
            <h1 className="font-title font-bold text-lg md:text-xl text-white tracking-wide">IYM Psico</h1>
            <div className="flex gap-1.5">
                <span className="w-1 h-1 rounded-full bg-white/30 mt-1.5"></span>
                <span className="text-[0.65rem] text-white/40 font-body uppercase tracking-wider">En línea 24/7</span>
            </div>
          </div>
        </div>
        <div className="text-xs text-white/20 font-body font-light tracking-widest hidden md:block">VIANA & GOMEZ</div>
      </header>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4 md:gap-5 scrollbar-hide mask-linear-fade">
        {messages.length === 0 && (
           <div className="flex flex-col items-center justify-center h-full text-white/20 opacity-0 animate-[fadeIn_1s_ease-out_forwards_0.5s]">
             <span className="text-4xl mb-4 opacity-50">✨</span>
             <p className="italic text-center font-light text-sm md:text-base">Tu espacio seguro.<br/>Todo queda entre nosotros.</p>
           </div>
        )}
        
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex flex-col max-w-[90%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'} animate-fade-in`}
          >
            <div className={`
              px-5 py-3 text-[0.9rem] md:text-[0.95rem] leading-relaxed relative break-words font-body shadow-lg
              ${msg.role === 'user' 
                ? 'bg-white/10 border border-white/10 text-white rounded-2xl rounded-br-none active:bg-white/20' 
                : 'bg-black/40 border border-white/5 text-gray-200 rounded-2xl rounded-bl-none'}
            `}>
              <span dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>') }} />
            </div>
            {msg.timestamp && (
              <span className="text-[0.6rem] text-white/20 mt-1.5 mx-2 font-medium tracking-wide">{msg.timestamp}</span>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 md:p-5 bg-black/60 md:bg-black/40 border-t border-white/5 backdrop-blur-md shrink-0 pb-safe-area">
        <form onSubmit={handleSubmit} className="relative flex items-center gap-2 md:gap-3 bg-white/5 border border-white/10 rounded-2xl px-3 py-2 md:px-4 md:py-2 focus-within:border-accent/50 focus-within:bg-white/10 transition-all duration-300 shadow-inner">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isTalking ? "Escuchando..." : "Escribí tu mensaje..."}
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/20 font-body text-sm md:text-base py-2"
            disabled={isTalking}
            // Prevent zoom on mobile
            style={{fontSize: '16px'}}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isTalking}
            className={`
              w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all duration-300 touch-manipulation
              ${!input.trim() || isTalking ? 'text-white/10 cursor-not-allowed' : 'text-bg bg-white active:scale-95 shadow-[0_0_10px_rgba(255,255,255,0.2)]'}
            `}
          >
            ➤
          </button>
        </form>
        <div className="text-center mt-2 hidden md:block">
            <span className="text-[0.55rem] text-white/10 uppercase tracking-widest">IA Psicológica Exp.</span>
        </div>
      </div>
    </main>
  );
};

export default ChatInterface;