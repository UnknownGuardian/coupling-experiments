import { Event, metronome, LRUCache, CacheItem } from "@byu-se/quartermaster";
import { TICK_DILATION } from "..";

type PassThroughEvent = Event & { age: number } & { readAtTime: number };

/**
 * A cache which performs the following steps:
 * 1. A non-blocking call to the dependency
 * 2. Wait for Tr.
 * 3. Read from cache
 */
export class PassthroughCache extends LRUCache {
  public readAtTime: number = 100 * TICK_DILATION; // T'yz

  /**
   * Non-blocking Call, Wait workerTimeout, Read from Cache
   * @param event 
   */
  async workOn(event: PassThroughEvent): Promise<void> {
    // fire off call to wrap, but don't wait for call to complete
    this.makeCallToBeCached(event);

    // wait for Tr
    const tr = event.readAtTime || this.readAtTime
    await metronome.wait(tr);

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
      await this.wrapped.accept(event);
      this.set(event.key, { time: metronome.now() });
    } catch { }
  }
}