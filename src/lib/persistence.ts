const KEY_PREFIX = 'archmyback_';

// Module-level cache to avoid repeated localStorage reads
const storageCache = new Map<string, string | null>();

export function saveDesign(key: string, json: string): void {
  try {
    const fullKey = `${KEY_PREFIX}${key}`;
    localStorage.setItem(fullKey, json);
    storageCache.set(fullKey, json); // Keep cache in sync
  } catch (e) {
    console.error('Failed to save design:', e);
  }
}

export function loadDesign(key: string): string | null {
  try {
    const fullKey = `${KEY_PREFIX}${key}`;

    // Check cache first
    if (storageCache.has(fullKey)) {
      return storageCache.get(fullKey)!;
    }

    // Cache miss - read from localStorage
    const value = localStorage.getItem(fullKey);
    storageCache.set(fullKey, value);
    return value;
  } catch (e) {
    console.error('Failed to load design:', e);
    return null;
  }
}

export function listSavedDesigns(): string[] {
  const keys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const fullKey = localStorage.key(i);
      if (fullKey && fullKey.startsWith(KEY_PREFIX)) {
        keys.push(fullKey.slice(KEY_PREFIX.length));
      }
    }
  } catch (e) {
    console.error('Failed to list saved designs:', e);
  }
  return keys;
}

export function deleteDesign(key: string): void {
  try {
    const fullKey = `${KEY_PREFIX}${key}`;
    localStorage.removeItem(fullKey);
    storageCache.delete(fullKey); // Keep cache in sync
  } catch (e) {
    console.error('Failed to delete design:', e);
  }
}

export function setupAutosave(
  getState: () => string,
  intervalMs: number = 30000,
): () => void {
  const intervalId = setInterval(() => {
    try {
      const json = getState();
      saveDesign('autosave', json);
    } catch (e) {
      console.error('Autosave failed:', e);
    }
  }, intervalMs);

  return () => clearInterval(intervalId);
}
