import { Cache, CacheItem, metronome } from "@byu-se/quartermaster"

/**
 * Quartermaster 1.0.0 LRU Cache contains 2 bugs, which are critical for experiments we run
 * that are fixed in this implementation, and available in future versions of Quartermaster.
 * Specifically, these bugs are:
 * 1) Prune doesn't correctly evict expired items
 * 2) Read doesn't update the recent used order. Only writes affect order.
 */
export class LRUCache extends Cache {
  public ttl: number = 10000;
  public capacity: number = 1000;
  protected order: string[] = [];



  public get(key: string): any {
    this.prune();
    const value = super.get(key);
    if (value) {
      // update order
      this.order = this.order.filter(x => x != key);
      this.order.push(key);
    }
    return value;
  }

  public set(key: string, value: any): void {
    this.order = this.order.filter(x => x != key);
    this.order.push(key);
    super.set(key, value);
  }

  public getStore(): any {
    this.prune();
    return super.getStore();
  }

  /**
   * Checks if a line item is older than the ttl
   * @param lineItem The line item to check
   */
  protected isExpired(lineItem: CacheItem) {
    return metronome.now() - lineItem.time > this.ttl;
  }

  /**
   * Evict items that are expired (always) or lru (when over capacity)
   */
  protected prune(): void {
    // remove expired items first
    for (let i = 0; i < this.order.length; i++) {
      const key = this.order[i];
      if (this.isExpired(this._cache[key])) {
        this.remove(key);
        this.order.splice(i, 1);
      }
    }

    // then look for lru
    while (this.order.length > this.capacity) {
      const keyToRemove = this.order.shift() as string;
      this.remove(keyToRemove)
    }
  }
}
