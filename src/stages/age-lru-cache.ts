import { Event, metronome, CacheItem, Stage, stats } from "@byu-se/quartermaster";
import { LRUCache } from "./lru-cache"
import { SAMPLE_DURATION, TICK_DILATION } from "..";
import { mean } from "../util";

type AgeEvent = Event & { age: number }

export class AgeLRUCache extends LRUCache {
  constructor(protected wrapped: Stage) {
    super(wrapped);
    metronome.setInterval(() => {
      const store: Record<string, CacheItem> = this.getStore();
      const ages = Object.values(store).map(x => metronome.now() - x.time)
      const m = mean(ages);
      stats.record("avgCacheAge", m);

      /*if (m >= 10_000 * TICK_DILATION) {
        console.log(store);
        const ages = Object.keys(store).map(k => ({ key: k, age: metronome.now() - store[k].time, expired: this.isExpired(store[k]) }));
        const order = this.order.map((k, i) => ({ index: i, key: k, age: metronome.now() - store[k].time, expired: this.isExpired(store[k]) }));
        console.log("  -->", ages, "TTL: ", this.ttl, "order", order)
      }*/
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
