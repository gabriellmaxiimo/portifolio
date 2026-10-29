import React, { useState } from 'react';
import { Send, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { FaGithub, FaInstagram, FaLinkedin } from 'react-icons/fa';
import emailjs from '@emailjs/browser';

export default function Contact({ currentT, themeClasses }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState({ loading: false, success: false, error: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !message.trim()) return;

    setStatus({ loading: true, success: false, error: false });

    const SERVICE_ID = 'service_h48nkhn';
    const TEMPLATE_ID = 'template_6ywew4k';
    const PUBLIC_KEY = 'NK6NDWKVoMCqy3GIG';

    const templateParams = {
      user_email: email,
      email: email,
      from_email: email,
      message: message,
      to_name: 'Gabriel Máximo',
      from_name: 'Visitante do Portfólio',
    };

    try {
      await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
      setStatus({ loading: false, success: true, error: false });
      setEmail('');
      setMessage('');
    } catch (error) {
      console.error('Erro ao enviar e-mail:', error);
      setStatus({ loading: false, success: false, error: true });
    }
  };

  return (
    <div className="animate-fade-in w-full max-w-md mx-auto">
      <h2 className={`text-3xl font-light mb-8 tracking-tight text-center ${themeClasses.accent}`}>
        {currentT.contactTitle}
      </h2>

      <form onSubmit={handleSubmit} className={`p-8 rounded-2xl flex flex-col gap-6 ${themeClasses.glass}`}>
        <input 
          type="email" 
          placeholder={currentT.contactEmail} 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="px-4 py-3 rounded-lg bg-current/5 border border-current/10 outline-none text-sm focus:border-current/30 transition-all" 
        />
        
        <textarea 
          rows={4} 
          placeholder={currentT.contactMessage} 
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          className="px-4 py-3 rounded-lg bg-current/5 border border-current/10 outline-none text-sm resize-none focus:border-current/30 transition-all custom-scrollbar" 
        />

        <button 
          type="submit" 
          disabled={status.loading}
          className={`mt-2 px-6 py-3 rounded-lg text-xs font-bold tracking-[0.2em] uppercase transition-all shadow-lg border border-current/20 hover:bg-current/10 flex items-center justify-center gap-2`}
        >
          {status.loading ? currentT.contactSending : (
            <>
              <Send size={14} /> {currentT.contactSend}
            </>
          )}
        </button>

        {status.success && (
          <div className="flex items-center gap-2 text-xs text-[var(--success-text)] justify-center">
            <CheckCircle size={14} /> {currentT.contactSuccess}
          </div>
        )}

        {status.error && (
          <div className="flex items-center gap-2 text-xs text-[var(--error-text)] justify-center">
            <AlertCircle size={14} /> {currentT.contactError}
          </div>
        )}
      </form>
      
      <div className="mt-8 flex justify-center items-center gap-4 flex-wrap">
        <a href="https://github.com/gabriellmaxiimo" target="_blank" rel="noopener noreferrer" className={`px-4 py-2 rounded-xl text-xs flex items-center gap-2 ${themeClasses.glass} ${themeClasses.hover}`}>
          <FaGithub size={16} aria-hidden="true" /> GitHub <ExternalLink size={12} className="opacity-50" aria-hidden="true" />
        </a>
        <a href="https://www.linkedin.com/in/gabriellmaxiimo/" target="_blank" rel="noopener noreferrer" className={`px-4 py-2 rounded-xl text-xs flex items-center gap-2 ${themeClasses.glass} ${themeClasses.hover}`}>
          <FaLinkedin size={16} aria-hidden="true" /> LinkedIn <ExternalLink size={12} className="opacity-50" aria-hidden="true" />
        </a>
        <a href="https://www.instagram.com/gmaxiimo" target="_blank" rel="noopener noreferrer" className={`px-4 py-2 rounded-xl text-xs flex items-center gap-2 ${themeClasses.glass} ${themeClasses.hover}`}>
          <FaInstagram size={16} aria-hidden="true" /> Instagram <ExternalLink size={12} className="opacity-50" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}