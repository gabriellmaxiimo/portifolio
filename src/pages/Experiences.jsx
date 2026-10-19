import React from 'react';
import './Experiences.css';

export default function Experiences({ currentT, themeClasses }) {
  return (
    <div className="animate-fade-in w-full">
      <h2 className={`text-3xl font-light mb-5 tracking-tight ${themeClasses.accent}`}>{currentT.expTitle}</h2>
      <div className="grid grid-cols-1 gap-3 md:gap-4">
        {currentT.exp.map((exp, idx) => (
          <div key={idx} className={`p-4 md:p-5 rounded-2xl ${themeClasses.glass}`}>
            <h3 className="text-lg md:text-xl font-light mb-1">{exp.role}</h3>
            <p className={`text-[10px] uppercase tracking-[0.18em] font-bold mb-1 ${themeClasses.accent}`}>{exp.company}</p>
            {exp.period && <p className="text-[10px] opacity-60 mb-2.5">{exp.period}</p>}
            <p className="text-xs md:text-sm opacity-70 leading-relaxed">{exp.desc}</p>
            <div className="experience-typing" aria-label="Em andamento">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}