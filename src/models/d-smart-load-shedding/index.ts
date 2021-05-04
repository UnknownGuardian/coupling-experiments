import { Event, FIFOQueue } from "@byu-se/quartermaster";
import { X, Y, DependencyQueue, Z, PriorityQueue } from "../../stages"
import { Model } from "../model";

type SmartLoadSheddingModel = Model<{
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

  x.beforeHook = (event: Event) => {
    const key = parseInt(event.key.slice(2));
    (<Event & { priority: number }>event).priority = key % 3;
  }


  const queue = new PriorityQueue(200, 28);
  queue.priority = (event: Event) => (<Event & { priority: number }>event).priority
  dependencyQueue.inQueue = queue;



  return {
    id: "D",
    name: "SmartLoadShedding",
    entry: x,
    stages: { x, y, dependencyQueue, z }
  }
}