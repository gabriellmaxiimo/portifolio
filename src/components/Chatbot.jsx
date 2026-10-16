import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Trash2, X } from 'lucide-react';

export default function Chatbot({ currentT = {}, themeClasses = {} }) {
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

    const historyPayload = chatMessages
      .slice(1)
      .filter(msg => msg.text)
      .slice(-6)
      .map(msg => ({
        role: msg.role === 'bot' ? 'model' : 'user',
        text: msg.text
      }));

    setChatMessages(prev => [
      ...prev,
      { role: 'user', text: userMsg },
      { role: 'bot', text: '' }
    ]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMsg,
          history: historyPayload
        })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || `Erro na resposta da API: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('O servidor não enviou uma resposta válida.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });

        setChatMessages(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          updated[lastIdx] = {
            ...updated[lastIdx],
            text: updated[lastIdx].text + chunkText
          };
          return updated;
        });
      }
    } catch (error) {
      console.error('Erro ao comunicar com o assistente:', error);
      setChatMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        updated[lastIdx] = {
          role: 'bot',
          text: error instanceof TypeError
            ? 'Ocorreu um erro temporário ao processar a solicitação com o assistente.'
            : error.message
        };
        return updated;
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsChatOpen(!isChatOpen)} 
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl z-50 transition-all transform hover:scale-110 ${themeClasses.solidBg || ''}`}
      >
        {isChatOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {isChatOpen && (
        <div className={`fixed bottom-24 right-6 w-[320px] md:w-[380px] h-[450px] rounded-2xl flex flex-col z-50 shadow-2xl overflow-hidden ${themeClasses.solidBg || ''} border animate-fade-in`}>
          <div className="flex justify-between items-center p-4 border-b border-current/10 bg-current/5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold tracking-wider uppercase">
                {currentT.chatTitle || 'Chat com IA'}
              </span>
            </div>
            <button 
              onClick={() => setChatMessages([{ role: 'bot', text: 'Olá. Como posso ajudar?' }])} 
              title={currentT.clearChat || 'Limpar conversa'} 
              className="opacity-50 hover:opacity-100 transition-opacity"
            >
              <Trash2 size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {chatMessages.map((msg, i) => {
              const isStreamingPlaceholder = isChatLoading && i === chatMessages.length - 1 && !msg.text;

              return (
                <div key={i} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user' 
                      ? 'bg-current/10 rounded-tr-sm' 
                      : `${themeClasses.glass || ''} border-none rounded-tl-sm`
                  }`}>
                    {isStreamingPlaceholder ? (
                      <div className="flex gap-1 items-center py-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-current/50 animate-bounce" />
                        <div className="w-1.5 h-1.5 rounded-full bg-current/50 animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-current/50 animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleChatSubmit} className="p-3 border-t border-current/10 flex gap-2 bg-current/5">
            <input 
              type="text" 
              value={chatInput} 
              onChange={(e) => setChatInput(e.target.value)} 
              placeholder={currentT.chatPlaceholder || 'Digite sua mensagem...'} 
              className="flex-1 bg-transparent border-none outline-none text-xs px-2" 
              disabled={isChatLoading} 
            />
            <button 
              type="submit" 
              disabled={!chatInput.trim() || isChatLoading} 
              className="p-2 rounded-lg bg-current/10 hover:bg-current/20 disabled:opacity-30 transition-all"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}