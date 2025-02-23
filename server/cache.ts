
type CacheItem<T> = {
  value: T;
  timestamp: number;
};

class Cache {
  private store: Map<string, CacheItem<any>> = new Map();
  private ttl: number;

  constructor(ttlSeconds: number = 300) { // 5 minutes default TTL
    this.ttl = ttlSeconds * 1000;
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  get<T>(key: string): T | null {
    const item = this.store.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.ttl) {
      this.store.delete(key);
      return null;
    }

    return item.value as T;
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }
}

export const cache = new Cache();
