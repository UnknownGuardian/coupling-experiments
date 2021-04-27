import { Timeout } from "@byu-se/quartermaster";
import { TICK_DILATION } from "../..";
import { X, Y, DependencyQueue, Z, AgeLRUCache, TimedRetry } from "../../stages"
import { Model } from "../model";

export type RetriesModel = Model<{
  x: X;
  xyTimeout: Timeout;
  y: Y;
  cache: AgeLRUCache;
  dependencyQueue: DependencyQueue;
  yzTimeout: Timeout;
  retry: TimedRetry;
  z: Z;
}>

// TODO: consider pathological scenario when z's capacity is full and 
//       timed retry will hammer Z because of immediate rejection behavior.
export function createRetriesModel(): RetriesModel {
  const z = new Z();
  const retry = new TimedRetry(z);
  const yzTimeout = new Timeout(retry);
  const dependencyQueue = new DependencyQueue(retry);
  const cache = new AgeLRUCache(dependencyQueue);
  const y = new Y(cache);
  const xyTimeout = new Timeout(y);
  const x = new X(xyTimeout);

  cache.ttl = 10000 * TICK_DILATION;
  cache.capacity = 1000; // 68% of the keyspace

  xyTimeout.timeout = 100 * TICK_DILATION
  yzTimeout.timeout = 97 * TICK_DILATION
  retry.maxRetryTime = 96 * TICK_DILATION

  return {
    name: "Retries",
    entry: x,
    stages: { x, xyTimeout, y, cache, dependencyQueue, yzTimeout, retry, z }
  }
}