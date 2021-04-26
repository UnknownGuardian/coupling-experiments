import { X, Y, DependencyQueue, Z } from "../../stages"
import { Model } from "../model";

export type LoadLevelingSheddingModel = Model<{
  x: X;
  y: Y;
  dependencyQueue: DependencyQueue
  z: Z;
}>

export function createLoadLevelingSheddingModel(): LoadLevelingSheddingModel {
  const z = new Z();
  const dependencyQueue = new DependencyQueue(z);
  const y = new Y(dependencyQueue);
  const x = new X(y);

  return {
    name: "LoadLevelingShedding",
    entry: x,
    stages: { x, y, dependencyQueue, z }
  }
}