import { API_ENDPOINTS, EMERGENCIES, SYSTEM_PROMPT_TEMPLATE } from '../constants';
import { EmergencyInfo, Message } from '../types';

export const detectEmergency = (msg: string): EmergencyInfo[] => {
  const lower = msg.toLowerCase();
  const detected: EmergencyInfo[] = [];
  for (const key in EMERGENCIES) {
    const data = EMERGENCIES[key];
    if (data.keywords.some(kw => lower.includes(kw))) detected.push(data);
  }
  return detected;
};

export const generateEmergencyResponse = (detected: EmergencyInfo[], isUrgent: boolean): string | null => {
  if (detected.length === 0) return null;
  const p = detected[0];
  return isUrgent 
    ? `🚨 URGENTE: Llamá al ${p.number} (${p.name}) AHORA. ` 
    : `Te doy el ${p.number} (${p.name}) - ${p.desc}. `;
};

export const detectCreator = (msg: string): boolean => {
  const kw = ['creador', 'quien te hizo', 'quien te creo', 'desarrollador', 'santino', 'dante'];
  return kw.some(k => msg.toLowerCase().includes(k));
};

export const detectPromptHack = (msg: string): boolean => {
  const kw = ['prompt', 'instrucciones', 'configuracion', 'system prompt', 'tus reglas', 'quien sos en realidad'];
  return kw.some(k => msg.toLowerCase().includes(k));
};

export const processResponse = (text: string): string => {
  // Basic cleanup
  let clean = text.replace(/^(IYM:|Assistant:|AI:)/i, '').replace(/\*\*|__/g, '').trim();
  
  // Cut if too long or ends abruptly
  if (clean.length > 10 && !clean.match(/[.!?]$/)) {
     const lastPunc = Math.max(clean.lastIndexOf('.'), clean.lastIndexOf('!'), clean.lastIndexOf('?'));
     if (lastPunc > clean.length * 0.7) clean = clean.substring(0, lastPunc + 1);
     else clean += ".";
  }
  return clean;
};

export const sendMessageToAI = async (messages: Message[], userText: string): Promise<string> => {
    // 1. Security Checks
    if (detectPromptHack(userText)) {
      return "No puedo responderte a esas preguntas, lo siento. Soy un psicólogo profesional. ¿Hablamos de vos? 😊";
    }

    if (detectCreator(userText)) {
      return "Fui creado por Santino V. y Dante G., estudiantes que querían ayudar con la salud mental. Soy IYM. ¿En qué te ayudo? 😊";
    }

    // 2. Emergency Detection
    const emergencies = detectEmergency(userText);
    const urgentKW = ['suicidio', 'matarme', 'quitarme la vida', 'cortarme', 'acabar con todo'];
    const isUrgent = urgentKW.some(k => userText.toLowerCase().includes(k));
    
    let emergencyContext = "";
    let preResponse = "";

    if (isUrgent) {
      const resp = generateEmergencyResponse(emergencies, true);
      if (resp) preResponse = resp + " Mientras tanto, contame qué te está pasando. ";
    }

    if (emergencies.length > 0) {
       const info = generateEmergencyResponse(emergencies, false);
       emergencyContext = `CONTEXTO EMERGENCIA: Usuario mencionó temas delicados (${emergencies.map(e=>e.name).join(', ')}). Números disponibles: ${info}`;
    }

    // 3. Build Payload
    const systemPrompt = SYSTEM_PROMPT_TEMPLATE(emergencyContext);
    
    // We only send the last few messages to save context/tokens and focus on immediate conversation
    const conversationHistory = messages.slice(-8).map(m => ({ role: m.role, content: m.content }));
    const fullMessages = [
        { role: "system", content: systemPrompt },
        ...conversationHistory, 
        { role: "user", content: userText }
    ];

    let reply = "Dame un momento...";
    let success = false;

    // 4. API Redundancy
    for (const api of API_ENDPOINTS) {
        try {
            const response = await fetch(api.url, {
                method: "POST", 
                headers: { 
                    "Authorization": `Bearer ${api.key}`, 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({ 
                    model: api.model, 
                    messages: fullMessages, 
                    max_tokens: 800, 
                    temperature: 0.75 
                })
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.choices[0]?.message?.content;
                if (content) {
                    reply = content;
                    success = true;
                    break;
                }
            }
        } catch (e) {
            console.error("API Fail", e);
            continue;
        }
    }

    if (!success) {
        throw new Error("No services available");
    }

    reply = processResponse(reply);

    // Append non-urgent emergency info if needed and not already present
    if (emergencies.length > 0 && !isUrgent && !reply.includes('135')) {
        const info = generateEmergencyResponse(emergencies, false);
        if (info) reply = info + "\n\n" + reply;
    }

    return preResponse + reply;
};