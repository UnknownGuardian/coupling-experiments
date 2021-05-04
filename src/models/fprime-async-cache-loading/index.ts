import { Retry } from "@byu-se/quartermaster";
import { TICK_DILATION } from "../..";
import { X, Y, DependencyQueue, Z, BackgroundCache } from "../../stages"
import { Model } from "../model";

export type AsyncCacheLoadingPrimeModel = Model<{
  x: X;
  y: Y;
  cache: BackgroundCache;
  retry: Retry;
  dependencyQueue: DependencyQueue
  z: Z;
}>

export function createAsyncCacheLoadingPrimeModel(): AsyncCacheLoadingPrimeModel {
  const z = new Z();
  const dependencyQueue = new DependencyQueue(z);
  const retry = new Retry(dependencyQueue)
  const cache = new BackgroundCache(retry);
  const y = new Y(cache);
  const x = new X(y);

  cache.ttl = 10000 * TICK_DILATION;
  cache.capacity = 1000; // 68% of the keyspace

  retry.attempts = 6;

  return {
    name: "AsyncCacheLoadingPrime",
    entry: x,
    stages: { x, y, cache, retry, dependencyQueue, z }
  }
}