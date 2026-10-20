import React, { lazy, Suspense } from 'react';

const CurriculumViewer = lazy(() => import('../../CurriculumPDF/src/components/CurriculumViewer/CurriculumViewer'));

export default function Resume({ currentT, themeClasses }) {
  return (
    <div className="animate-fade-in w-full h-[78vh] min-h-[30rem] flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className={`text-3xl font-light tracking-tight ${themeClasses.accent}`}>
          {currentT.resumeTitle}
        </h2>
      </div>
      <Suspense fallback={<p className="py-8 text-center opacity-70">Carregando visualizador...</p>}>
        <CurriculumViewer />
      </Suspense>
    </div>
  );
}