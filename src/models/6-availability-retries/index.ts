import { Retry, Timeout } from "@byu-se/quartermaster";
import { X, Y, DependencyQueue, Z, AgeLRUCache } from "../../stages"
import { Model } from "../model";

export type AvailabilityRetriesModel = Model<{
  x: X;
  xyTimeout: Timeout;
  y: Y;
  cache: AgeLRUCache;
  dependencyQueue: DependencyQueue;
  retry: Retry;
  z: Z;
}>

export function createAvailabilityRetriesModel(): AvailabilityRetriesModel {
  const z = new Z();
  const retry = new Retry(z);
  const dependencyQueue = new DependencyQueue(retry);
  const cache = new AgeLRUCache(dependencyQueue);
  const y = new Y(cache);
  const xyTimeout = new Timeout(y);
  const x = new X(xyTimeout);

  return {
    name: "AvailabilityRetries",
    entry: x,
    stages: { x, xyTimeout, y, cache, dependencyQueue, retry, z }
  }
}