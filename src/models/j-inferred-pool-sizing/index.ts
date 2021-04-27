import { X, Y, InferredDependencyQueue, Z } from "../../stages"
import { Model } from "../model";

export type InferredPoolSizingModel = Model<{
  x: X;
  y: Y;
  dependencyQueue: InferredDependencyQueue
  z: Z;
}>

export function createInferredPoolSizingModel(): InferredPoolSizingModel {
  const z = new Z();
  const dependencyQueue = new InferredDependencyQueue(z);
  const y = new Y(dependencyQueue);
  const x = new X(y);

  return {
    name: "InferredPoolSizing",
    entry: x,
    stages: { x, y, dependencyQueue, z }
  }
}