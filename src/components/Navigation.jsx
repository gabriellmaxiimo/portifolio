import React, { useEffect, useRef } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { FINANCE_TAB_INDEX } from '../content/portfolioContent';

export default function Navigation() {
  const { currentT, activeTabIndex, setActiveTabIndex, themeClasses, googleSession } = usePortfolio();
  const navRef = useRef(null);

  // No celular a barra rola na horizontal: mantém a aba ativa visível (ex.: abrir /contato direto)
  useEffect(() => {
    navRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [activeTabIndex, currentT]);

  return (
    <nav ref={navRef} className="flex-none overflow-x-auto scrollbar-hide px-4 sm:px-6 lg:px-12 z-25 border-b border-current/10 pb-1 relative">
      <ul className="flex w-max min-w-full flex-nowrap gap-5 sm:gap-10 items-start">
        {currentT.tabs.map((tab, idx) => {
          if (idx === FINANCE_TAB_INDEX && !googleSession) return null;
          const isActive = activeTabIndex === idx;
          return (
            <li key={idx}>
              <button onClick={() => setActiveTabIndex(idx)} aria-current={isActive ? 'page' : undefined} className="flex flex-col gap-2 items-center group pt-2 whitespace-nowrap">
                <span className={`text-[10px] md:text-[11px] uppercase tracking-[0.15em] transition-all duration-300 ${isActive ? 'font-bold opacity-100 scale-105' : 'font-medium opacity-50 group-hover:opacity-80'}`}>
                  {tab}
                </span>
                <div className={`h-[2px] w-full rounded-full transition-all duration-300 ${isActive ? `${themeClasses.activeLine} opacity-100` : 'bg-transparent opacity-0'}`} />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}