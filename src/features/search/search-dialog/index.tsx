'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { searchGrouped, type SearchResult, type SearchCategory } from '../search-index';
import {
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
} from '../recent-searches';
import { useBranchHref } from '@/hooks/use-branch-href';
import { OverflowText } from './overflow-text';
import styles from './search-dialog.module.scss';

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Flatten grouped categories into a linear list for keyboard navigation. */
function flattenResults(categories: SearchCategory[]): SearchResult[] {
  return categories.flatMap((cat) => cat.results);
}

/** Assign categories to 3 columns, balancing by result count (shortest column gets next). */
function assignColumns(categories: SearchCategory[]): SearchCategory[][] {
  const columns: SearchCategory[][] = [[], [], []];
  const heights = [0, 0, 0];

  for (const cat of categories) {
    const minIdx = heights.indexOf(Math.min(...heights));
    columns[minIdx].push(cat);
    heights[minIdx] += cat.results.length + 1;
  }

  return columns;
}

export function SearchDialog({ isOpen, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const branchHref = useBranchHref();

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus());
      setRecentSearches(getRecentSearches());
    }
  }, [isOpen]);

  const categories = useMemo(() => searchGrouped(query), [query]);
  const flatResults = useMemo(() => flattenResults(categories), [categories]);
  const columns = useMemo(() => assignColumns(categories), [categories]);

  const navigate = useCallback(
    (result: SearchResult) => {
      if (query.trim()) addRecentSearch(query.trim());
      router.push(branchHref(result.href));
      onClose();
    },
    [router, onClose, query, branchHref],
  );

  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setActiveIndex(0);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, flatResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && flatResults[activeIndex]) {
        navigate(flatResults[activeIndex]);
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [flatResults, activeIndex, navigate, onClose],
  );

  const handleRecentClick = useCallback((q: string) => {
    setQuery(q);
    setActiveIndex(0);
  }, []);

  const handleRecentRemove = useCallback((q: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeRecentSearch(q);
    setRecentSearches(getRecentSearches());
  }, []);

  const handleClearRecent = useCallback(() => {
    clearRecentSearches();
    setRecentSearches([]);
  }, []);

  if (!isOpen) return null;

  // Track flat index across columns for active highlighting
  let flatIdx = 0;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.inputWrapper}>
          <span className={styles.searchIcon}>⌘K</span>
          <input
            ref={inputRef}
            className={styles.input}
            type="text"
            placeholder="Search journeys, endpoints, tables, states..."
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
          />
          <button className={styles.closeBtn} onClick={onClose}>
            esc
          </button>
        </div>

        {categories.length > 0 && (
          <div className={styles.results}>
            <div className={styles.columnGrid}>
              {columns.map((colCategories, colIdx) => (
                <div key={colIdx} className={styles.column}>
                  {colCategories.map((cat) => {
                    const catResults = cat.results.map((result, i) => {
                      const currentFlatIdx = flatIdx++;
                      return (
                        <button
                          key={`${result.type}-${result.title}-${i}`}
                          className={`${styles.result} ${currentFlatIdx === activeIndex ? styles.active : ''}`}
                          onClick={() => navigate(result)}
                          onMouseEnter={() => setActiveIndex(currentFlatIdx)}
                        >
                          <span className={styles.resultIcon} style={{ color: result.color }}>
                            {result.icon}
                          </span>
                          <div className={styles.resultText}>
                            <OverflowText className={styles.resultTitle}>
                              {result.title}
                            </OverflowText>
                            <OverflowText className={styles.resultSubtitle}>
                              {result.subtitle}
                            </OverflowText>
                          </div>
                        </button>
                      );
                    });

                    return (
                      <div key={cat.type} className={styles.category}>
                        <div className={styles.categoryHeader} style={{ color: cat.color }}>
                          {cat.label}
                        </div>
                        {catResults}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {query && categories.length === 0 && (
          <div className={styles.empty}>No results for &ldquo;{query}&rdquo;</div>
        )}

        {!query && recentSearches.length > 0 && (
          <div className={styles.recentSearches}>
            <div className={styles.recentHeader}>
              <span>Recent</span>
              <button className={styles.clearRecent} onClick={handleClearRecent}>
                Clear all
              </button>
            </div>
            {recentSearches.map((q) => (
              <button key={q} className={styles.recentItem} onClick={() => handleRecentClick(q)}>
                <span className={styles.recentQuery}>{q}</span>
                <span className={styles.recentRemove} onClick={(e) => handleRecentRemove(q, e)}>
                  ×
                </span>
              </button>
            ))}
          </div>
        )}

        {!query && recentSearches.length === 0 && (
          <div className={styles.hints}>
            <span>Journeys</span>
            <span>API endpoints</span>
            <span>Tables</span>
            <span>Lifecycles</span>
            <span>Architecture</span>
          </div>
        )}
      </div>
    </div>
  );
}
