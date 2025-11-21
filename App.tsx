import React, { useState, useEffect, useRef } from 'react';
import TheBola from './components/TheBola';
import Navigation from './components/Navigation';
import ChatInterface from './components/ChatInterface';
import VentModal from './components/VentModal';
import SOSModal from './components/SOSModal';
import BreathingModal from './components/BreathingModal';
import MoodSelector from './components/MoodSelector';
import UpdateChecker from './components/UpdateChecker';
import { Message, MoodOption } from './types';
import { QUOTES, MOODS } from './constants';
import { sendMessageToAI } from './services/aiService';

const App: React.FC = () => {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTalking, setIsTalking] = useState(false);
  const [activeModal, setActiveModal] = useState<'vent' | 'sos' | 'breathe' | 'mood' | null>(null);
  const [currentMood, setCurrentMood] = useState<MoodOption>(MOODS[0]); // Default: Neutral
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

  const handleMoodChange = (mood: MoodOption) => {
    setCurrentMood(mood);
    setActiveModal(null);
    
    // Add a small system message to chat (visible only to user to confirm change)
    const systemMsg: Message = {
        role: 'system', // We render this differently below if needed, or reuse standard bubble with distinct style
        content: `✨ <em>Ambiente cambiado a: <strong>${mood.label}</strong></em>`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, systemMsg]);
    
    // Optional: Trigger AI response to the mood change automatically? 
    // Better strategy: Just let the mood influence the NEXT user message.
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
          if (prev.length === 0) return prev;
          const newArr = [...prev];
          const lastIdx = newArr.length - 1;
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
      // INJECT MOOD CONTEXT INVISIBLE TO USER BUT VISIBLE TO AI
      // We prepend a system instruction to the user's text just for the API call
      const textWithContext = `[CONTEXTO ACTUAL DEL USUARIO: ${currentMood.systemContext}]\n\n${text}`;

      // Pass current messages context
      const response = await sendMessageToAI(messages, textWithContext);
      addMessageWithTyping(response, 'assistant'); 
    } catch (error) {
      console.error(error);
      setIsTalking(false); 
      addMessageWithTyping("Me desconecté un segundo del universo. ¿Me lo repetís? 😅", 'assistant');
    }
  };

  const handleReset = () => {
    if (window.confirm("¿Querés borrar todo y empezar de cero?")) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setMessages([]);
      setIsTalking(false);
      setCurrentMood(MOODS[0]); // Reset mood too
      
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
      
      {/* 2. The Bola (3D Sphere & Stars) - NOW WITH DYNAMIC MOOD COLOR */}
      <TheBola isTalking={isTalking} moodColor={currentMood.threeColor} />

      {/* 3. Main Layout */}
      <div className="relative z-20 w-full h-full flex flex-col md:flex-row max-w-[1800px] mx-auto pointer-events-none md:pl-20">
        
        {/* Navigation */}
        <div className="pointer-events-auto z-50">
            <Navigation 
            onVent={() => setActiveModal('vent')}
            onBreathe={() => setActiveModal('breathe')}
            onReset={handleReset}
            onSOS={() => setActiveModal('sos')}
            onMood={() => setActiveModal('mood')}
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

      {/* 4. Modals & Overlays */}
      <div className="relative z-[100]">
        <VentModal isOpen={activeModal === 'vent'} onClose={() => setActiveModal(null)} />
        <SOSModal isOpen={activeModal === 'sos'} onClose={() => setActiveModal(null)} />
        <BreathingModal isOpen={activeModal === 'breathe'} onClose={() => setActiveModal(null)} />
        
        <MoodSelector 
          isOpen={activeModal === 'mood'} 
          onClose={() => setActiveModal(null)} 
          onSelectMood={handleMoodChange}
          currentMoodId={currentMood.id}
        />

        <UpdateChecker />
      </div>

    </div>
  );
};

export default App;