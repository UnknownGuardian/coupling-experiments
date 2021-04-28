import { Event, metronome, LRUCache, CacheItem, Stage, stats } from "@byu-se/quartermaster";
import { SAMPLE_DURATION, TICK_DILATION } from "..";
import { mean } from "../util";

type PassThroughEvent = Event & { age: number } & { readAtTime: number };

/**
 * A cache which performs the following steps:
 * 1. A non-blocking call to the dependency
 * 2. Wait for Tr.
 * 3. Read from cache
 */
export class PassthroughCache extends LRUCache {
  public readAtTime: number = 100 * TICK_DILATION; // T'yz

  constructor(protected wrapped: Stage) {
    super(wrapped);
    metronome.setInterval(() => {
      const store: Record<string, CacheItem> = this.getStore();
      const ages = Object.values(store).map(x => metronome.now() - x.time)
      stats.record("avgCacheAge", mean(ages));
    }, SAMPLE_DURATION)
  }

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