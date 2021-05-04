import { Retry } from "@byu-se/quartermaster";
import { X, Y, DependencyQueue, Z } from "../../stages"
import { Model } from "../model";

type RetriesModel = Model<{
  x: X;
  dependencyQueue: DependencyQueue;
  retry: Retry;
  y: Y;
  z: Z;
}>

export function createRetriesModel(): RetriesModel {
  const z = new Z();
  const dependencyQueue = new DependencyQueue(z);
  const retry = new Retry(dependencyQueue);
  const y = new Y(retry);
  const x = new X(y);

  retry.attempts = 3;

  return {
    id: "H",
    name: "Retries",
    entry: x,
    stages: { x, y, retry, dependencyQueue, z }
  }
}