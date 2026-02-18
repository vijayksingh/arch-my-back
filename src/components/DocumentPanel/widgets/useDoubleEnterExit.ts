import { useRef, useCallback } from 'react';

export function useDoubleEnterExit(onExit: () => void) {
  const lastWasEnter = useRef(false);
  return useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (lastWasEnter.current) {
          e.preventDefault();
          onExit();
        }
        lastWasEnter.current = true;
        setTimeout(() => {
          lastWasEnter.current = false;
        }, 400);
      } else {
        lastWasEnter.current = false;
      }
    },
    [onExit],
  );
}
