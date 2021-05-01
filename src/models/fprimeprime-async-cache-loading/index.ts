import { Event, metronome, Retry } from "@byu-se/quartermaster";
import { TICK_DILATION } from "../..";
import { X, Y, DependencyQueue, Z, BackgroundCache, PriorityQueue, ConditionalRetry, FullQueueEvent } from "../../stages"
import { Model } from "../model";

export type AsyncCacheLoadingPrimePrimeModel = Model<{
  x: X;
  y: Y;
  cache: BackgroundCache;
  retry: Retry;
  dependencyQueue: DependencyQueue
  z: Z;
}>

export function createAsyncCacheLoadingPrimePrimeModel(): AsyncCacheLoadingPrimePrimeModel {
  const z = new Z();
  const dependencyQueue = new DependencyQueue(z);
  const retry = new ConditionalRetry(dependencyQueue);
  const cache = new BackgroundCache(retry);
  const y = new Y(cache);
  const x = new X(y);

  cache.ttl = 10000 * TICK_DILATION;
  cache.capacity = 1000; // 68% of the keyspace

  retry.attempts = Infinity;
  // to ensure we don't retry when the dependency queue rejected because it is full.
  retry.exitCondition = (event) => (<FullQueueEvent>event).dependencyQueueFull;

  // inject event priority
  x.beforeHook = (event: Event) => {
    const key = parseInt(event.key.slice(2));
    (<Event & { priority: number }>event).priority = key % 3;
  }

  // inform queue order
  const queue = new PriorityQueue(200, 28);
  queue.priority = (event: Event) => (<Event & { priority: number }>event).priority
  dependencyQueue.inQueue = queue;

  /*8metronome.setInterval(() => {
    console.log(metronome.now() / TICK_DILATION / 1000, "Processing", queue.length(), "in the queue still")
  }, 1_000 * TICK_DILATION)*/

  return {
    name: "AsyncCacheLoadingPrimePrime",
    entry: x,
    stages: { x, y, cache, retry, dependencyQueue, z }
  }
}