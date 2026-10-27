// Small in-memory cache with expiry; oldest entry is evicted when full.
export class TtlCache<V> {
  private map = new Map<string, { value: V; expires: number }>();

  constructor(private ttlMs: number, private max: number) {}

  get(key: string) {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (entry.expires < Date.now()) {
      this.map.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: V) {
    if (this.map.size >= this.max) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }
    this.map.set(key, { value, expires: Date.now() + this.ttlMs });
  }
}
