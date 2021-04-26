import { X, Y, HistoricalDependencyQueue, Z } from "../../stages"
import { Model } from "../model";

export type HistoricalCapacityAdaptivePoolModel = Model<{
  x: X;
  y: Y;
  dependencyQueue: HistoricalDependencyQueue
  z: Z;
}>

export function createHistoricalCapacityAdaptivePoolModel(): HistoricalCapacityAdaptivePoolModel {
  const z = new Z();
  const dependencyQueue = new HistoricalDependencyQueue(z);
  const y = new Y(dependencyQueue);
  const x = new X(y);

  return {
    name: "HistoricalCapacityAdaptivePool",
    entry: x,
    stages: { x, y, dependencyQueue, z }
  }
}