import { Event, metronome, LRUCache, CacheItem } from "@byu-se/quartermaster";

type AgeEvent = Event & { age: number }

export class AgeLRUCache extends LRUCache {
  public recentDependencyLatencies: number[] = [];

  async workOn(event: AgeEvent): Promise<void> {
    const cached = this.get(event.key) as CacheItem;
    if (cached) {
      event.age = metronome.now() - cached.time;
      return
    }

    const n = metronome.now();
    await this.wrapped.accept(event).finally(() => this.recentDependencyLatencies.push(metronome.now() - n));
    this.set(event.key, { time: metronome.now() });
    // otherwise we have it in the cache and return it
    event.age = 0;
  }
}
