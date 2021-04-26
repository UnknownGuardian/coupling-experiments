import { X, Y, DependencyQueue, Z, PassthroughCache } from "../../stages"
import { Model } from "../model";

export type ImpatientClientModel = Model<{
  x: X;
  y: Y;
  cache: PassthroughCache;
  dependencyQueue: DependencyQueue
  z: Z;
}>

export function createImpatientClientModel(): ImpatientClientModel {
  const z = new Z();
  const dependencyQueue = new DependencyQueue(z);
  const cache = new PassthroughCache(dependencyQueue);
  const y = new Y(cache);
  const x = new X(y);

  return {
    name: "ImpatientClient",
    entry: x,
    stages: { x, y, cache, dependencyQueue, z }
  }
}