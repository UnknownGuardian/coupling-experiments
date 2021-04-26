import { Event } from "@byu-se/quartermaster";
import { X, Y, DependencyQueue, Z } from "../../stages"
import { PriorityQueue } from "../../stages/priority-queue";
import { Model } from "../model";

export type SmartLoadSheddingModel = Model<{
  x: X;
  y: Y;
  dependencyQueue: DependencyQueue
  z: Z;
}>

export function createSmartLoadSheddingModel(): SmartLoadSheddingModel {
  const z = new Z();
  const dependencyQueue = new DependencyQueue(z);
  const y = new Y(dependencyQueue);
  const x = new X(y);

  const queue = new PriorityQueue(1000, 28);
  queue.priority = (event: Event) => (<Event & { priority: number }>event).priority
  dependencyQueue.inQueue = queue;

  return {
    name: "SmartLoadShedding",
    entry: x,
    stages: { x, y, dependencyQueue, z }
  }
}