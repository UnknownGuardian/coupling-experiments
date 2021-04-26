import { Event, metronome, LRUCache, CacheItem } from "@byu-se/quartermaster";

type PassThroughEvent = Event & { age: number } & { readAtTime: number };

/**
 * A cache which performs the following steps:
 * 1. An immediate non-blocking call to the dependency
 * 3. Wait for Tr.
 * 4. Read from cache
 */
export class PassthroughCache extends LRUCache {
  public readAtTime: number = 100; // T'yz

  public recentDependencyLatencies: number[] = [];

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
      const n = metronome.now();
      await this.wrapped.accept(event).finally(() => this.recentDependencyLatencies.push(metronome.now() - n))
      this.set(event.key, { time: metronome.now() });
    } catch { }
  }
}