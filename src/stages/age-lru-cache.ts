import { Event, metronome, LRUCache, CacheItem, Stage, stats } from "@byu-se/quartermaster";
import { SAMPLE_DURATION } from "..";
import { mean } from "../util";

type AgeEvent = Event & { age: number }

export class AgeLRUCache extends LRUCache {
  constructor(protected wrapped: Stage) {
    super(wrapped);
    metronome.setInterval(() => {
      const store: Record<string, CacheItem> = this.getStore();
      const ages = Object.values(store).map(x => metronome.now() - x.time)
      stats.record("avgCacheAge", mean(ages));
    }, SAMPLE_DURATION)
  }

  async workOn(event: AgeEvent): Promise<void> {
    const cached = this.get(event.key) as CacheItem;
    if (cached) {
      event.age = metronome.now() - cached.time;
      return
    }

    await this.wrapped.accept(event);
    this.set(event.key, { time: metronome.now() });
    // otherwise we have it in the cache and return it
    event.age = 0;
  }
}
