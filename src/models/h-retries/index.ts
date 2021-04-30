import { Timeout } from "@byu-se/quartermaster";
import { TICK_DILATION } from "../..";
import { X, Y, DependencyQueue, Z, AgeLRUCache, TimedRetry, TimedRetryDependencyQueue } from "../../stages"
import { Model } from "../model";

export type RetriesModel = Model<{
  x: X;
  y: Y;
  cache: AgeLRUCache;
  dependencyQueue: TimedRetryDependencyQueue;
  //yzTimeout: Timeout;
  //retry: TimedRetry;
  z: Z;
}>

// TODO: consider pathological scenario when z's capacity is full and 
//       timed retry will hammer Z because of immediate rejection behavior.
export function createRetriesModel(): RetriesModel {
  const z = new Z();
  //const retry = new TimedRetry(z);
  //const yzTimeout = new Timeout(retry);
  //const dependencyQueue = new DependencyQueue(yzTimeout);
  const dependencyQueue = new TimedRetryDependencyQueue(z);
  const cache = new AgeLRUCache(dependencyQueue);
  const y = new Y(cache);
  const x = new X(y);

  cache.ttl = 10000 * TICK_DILATION;
  cache.capacity = 1000; // 68% of the keyspace

  dependencyQueue.maxRetryTime = 60 * TICK_DILATION

  return {
    name: "Retries",
    entry: x,
    stages: { x, y, cache, dependencyQueue, /*yzTimeout, retry,*/ z }
  }
}