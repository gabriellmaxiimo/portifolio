import React from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';

export default function About({ currentT, themeClasses, stack }) {
  return (
    <div className="animate-fade-in">
      {/* Bloco principal com a foto e a apresentação */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8">
        
        {/* Foto de Perfil */}
        <div className="shrink-0">
          <img 
            src="/minha-foto.jpg" 
            alt="Gabriel Máximo" 
            className="w-36 h-36 md:w-44 md:h-44 object-cover rounded-2xl shadow-2xl border border-current/20"
          />
        </div>

        {/* Título e Texto */}
        <div className="flex-1 text-center md:text-left">
          <h1 className={`text-4xl md:text-6xl font-light mb-4 tracking-tighter ${themeClasses.accent}`}>
            {currentT.aboutTitle}
          </h1>
          <p className="text-sm md:text-base leading-relaxed font-light opacity-90">
            {currentT.aboutText}
          </p>
        </div>

      </div>
      
      {/* Secção de Tecnologias / Focos (movida para cima do jogo) */}
      <div className="space-y-4 mb-10">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50">
          {currentT.stackTitle}
        </h3>
        <div className="flex flex-wrap gap-2 md:gap-3">
          {stack.map((tech) => (
            <span key={tech} className={`px-4 py-2 rounded-full text-xs tracking-wider cursor-default ${themeClasses.glass}`}>
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Bloco do Jogo (movido para baixo) */}
      <div className="max-w-md">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50 mb-3">
          {currentT.nextMatchTitle}
        </p>
        <div className={`p-5 rounded-2xl flex flex-col gap-3 ${themeClasses.glass} ${themeClasses.hover} transition-all`}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 border border-current/20 px-2 py-1 rounded">
              Brasileirão Série A
            </span>
            <div className="flex items-center gap-2 text-xs opacity-70">
              <Calendar size={12} /> 18/10/2026
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-4 py-2">
            <div className="flex-1 text-right text-lg font-bold">Grêmio</div>
            <div className="text-xs font-bold opacity-50 border border-current/20 px-2 py-1 rounded">VS</div>
            <div className="flex-1 text-left text-lg font-bold">Cruzeiro</div>
          </div>

          <div className="flex justify-between items-center mt-2 pt-3 border-t border-current/10">
            <div className="flex items-center gap-2 text-xs opacity-70">
              <MapPin size={12} /> Arena do Grêmio
            </div>
            <div className="flex items-center gap-2 text-xs font-bold">
              <Clock size={12} /> 16:00
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}