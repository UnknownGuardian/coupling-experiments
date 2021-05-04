import { TICK_DILATION } from "../..";
import { X, Y, DependencyQueue, Z, BackgroundCache } from "../../stages"
import { Model } from "../model";

type AsyncCacheLoadingModel = Model<{
  x: X;
  y: Y;
  cache: BackgroundCache;
  dependencyQueue: DependencyQueue
  z: Z;
}>

export function createAsyncCacheLoadingModel(): AsyncCacheLoadingModel {
  const z = new Z();
  const dependencyQueue = new DependencyQueue(z);
  const cache = new BackgroundCache(dependencyQueue);
  const y = new Y(cache);
  const x = new X(y);

  cache.ttl = 10000 * TICK_DILATION;
  cache.capacity = 1000; // 68% of the keyspace

  return {
    id: "F",
    name: "AsyncCacheLoading",
    entry: x,
    stages: { x, y, cache, dependencyQueue, z }
  }
}