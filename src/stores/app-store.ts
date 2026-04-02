import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { BranchData, BranchInfo } from '@/types/branch';
import type { SelectedItem } from '@/types/docs-context';
import { BRANCHES } from '@/data/branch-registry';
import { createSelectors } from './selectors';

/* ------------------------------------------------------------------ */
/*  State                                                              */
/* ------------------------------------------------------------------ */

interface AppState {
  /* Mode */
  mode: 'default' | 'diff' | 'trace';

  /* Branch */
  activeBranch: string;
  comparisonBranch: string | null;
  activeData: BranchData | null;
  allBranchData: Record<string, BranchData>;
  branches: BranchInfo[];

  /* Selection */
  selectedItem: SelectedItem;

  /* Appearance */
  theme: 'dark' | 'light';
}

/* ------------------------------------------------------------------ */
/*  Actions                                                            */
/* ------------------------------------------------------------------ */

interface AppActions {
  initBranch: (name: string, data: BranchData, allData: Record<string, BranchData>) => void;
  setComparisonBranch: (name: string | null) => void;
  activateDiffMode: (branch: string) => void;
  deactivateDiffMode: () => void;
  selectItem: (item: SelectedItem) => void;
  clearSelection: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

const useAppStoreBase = create<AppState & AppActions>()(
  persist(
    (set) => ({
      /* --- State defaults --- */
      mode: 'default',
      activeBranch: 'main',
      comparisonBranch: null,
      activeData: null,
      allBranchData: {},
      branches: BRANCHES,
      selectedItem: null,
      theme: 'dark',

      /* --- Actions --- */
      initBranch: (name, data, allData) =>
        set({ activeBranch: name, activeData: data, allBranchData: allData, branches: BRANCHES }),

      setComparisonBranch: (name) => set({ comparisonBranch: name }),

      activateDiffMode: (branch) => set({ comparisonBranch: branch, mode: 'diff' }),

      deactivateDiffMode: () => set({ comparisonBranch: null, mode: 'default' }),

      selectItem: (item) => set({ selectedItem: item }),

      clearSelection: () => set({ selectedItem: null }),

      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'nessi-docs-settings',
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);

export const useAppStore = createSelectors(useAppStoreBase);
