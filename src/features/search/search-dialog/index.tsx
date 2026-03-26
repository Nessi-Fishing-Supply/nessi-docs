'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { search, type SearchResult } from '../search-index';
import styles from './search-dialog.module.scss';

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchDialog({ isOpen, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Focus the input when dialog opens
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // Derive results from query
  const results = useMemo(() => search(query), [query]);

  const navigate = useCallback(
    (result: SearchResult) => {
      router.push(result.href);
      onClose();
    },
    [router, onClose],
  );

  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setActiveIndex(0);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[activeIndex]) {
        navigate(results[activeIndex]);
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [results, activeIndex, navigate, onClose],
  );

  if (!isOpen) return null;

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

        {results.length > 0 && (
          <div className={styles.results}>
            {results.map((result, i) => (
              <button
                key={`${result.type}-${result.title}-${i}`}
                className={`${styles.result} ${i === activeIndex ? styles.active : ''}`}
                onClick={() => navigate(result)}
                onMouseEnter={() => setActiveIndex(i)}
              >
                <span className={styles.resultIcon} style={{ color: result.color }}>
                  {result.icon}
                </span>
                <div className={styles.resultText}>
                  <span className={styles.resultTitle}>{result.title}</span>
                  <span className={styles.resultSubtitle}>{result.subtitle}</span>
                </div>
                <span className={styles.resultType}>{result.type}</span>
              </button>
            ))}
          </div>
        )}

        {query && results.length === 0 && (
          <div className={styles.empty}>No results for &ldquo;{query}&rdquo;</div>
        )}

        {!query && (
          <div className={styles.hints}>
            <span>Journeys</span>
            <span>API endpoints</span>
            <span>Tables</span>
            <span>Lifecycles</span>
          </div>
        )}
      </div>
    </div>
  );
}
