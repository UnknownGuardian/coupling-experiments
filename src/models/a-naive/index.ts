import { X, Y, DependencyQueue, Z } from "../../stages"
import { Model } from "../model";

export type NaiveModel = Model<{
  x: X;
  dependencyQueue: DependencyQueue;
  y: Y;
  z: Z;
}>

export function createNaiveModel(): NaiveModel {
  const z = new Z();
  const dependencyQueue = new DependencyQueue(z);
  const y = new Y(dependencyQueue);
  const x = new X(y);

  return {
    name: "Naive",
    entry: x,
    stages: { x, y, dependencyQueue, z }
  }
}