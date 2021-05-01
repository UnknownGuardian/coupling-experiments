import { Retry } from "@byu-se/quartermaster";
import { X, Y, DependencyQueue, Z } from "../../stages"
import { Model } from "../model";

export type NaivePrimeModel = Model<{
  x: X;
  dependencyQueue: DependencyQueue;
  retry: Retry;
  y: Y;
  z: Z;
}>

export function createNaivePrimeModel(): NaivePrimeModel {
  const z = new Z();
  const dependencyQueue = new DependencyQueue(z);
  const retry = new Retry(dependencyQueue);
  const y = new Y(retry);
  const x = new X(y);

  retry.attempts = 3;

  return {
    name: "NaivePrime",
    entry: x,
    stages: { x, y, retry, dependencyQueue, z }
  }
}