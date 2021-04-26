import { X, Y, DependencyQueue, AgeLRUCache, Z } from "../../stages"
import { Model } from "../model";

export type AvailabilityCachingModel = Model<{
  x: X;
  y: Y;
  cache: AgeLRUCache;
  dependencyQueue: DependencyQueue
  z: Z;
}>

export function createAvailabilityCachingModel(): AvailabilityCachingModel {
  const z = new Z();
  const dependencyQueue = new DependencyQueue(z);
  const cache = new AgeLRUCache(dependencyQueue);
  const y = new Y(cache);
  const x = new X(y);

  return {
    name: "AvailabilityCaching",
    entry: x,
    stages: { x, y, cache, dependencyQueue, z }
  }
}