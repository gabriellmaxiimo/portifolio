import { useState } from "react";
import { ChevronLeft, ChevronRight, Code2, GraduationCap, WalletCards } from "lucide-react";

const projectVisuals = [
  {
    Icon: WalletCards,
    style: "from-cyan-500/30 via-blue-500/15 to-indigo-950/70",
    label: "PAYMENTS · API",
  },
  {
    Icon: GraduationCap,
    style: "from-emerald-500/30 via-teal-500/15 to-slate-950/70",
    label: "ACADEMIC · DATA",
  },
];

export default function Projects({ currentT, themeClasses }) {
  const [activeProject, setActiveProject] = useState(0);
  const projects = currentT.projects;
  const project = projects[activeProject];
  const visual = projectVisuals[activeProject % projectVisuals.length];
  const VisualIcon = visual.Icon ?? Code2;
  const goToProject = (offset) => {
    setActiveProject((index) => (index + offset + projects.length) % projects.length);
  };

  return (
    <div className="animate-fade-in w-full">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className={`text-3xl font-light tracking-tight ${themeClasses.accent}`}>{currentT.projectsTitle}</h2>
        {projects.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToProject(-1)}
              className={`rounded-full p-2 ${themeClasses.glass}`}
              aria-label="Projeto anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => goToProject(1)}
              className={`rounded-full p-2 ${themeClasses.glass}`}
              aria-label="Próximo projeto"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {project && (
        <article className={`overflow-hidden rounded-2xl ${themeClasses.glass}`}>
          <div className={`relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br ${visual.style}`}>
            <div className="absolute inset-0 opacity-20" aria-hidden="true">
              <div className="absolute -left-10 -top-16 h-48 w-48 rounded-full border border-white/50" />
              <div className="absolute -bottom-28 -right-8 h-64 w-64 rounded-full border border-white/40" />
              <div className="absolute inset-x-0 top-1/2 h-px bg-white/30" />
              <div className="absolute inset-y-0 left-1/2 w-px bg-white/30" />
            </div>
            <div className="relative flex flex-col items-center gap-2 text-white drop-shadow-lg">
              <VisualIcon size={54} strokeWidth={1.2} aria-hidden="true" />
              <span className="text-[10px] font-semibold tracking-[0.25em]">{visual.label}</span>
            </div>
            {projects.length > 1 && (
              <span className="absolute bottom-3 right-4 rounded-full bg-black/35 px-2.5 py-1 text-xs text-white">
                {activeProject + 1} / {projects.length}
              </span>
            )}
          </div>
          <div className="p-4 md:p-5">
            <h3 className="mb-1.5 text-lg font-medium">{project.name}</h3>
            <p className="mb-3 text-sm leading-relaxed opacity-75">{project.desc}</p>
            <span className={`text-[10px] uppercase tracking-[0.16em] font-bold ${themeClasses.accent}`}>{project.tech}</span>
          </div>
        </article>
      )}

      {projects.length > 1 && (
        <div className="mt-3 flex justify-center gap-2" aria-label="Selecionar projeto">
          {projects.map((item, index) => (
            <button
              key={`${item.name}-${index}`}
              type="button"
              onClick={() => setActiveProject(index)}
              className={`h-2 rounded-full transition-all ${index === activeProject ? "w-6 bg-current" : "w-2 bg-current/30"}`}
              aria-label={`Mostrar projeto ${index + 1}: ${item.name}`}
              aria-current={index === activeProject ? "true" : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
