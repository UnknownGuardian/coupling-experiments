import { Event, metronome, CacheItem, Stage, stats } from "@byu-se/quartermaster";
import { LRUCache } from "./lru-cache"
import { SAMPLE_DURATION } from "..";
import { mean } from "../util";

type AgeEvent = Event & { age: number };

/**
 * A cache which performs the following steps:
 * 1. A non-blocking call to the dependency
 * 2. Read from cache
 */
export class BackgroundCache extends LRUCache {

  constructor(protected wrapped: Stage) {
    super(wrapped);
    metronome.setInterval(() => {
      const store: Record<string, CacheItem> = this.getStore();
      const ages = Object.values(store).map(x => metronome.now() - x.time)
      stats.record("avgCacheAge", mean(ages));
    }, SAMPLE_DURATION)
  }



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