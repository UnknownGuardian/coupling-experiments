import { Retry, Timeout } from "@byu-se/quartermaster";
import { TICK_DILATION } from "../..";
import { X, Y, DependencyQueue, Z, FullQueueEvent, AgeLRUCache } from "../../stages"
import { ConditionalRetry } from "../../stages/conditional-retry";
import { Model } from "../model";

export type AvailabilityInfiniteRetriesModel = Model<{
  x: X;
  xyTimeout: Timeout;
  y: Y;
  cache: AgeLRUCache;
  yzTimeout: Timeout;
  retry: ConditionalRetry;
  dependencyQueue: DependencyQueue;
  z: Z;
}>

export function createAvailabilityInfiniteRetriesModel(): AvailabilityInfiniteRetriesModel {
  const z = new Z();
  const dependencyQueue = new DependencyQueue(z);
  const retry = new ConditionalRetry(dependencyQueue);
  const yzTimeout = new Timeout(retry);
  const cache = new AgeLRUCache(yzTimeout);
  const y = new Y(cache);
  const xyTimeout = new Timeout(y);
  const x = new X(xyTimeout);

  // configurations below are specific to this model and not the scenario

  // to ensure we don't retry when the dependency queue rejected because it is full.
  retry.exitCondition = (event) => (<FullQueueEvent>event).dependencyQueueFull;

  // Can this cause problems with Z's availability as it drops to 0?
  retry.attempts = Infinity;

  return {
    name: "AvailabilityInfiniteRetries",
    entry: x,
    stages: { x, xyTimeout, y, cache, yzTimeout, retry, dependencyQueue, z }
  }
}