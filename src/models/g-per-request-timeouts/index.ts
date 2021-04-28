import { Event } from "@byu-se/quartermaster";
import { TICK_DILATION } from "../..";
import { X, Y, DependencyQueue, Z, PassthroughCache } from "../../stages"
import { Model } from "../model";

export type PerRequestTimeoutModel = Model<{
  x: X;
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
  const x = new X(y);

  x.beforeHook = (event: Event) => {
    const e = event as Event & { readAtTime: number }
    e.readAtTime = Math.floor(30 + Math.random() * 10) * TICK_DILATION;
  }

  cache.ttl = 10000 * TICK_DILATION;
  cache.capacity = 1000; // 68% of the keyspace

  return {
    name: "PerRequestTimeout",
    entry: x,
    stages: { x, y, cache, dependencyQueue, z }
  }
}