import React, { useState, useEffect, useRef } from 'react';
import TheBola from './components/TheBola';
import Navigation from './components/Navigation';
import ChatInterface from './components/ChatInterface';
import VentModal from './components/VentModal';
import SOSModal from './components/SOSModal';
import { Message } from './types';
import { QUOTES } from './constants';
import { sendMessageToAI } from './services/aiService';

const App: React.FC = () => {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTalking, setIsTalking] = useState(false);
  const [activeModal, setActiveModal] = useState<'vent' | 'sos' | null>(null);
  const [quote, setQuote] = useState("Cargando paz mental...");
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial Setup
  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    // Start initial conversation
    startConversation();
    
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const startConversation = () => {
      // Small delay for aesthetics
      typingTimeoutRef.current = setTimeout(() => {
        addMessageWithTyping("¡Hola! Soy IYM. Estoy acá para escucharte, sin juzgarte. ¿Cómo venís hoy?", 'assistant');
      }, 800);
  };

  // Helper to add message with "typing" visual effect
  const addMessageWithTyping = (text: string, role: 'assistant' | 'user') => {
    if (role === 'user') {
      const msg: Message = { 
        role, 
        content: text, 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      };
      setMessages(prev => [...prev, msg]);
    } else {
      setIsTalking(true);
      const msgTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Add placeholder
      setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: msgTimestamp }]);
      
      let i = 0;
      const speed = 20; // Faster typing for better UX
      
      const typeChar = () => {
        setMessages(prev => {
          // Safety check if messages were cleared (reset button pressed mid-typing)
          if (prev.length === 0) return prev;
          
          const newArr = [...prev];
          const lastIdx = newArr.length - 1;
          // Update last message
          newArr[lastIdx] = { 
            ...newArr[lastIdx], 
            content: text.substring(0, i + 1) 
          };
          return newArr;
        });

        i++;
        if (i < text.length) {
          typingTimeoutRef.current = setTimeout(typeChar, speed);
        } else {
          setIsTalking(false);
        }
      };
      
      typeChar();
    }
  };

  const handleSendMessage = async (text: string) => {
    addMessageWithTyping(text, 'user');
    setIsTalking(true);
    
    try {
      // Pass current messages context
      const response = await sendMessageToAI(messages, text);
      addMessageWithTyping(response, 'assistant'); 
    } catch (error) {
      console.error(error);
      setIsTalking(false); // Stop ball animation on error
      addMessageWithTyping("Me desconecté un segundo del universo. ¿Me lo repetís? 😅", 'assistant');
    }
  };

  const handleReset = () => {
    if (window.confirm("¿Querés borrar todo y empezar de cero?")) {
      // Clear any pending typing intervals
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      // Force state clear
      setMessages([]);
      setIsTalking(false);
      
      // Restart after UI clears
      setTimeout(() => {
        setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
        addMessageWithTyping("Listo, borrón y cuenta nueva. ¿En qué te puedo ayudar ahora?", 'assistant');
      }, 300);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-bg text-gray-100 font-body selection:bg-primary/30">
      
      {/* 1. Background Visuals */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#020205] via-[#0c0c14] to-[#050505] z-0" />
      
      {/* 2. The Bola (3D Sphere & Stars) */}
      <TheBola isTalking={isTalking} />

      {/* 3. Main Layout */}
      <div className="relative z-20 w-full h-full flex flex-col md:flex-row max-w-[1800px] mx-auto pointer-events-none md:pl-20">
        
        {/* Navigation (Pointer events enabled internally) */}
        <div className="pointer-events-auto z-50">
            <Navigation 
            onVent={() => setActiveModal('vent')}
            onReset={handleReset}
            onSOS={() => setActiveModal('sos')}
            />
        </div>

        {/* Center Stage (Quote) */}
        <section className="hidden md:flex flex-1 flex-col items-center justify-end pb-10 md:pb-24 pointer-events-none z-30 px-4">
           <div className="bg-black/40 backdrop-blur-md px-6 py-4 md:px-8 md:py-5 rounded-3xl border border-white/10 text-white/80 font-light text-sm md:text-base tracking-wide shadow-2xl animate-fade-in hover:text-white hover:border-white/20 transition-all duration-500 text-center max-w-md mx-auto">
             "{quote}"
           </div>
        </section>

        {/* Chat Panel */}
        <div className="flex md:items-end md:justify-end h-full w-full md:w-auto pointer-events-auto z-40">
             <ChatInterface 
                messages={messages} 
                isTalking={isTalking} 
                onSendMessage={handleSendMessage}
             />
        </div>
      </div>

      {/* 4. Modals */}
      <div className="relative z-[100]">
        <VentModal isOpen={activeModal === 'vent'} onClose={() => setActiveModal(null)} />
        <SOSModal isOpen={activeModal === 'sos'} onClose={() => setActiveModal(null)} />
      </div>

    </div>
  );
};

export default App;