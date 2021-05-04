import { Event } from "@byu-se/quartermaster";
import { TICK_DILATION } from "../..";
import { X, Y, DependencyQueue, Z, PassthroughCache } from "../../stages"
import { Model } from "../model";

type PerRequestTimeoutModel = Model<{
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
    const e = event as Event & { readAtTime: number; readAtTimeName: string; timeout: number }
    const key = parseInt(event.key.slice(2));
    e.readAtTime = [55, 60, 65][key % 3] * TICK_DILATION;
    e.readAtTimeName = ["fast", "medium", "slow"][key % 3];
    e.timeout = e.readAtTime + 10
  }

  cache.ttl = 10000 * TICK_DILATION;
  cache.capacity = 1000; // 68% of the keyspace

  return {
    id: "G",
    name: "PerRequestTimeout",
    entry: x,
    stages: { x, y, cache, dependencyQueue, z }
  }
}