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
  const xyTimeout = new PerRequestTimeout(y);
  const x = new X(xyTimeout);

  return {
    name: "PerRequestTimeout",
    entry: x,
    stages: { x, xyTimeout, y, cache, dependencyQueue, z }
  }
}