const KEY_PREFIX = 'archmyback_';

export function saveDesign(key: string, json: string): void {
  try {
    localStorage.setItem(`${KEY_PREFIX}${key}`, json);
  } catch (e) {
    console.error('Failed to save design:', e);
  }
}

export function loadDesign(key: string): string | null {
  try {
    return localStorage.getItem(`${KEY_PREFIX}${key}`);
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
    localStorage.removeItem(`${KEY_PREFIX}${key}`);
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
