'use client';

import { useState, useEffect, useCallback } from 'react';
import { SearchDialog } from './search-dialog';

export function SearchTrigger() {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => {
          if (!prev) {
            // Increment key to remount dialog fresh each time it opens
            setKey((k) => k + 1);
          }
          return !prev;
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleClose = useCallback(() => setOpen(false), []);

  return <SearchDialog key={key} isOpen={open} onClose={handleClose} />;
}
