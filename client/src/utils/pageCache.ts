const cache: Record<string, any> = {};

export function getPageCache<T>(key: string): T | null {
  if (cache[key] !== undefined) {
    return cache[key];
  }
  try {
    const data = sessionStorage.getItem(`page_cache_${key}`);
    if (data) {
      const parsed = JSON.parse(data);
      cache[key] = parsed;
      return parsed;
    }
  } catch (e) {
    // Ignore storage errors
  }
  return null;
}

export function setPageCache<T>(key: string, data: T): void {
  cache[key] = data;
  try {
    sessionStorage.setItem(`page_cache_${key}`, JSON.stringify(data));
  } catch (e) {
    // Ignore storage errors
  }
}

export function clearPageCache(key?: string): void {
  if (key) {
    delete cache[key];
    try {
      sessionStorage.removeItem(`page_cache_${key}`);
    } catch (e) {}
  } else {
    for (const k in cache) {
      delete cache[k];
    }
    try {
      sessionStorage.clear();
    } catch (e) {}
  }
}
