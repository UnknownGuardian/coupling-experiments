import { FIFOQueue, Retry, Timeout } from "@byu-se/quartermaster";
import { TICK_DILATION } from "../..";
import { X, Y, DependencyQueue, Z, FullQueueEvent, AgeLRUCache, ConditionalRetry } from "../../stages"
import { Model } from "../model";

export type InfiniteRetriesModel = Model<{
  x: X;
  y: Y;
  cache: AgeLRUCache;
  yzTimeout: Timeout;
  retry: ConditionalRetry;
  dependencyQueue: DependencyQueue;
  z: Z;
}>

export function createInfiniteRetriesModel(): InfiniteRetriesModel {
  const z = new Z();
  const dependencyQueue = new DependencyQueue(z);
  const retry = new ConditionalRetry(dependencyQueue);
  const yzTimeout = new Timeout(retry);
  const cache = new AgeLRUCache(yzTimeout);
  const y = new Y(cache);
  const x = new X(y);

  // configurations below are specific to this model and not the scenario

  // to ensure we don't retry when the dependency queue rejected because it is full.
  retry.exitCondition = (event) => (<FullQueueEvent>event).dependencyQueueFull;

  // Can this cause problems with Z's availability as it drops to 0?
  retry.attempts = Infinity;

  dependencyQueue.inQueue = new FIFOQueue(200, 28);  // the load to send to Z
  z.inQueue = new FIFOQueue(Infinity, 28);  // the load Z is provisioned to handle

  cache.ttl = 10000 * TICK_DILATION;
  cache.capacity = 1000; // 68% of the keyspace

  yzTimeout.timeout = 60 * TICK_DILATION;

  return {
    name: "InfiniteRetries",
    entry: x,
    stages: { x, y, cache, yzTimeout, retry, dependencyQueue, z }
  }
}