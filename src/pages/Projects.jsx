import React from 'react';

export default function Projects({ currentT, themeClasses }) {
  return (
    <div className="animate-fade-in w-full">
      <h2 className={`text-3xl font-light mb-8 tracking-tight ${themeClasses.accent}`}>{currentT.projectsTitle}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {currentT.projects.map((proj, idx) => (
          <div key={idx} className={`p-6 md:p-8 rounded-2xl flex flex-col justify-between min-h-[200px] cursor-pointer ${themeClasses.glass} ${themeClasses.hover}`}>
            <div>
              <h3 className="text-xl md:text-2xl font-light mb-3">{proj.name}</h3>
              <p className="text-xs md:text-sm leading-relaxed mb-6 opacity-70">{proj.desc}</p>
            </div>
            <span className={`text-[10px] uppercase tracking-[0.2em] font-bold ${themeClasses.accent}`}>{proj.tech}</span>
          </div>
        ))}
      </div>
    </div>
  );
}