import { Retry, Timeout } from "@byu-se/quartermaster";
import { X, Y, InformedDependencyQueue, Z } from "../../stages"
import { Model } from "../model";

export type CapacityAdaptivePoolModel = Model<{
  x: X;
  y: Y;
  dependencyQueue: InformedDependencyQueue
  z: Z;
}>

export function createCapacityAdaptivePoolModel(): CapacityAdaptivePoolModel {
  const z = new Z();
  const dependencyQueue = new InformedDependencyQueue(z);
  const y = new Y(dependencyQueue);
  const x = new X(y);

  return {
    name: "CapacityAdaptivePool",
    entry: x,
    stages: { x, y, dependencyQueue, z }
  }
}