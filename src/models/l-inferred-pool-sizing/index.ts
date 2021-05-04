import { FIFOQueue } from "@byu-se/quartermaster";
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

  dependencyQueue.inQueue = new FIFOQueue(Infinity, 28);  // the load to send to Z
  z.inQueue = new FIFOQueue(1, 28);  // the load Z is provisioned to handle

  return {
    id: "L",
    name: "InferredPoolSizing",
    entry: x,
    stages: { x, y, dependencyQueue, z }
  }
}