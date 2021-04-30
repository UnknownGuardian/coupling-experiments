import { FIFOQueue } from "@byu-se/quartermaster";
import { X, Y, DependencyQueue, Z } from "../../stages"
import { Model } from "../model";

export type LoadSheddingModel = Model<{
  x: X;
  y: Y;
  dependencyQueue: DependencyQueue
  z: Z;
}>

export function createLoadSheddingModel(): LoadSheddingModel {
  const z = new Z();
  const dependencyQueue = new DependencyQueue(z);
  const y = new Y(dependencyQueue);
  const x = new X(y);

  dependencyQueue.inQueue = new FIFOQueue(200, 28);  // the load to send to Z
  //z.inQueue = new FIFOQueue(Infinity, 28);  // the load Z is provisioned to handle

  return {
    name: "LoadShedding",
    entry: x,
    stages: { x, y, dependencyQueue, z }
  }
}