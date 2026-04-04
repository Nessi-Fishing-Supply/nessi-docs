const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Format a YYYY-MM-DD date string into a human-readable label.
 *
 *   Today        → "Today"
 *   Yesterday    → "Yesterday"
 *   This year    → "Mar 27"
 *   Older        → "Mar 27, 2025"
 */
export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.getTime() === today.getTime()) return 'Today';
  if (date.getTime() === yesterday.getTime()) return 'Yesterday';

  const monthLabel = MONTHS[date.getMonth()];
  if (date.getFullYear() === now.getFullYear()) {
    return `${monthLabel} ${date.getDate()}`;
  }
  return `${monthLabel} ${date.getDate()}, ${date.getFullYear()}`;
}
