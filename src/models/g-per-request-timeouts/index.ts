import { Event, Timeout } from "@byu-se/quartermaster";
import { TICK_DILATION } from "../..";
import { X, Y, DependencyQueue, Z, PassthroughCache, PerRequestTimeout } from "../../stages"
import { Model } from "../model";

export type PerRequestTimeoutModel = Model<{
  x: X;
  xyTimeout: PerRequestTimeout;
  y: Y;
  cache: PassthroughCache;
  dependencyQueue: DependencyQueue
  z: Z;
}>

export function createPerRequestTimeoutModel(): PerRequestTimeoutModel {
  const z = new Z();
  const dependencyQueue = new DependencyQueue(z);
  const cache = new PassthroughCache(dependencyQueue);
  const y = new Y(cache);
  const xyTimeout = new Timeout(y);
  const x = new X(xyTimeout);

  x.beforeHook = (event: Event) => {
    const e = event as Event & { readAtTime: number }
    e.readAtTime = Math.floor(10 + Math.random() * 20) * TICK_DILATION;
  }

  cache.ttl = 10000 * TICK_DILATION;
  cache.capacity = 1000; // 68% of the keyspace

  xyTimeout.timeout = 100 * TICK_DILATION;

  return {
    name: "PerRequestTimeout",
    entry: x,
    stages: { x, xyTimeout, y, cache, dependencyQueue, z }
  }
}