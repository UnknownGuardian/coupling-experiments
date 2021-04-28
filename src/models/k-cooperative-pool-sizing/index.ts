import { FIFOQueue } from "@byu-se/quartermaster";
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

  dependencyQueue.inQueue = new FIFOQueue(Infinity, 28);  // the load to send to Z
  z.inQueue = new FIFOQueue(200, 28);  // the load Z is provisioned to handle

  return {
    name: "CooperativePoolSizing",
    entry: x,
    stages: { x, y, dependencyQueue, z }
  }
}