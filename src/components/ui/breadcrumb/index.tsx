'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from './breadcrumb.module.scss';

export interface BreadcrumbSegment {
  label: string;
  href?: string;
}

export interface SwitcherItem {
  label: string;
  description?: string;
  href: string;
  active?: boolean;
}

interface BreadcrumbProps {
  segments: BreadcrumbSegment[];
  switcher?: SwitcherItem[];
}

function SwitchIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M3 4.5L6 1.5L9 4.5M3 7.5L6 10.5L9 7.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Breadcrumb({ segments, switcher }: BreadcrumbProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open, handleClickOutside]);

  return (
    <nav className={styles.breadcrumb}>
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        return (
          <span key={seg.label} style={{ display: 'contents' }}>
            {i > 0 && (
              <svg
                className={styles.separator}
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
              >
                <path
                  d="M3.5 2L6.5 5L3.5 8"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            {isLast ? (
              <span className={styles.switcherWrap} ref={dropdownRef}>
                <span className={styles.current}>{seg.label}</span>
                {switcher && switcher.length > 1 && (
                  <>
                    <button
                      className={styles.switcherBtn}
                      onClick={() => setOpen((p) => !p)}
                      aria-label="Switch journey"
                    >
                      <SwitchIcon />
                    </button>
                    {open && (
                      <div className={styles.dropdown}>
                        {switcher.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={
                              item.active ? styles.dropdownItemActive : styles.dropdownItem
                            }
                            onClick={() => setOpen(false)}
                          >
                            <div className={styles.dropdownTitle}>{item.label}</div>
                            {item.description && (
                              <div className={styles.dropdownDesc}>{item.description}</div>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </span>
            ) : seg.href ? (
              <Link href={seg.href} className={styles.link}>
                {seg.label}
              </Link>
            ) : (
              <span className={styles.current}>{seg.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
