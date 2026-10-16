import React from 'react';

export default function Experiences({ currentT, themeClasses }) {
  return (
    <div className="animate-fade-in w-full">
      <h2 className={`text-3xl font-light mb-8 tracking-tight ${themeClasses.accent}`}>{currentT.expTitle}</h2>
      <div className="grid grid-cols-1 gap-4 md:gap-6">
        {currentT.exp.map((exp, idx) => (
          <div key={idx} className={`p-6 md:p-8 rounded-2xl cursor-pointer ${themeClasses.glass} ${themeClasses.hover}`}>
            <h3 className="text-xl md:text-2xl font-light mb-1">{exp.role}</h3>
            <p className={`text-xs uppercase tracking-[0.2em] font-bold mb-4 ${themeClasses.accent}`}>{exp.company}</p>
            <p className="text-xs md:text-sm opacity-70 leading-relaxed">{exp.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}