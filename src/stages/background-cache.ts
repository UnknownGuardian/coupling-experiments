import { Event, metronome, LRUCache, CacheItem } from "@byu-se/quartermaster";

type AgeEvent = Event & { age: number };

/**
 * A cache which performs the following steps:
 * 1. A non-blocking call to the dependency
 * 2. Read from cache
 */
export class BackgroundCache extends LRUCache {

  async workOn(event: AgeEvent): Promise<void> {
    // fire off call to wrap, but don't wait for call to complete
    this.makeCallToBeCached(event);

    // if not in cache, throw an error
    const cached = this.get(event.key) as CacheItem;
    if (!cached) {
      throw "fail";
    }

    // otherwise we have it in the cache and return it
    event.age = metronome.now() - cached.time;
  }

  async makeCallToBeCached(event: Event): Promise<void> {
    try {
      await this.wrapped.accept(event)
      this.set(event.key, { time: metronome.now() });
    } catch { }
  }
}