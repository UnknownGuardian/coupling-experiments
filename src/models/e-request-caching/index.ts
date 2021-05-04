import { TICK_DILATION } from "../..";
import { X, Y, TimedDependencyQueue, AgeLRUCache, Z } from "../../stages"
import { Model } from "../model";

type RequestCachingModel = Model<{
  x: X;
  y: Y;
  cache: AgeLRUCache;
  dependencyQueue: TimedDependencyQueue
  z: Z;
}>

export function createRequestCachingModel(): RequestCachingModel {
  const z = new Z();
  const dependencyQueue = new TimedDependencyQueue(z);
  const cache = new AgeLRUCache(dependencyQueue);
  const y = new Y(cache);
  const x = new X(y);

  dependencyQueue.timeout = 60 * TICK_DILATION;

  cache.ttl = 10000 * TICK_DILATION;
  cache.capacity = 1000; // 68% of the keyspace

  return {
    id: "E",
    name: "RequestCaching",
    entry: x,
    stages: { x, y, cache, dependencyQueue, z }
  }
}