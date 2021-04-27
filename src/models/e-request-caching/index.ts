import { TICK_DILATION } from "../..";
import { X, Y, DependencyQueue, AgeLRUCache, Z } from "../../stages"
import { Model } from "../model";

export type RequestCachingModel = Model<{
  x: X;
  y: Y;
  cache: AgeLRUCache;
  dependencyQueue: DependencyQueue
  z: Z;
}>

export function createRequestCachingModel(): RequestCachingModel {
  const z = new Z();
  const dependencyQueue = new DependencyQueue(z);
  const cache = new AgeLRUCache(dependencyQueue);
  const y = new Y(cache);
  const x = new X(y);

  cache.ttl = 10000 * TICK_DILATION;
  cache.capacity = 1000; // 68% of the keyspace

  return {
    name: "RequestCaching",
    entry: x,
    stages: { x, y, cache, dependencyQueue, z }
  }
}