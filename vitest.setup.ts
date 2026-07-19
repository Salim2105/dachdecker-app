if (typeof globalThis.localStorage === "undefined") {
  class MemoryStorage {
    private store: Record<string, string> = {};
    clear() {
      this.store = {};
    }
    getItem(key: string): string | null {
      return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
    }
    setItem(key: string, value: string) {
      this.store[key] = String(value);
    }
    removeItem(key: string) {
      delete this.store[key];
    }
    key(index: number): string | null {
      return Object.keys(this.store)[index] ?? null;
    }
    get length() {
      return Object.keys(this.store).length;
    }
  }
  Object.defineProperty(globalThis, "localStorage", {
    value: new MemoryStorage(),
    writable: true,
    configurable: true,
  });
}
