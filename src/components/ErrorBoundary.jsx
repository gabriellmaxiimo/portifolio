import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

// Erro ao desenhar uma aba fica só no conteúdo: cabeçalho e abas continuam funcionando.
// Sem isto o React desmonta o site inteiro e sobra uma tela branca. Use com key={aba} para limpar ao trocar de aba.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Erro ao exibir a página:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const { message, retry } = this.props;
    return (
      <div role="alert" className="flex min-h-[16rem] flex-col items-center justify-center gap-3 rounded-2xl border border-current/10 bg-current/5 p-6 text-center">
        <AlertCircle size={24} className="text-[var(--error-text)]" aria-hidden="true" />
        <p className="text-sm opacity-80">{message}</p>
        <button
          type="button"
          onClick={() => this.setState({ error: null })}
          className="inline-flex items-center gap-2 rounded-lg border border-current/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] hover:bg-current/10"
        >
          <RefreshCw size={14} aria-hidden="true" /> {retry}
        </button>
      </div>
    );
  }
}
