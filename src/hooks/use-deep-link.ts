'use client';

import { useEffect, useRef, useState } from 'react';

interface UseDeepLinkResult {
  isHighlighted: boolean;
  ref: React.RefObject<HTMLDivElement | null>;
}

export function useDeepLink(id: string, onMatch?: () => void): UseDeepLinkResult {
  const ref = useRef<HTMLDivElement>(null);
  const [isHighlighted, setIsHighlighted] = useState(false);

  useEffect(() => {
    function checkHash() {
      const hashes = window.location.hash.split('#').filter(Boolean);
      if (hashes.includes(id)) {
        onMatch?.();
        setIsHighlighted(true);
        history.replaceState(null, '', window.location.pathname);
        setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
        setTimeout(() => setIsHighlighted(false), 9500);
      }
    }

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { isHighlighted, ref };
}
