'use client';

import { useCallback, useState } from 'react';

interface UseFilterToggleResult<T> {
  active: Set<T>;
  toggle: (option: T) => void;
  toggleAll: () => void;
  isAllActive: boolean;
}

export function useFilterToggle<T extends string>(
  allOptions: T[],
  initial?: T[],
): UseFilterToggleResult<T> {
  const [active, setActive] = useState<Set<T>>(() => new Set(initial ?? allOptions));

  const isAllActive = active.size === allOptions.length;

  const toggle = useCallback(
    (option: T) => {
      setActive((prev) => {
        const next = new Set(prev);
        if (next.has(option)) {
          next.delete(option);
          if (next.size === 0) return new Set(allOptions);
        } else {
          next.add(option);
        }
        return next;
      });
    },
    [allOptions],
  );

  const toggleAll = useCallback(() => {
    setActive(new Set(allOptions));
  }, [allOptions]);

  return { active, toggle, toggleAll, isAllActive };
}
