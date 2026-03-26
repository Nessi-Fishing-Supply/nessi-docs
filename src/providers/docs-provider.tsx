'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { SelectedItem } from '@/types/docs-context';

interface DocsContextValue {
  selectedItem: SelectedItem;
  setSelectedItem: (item: SelectedItem) => void;
  clearSelection: () => void;
}

const DocsContext = createContext<DocsContextValue | null>(null);

export function DocsProvider({ children }: { children: ReactNode }) {
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const clearSelection = useCallback(() => setSelectedItem(null), []);

  return (
    <DocsContext.Provider value={{ selectedItem, setSelectedItem, clearSelection }}>
      {children}
    </DocsContext.Provider>
  );
}

export function useDocsContext() {
  const ctx = useContext(DocsContext);
  if (!ctx) throw new Error('useDocsContext must be used within DocsProvider');
  return ctx;
}
