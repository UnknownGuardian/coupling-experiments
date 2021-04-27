import { X, Y, CooperativeDependencyQueue, Z } from "../../stages"
import { Model } from "../model";

export type CooperativePoolSizingModel = Model<{
  x: X;
  y: Y;
  dependencyQueue: CooperativeDependencyQueue
  z: Z;
}>

export function createCooperativePoolSizingModel(): CooperativePoolSizingModel {
  const z = new Z();
  const dependencyQueue = new CooperativeDependencyQueue(z);
  const y = new Y(dependencyQueue);
  const x = new X(y);

  return {
    name: "CooperativePoolSizing",
    entry: x,
    stages: { x, y, dependencyQueue, z }
  }
}