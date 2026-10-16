import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { MessageCircle, Send, Trash2, X } from 'lucide-react';

export default function Chatbot({ currentT, themeClasses }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([{ role: 'bot', text: 'Olá. Como posso ajudar?' }]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      if (!apiKey) {
        setChatMessages(prev => [...prev, { role: 'bot', text: 'Erro: A chave de API do Gemini (VITE_GEMINI_API_KEY) não está configurada no arquivo .env.' }]);
        setIsChatLoading(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });

      const systemInstruction = `
        Você é o assistente virtual do portfólio de Gabriel Máximo de Castro.
        REGRAS ESTRITAS:
        1. Responda de forma profissional e objetiva.
        2. Responda apenas ao que foi perguntado.
        3. Responda estritamente com base nas informações do portfólio (Gabriel é estudante de Engenharia de Software na PUC Minas Coração Eucarístico com previsão para 2028, atua como Auxiliar de Serviços Administrativos na PUC Minas - IFTDJ, sua stack inclui Java, Spring Boot, SQL, Redes, Sistemas Operacionais, Hardware e Git, e é torcedor do Cruzeiro Esporte Clube).
        4. NUNCA busque informações externas ao portfólio, nunca invente dados e responda de forma alinhada a estas diretrizes.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: `${systemInstruction}\n\nPergunta do visitante: ${userMsg}` }] }
        ]
      });

      const botResponse = response.text || "Desculpe, não consegui processar essa informação com base no portfólio.";

      setChatMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
      setIsChatLoading(false);
    } catch (error) {
      console.error('Erro ao comunicar com o Gemini:', error);
      setChatMessages(prev => [...prev, { role: 'bot', text: "Ocorreu um erro temporário ao processar a solicitação com o assistente." }]);
      setIsChatLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setIsChatOpen(!isChatOpen)} className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl z-50 transition-all transform hover:scale-110 ${themeClasses.solidBg}`}>
        {isChatOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {isChatOpen && (
        <div className={`fixed bottom-24 right-6 w-[320px] md:w-[380px] h-[450px] rounded-2xl flex flex-col z-50 shadow-2xl overflow-hidden ${themeClasses.solidBg} border animate-fade-in`}>
          <div className="flex justify-between items-center p-4 border-b border-current/10 bg-current/5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-bold tracking-wider uppercase">{currentT.chatTitle || "Chat com IA"}</span>
            </div>
            <button onClick={() => setChatMessages([{ role: 'bot', text: 'Olá. Como posso ajudar?' }])} title={currentT.clearChat} className="opacity-50 hover:opacity-100 transition-opacity">
              <Trash2 size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${msg.role === 'user' ? 'bg-current/10 rounded-tr-sm' : `${themeClasses.glass} border-none rounded-tl-sm`}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex justify-start w-full">
                <div className={`p-3 rounded-2xl ${themeClasses.glass} border-none rounded-tl-sm flex gap-1 items-center`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-current/50 animate-bounce"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-current/50 animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-current/50 animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleChatSubmit} className="p-3 border-t border-current/10 flex gap-2 bg-current/5">
            <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder={currentT.chatPlaceholder || "Digite sua mensagem..."} className="flex-1 bg-transparent border-none outline-none text-xs px-2" disabled={isChatLoading} />
            <button type="submit" disabled={!chatInput.trim() || isChatLoading} className="p-2 rounded-lg bg-current/10 hover:bg-current/20 disabled:opacity-30 transition-all">
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}