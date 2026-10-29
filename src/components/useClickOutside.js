import { useEffect } from 'react';

// Fecha um painel quando o usuário clica/toca fora de `ref` ou aperta Esc.
export function useClickOutside(ref, onOutside, active) {
  useEffect(() => {
    if (!active) return undefined;
    const handlePointer = (event) => {
      if (!ref.current?.contains(event.target)) onOutside();
    };
    const handleKey = (event) => {
      if (event.key === 'Escape') onOutside();
    };
    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [ref, onOutside, active]);
}
