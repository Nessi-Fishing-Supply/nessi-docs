const STORAGE_KEY = 'nessi-docs:recent-searches';
const MAX_ENTRIES = 8;

export function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(query: string): void {
  const trimmed = query.trim();
  if (!trimmed) return;
  const current = getRecentSearches().filter((q) => q !== trimmed);
  current.unshift(trimmed);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current.slice(0, MAX_ENTRIES)));
  } catch {
    // localStorage full or unavailable
  }
}

export function removeRecentSearch(query: string): void {
  const current = getRecentSearches().filter((q) => q !== query);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // noop
  }
}

export function clearRecentSearches(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}
