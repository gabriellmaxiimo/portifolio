import { createContext, useContext } from 'react';

const PortfolioContext = createContext(null);

export function PortfolioProvider({ value, children }) {
  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);

  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }

  return context;
}
