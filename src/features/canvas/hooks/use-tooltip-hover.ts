'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_CLOSE_DELAY = 120;

export function useTooltipHover(closeDelay = DEFAULT_CLOSE_DELAY) {
  const [visible, setVisible] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setVisible(true);
  }, []);

  const scheduleClose = useCallback(() => {
    closeTimer.current = setTimeout(() => setVisible(false), closeDelay);
  }, [closeDelay]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  return { visible, show, scheduleClose };
}
