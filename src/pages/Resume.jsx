import React, { useState } from 'react';
import { FileText, ExternalLink, Globe, Download } from 'lucide-react';

export default function Resume({ currentT, themeClasses }) {
  const [language, setLanguage] = useState('PT');

  // Adicionamos #toolbar=0 para esconder a barra padrão do navegador e deixar limpo
  const urlCurriculoPT = "/curriculo-pt.pdf#toolbar=0&view=FitH";
  const urlCurriculoEN = "/curriculo-en.pdf#toolbar=0&view=FitH";

  const currentUrl = language === 'PT' ? urlCurriculoPT : urlCurriculoEN;
  const rawUrl = language === 'PT' ? "/curriculo-pt.pdf" : "/curriculo-en.pdf";

  return (
    <div className="animate-fade-in w-full h-[78vh] flex flex-col">
      {/* Cabeçalho com o título e os botões de ação */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h2 className={`text-3xl font-light tracking-tight ${themeClasses.accent}`}>
          {currentT.resumeTitle}
        </h2>
        
        <div className="flex items-center gap-3">
          {/* Botão de alternar idioma */}
          <button
            onClick={() => setLanguage(language === 'PT' ? 'EN' : 'PT')}
            className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase flex items-center gap-2 border border-current/20 bg-current/10 ${themeClasses.hover} transition-all`}
          >
            <Globe size={14} />
            Idioma: {language === 'PT' ? 'Português (PT)' : 'English (EN)'}
          </button>

          {/* Botão de Download Direto */}
          <a 
            href={rawUrl} 
            download
            className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase flex items-center gap-2 border border-current/20 bg-current/10 ${themeClasses.hover} transition-all`}
            title="Baixar Currículo"
          >
            <Download size={14} /> Baixar
          </a>

          {/* Botão para abrir em tela cheia */}
          <a 
            href={rawUrl} 
            target="_blank" 
            rel="noreferrer"
            className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase flex items-center gap-2 border border-current/20 bg-current/10 ${themeClasses.hover} transition-all`}
            title="Abrir em nova aba"
          >
            <ExternalLink size={14} /> Expandir
          </a>
        </div>
      </div>

      {/* Visualizador limpo e centralizado */}
      <div className={`rounded-2xl flex flex-col overflow-hidden ${themeClasses.glass} flex-1 w-full h-full shadow-2xl border border-current/10`}>
        <div className="px-4 py-2.5 border-b border-current/10 flex items-center justify-between bg-current/5">
          <div className="flex items-center gap-2">
            <FileText size={14} className="opacity-70" /> 
            <span className="text-[10px] font-bold tracking-widest uppercase opacity-80">
              {language === 'PT' ? 'Currículo Oficial - Gabriel Máximo' : 'Official Resume - Gabriel Máximo'}
            </span>
          </div>
          <span className="text-[10px] uppercase font-mono tracking-widest opacity-50">PDF View</span>
        </div>
        
        <div className="flex-1 w-full h-full bg-black/40 flex items-center justify-center p-2">
          <iframe 
            src={currentUrl} 
            title="Visualizador de Currículo"
            className="w-full h-full border-none rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}