import { Event } from "@byu-se/quartermaster";
import { QueuePool, Z, PriorityQueue } from "../stages"
import { Model, ModelCreationFunction } from "./model";

/**
 * Load-shedding, but the lowest value requests, based on their importance class, are shed.
 * Bounded Multilevel Priority Queue and Pool Components Used
 */
type MultilevelLoadSheddingModel = Model<{
  queuePool: QueuePool
}>

export const createMultilevelLoadSheddingModel: ModelCreationFunction<MultilevelLoadSheddingModel> = (z: Z) => {
  const queuePool = new QueuePool(z);

  const queue = new PriorityQueue(200, 28);
  queue.priority = (event: Event) => (<Event & { priority: number }>event).priority
  queuePool.inQueue = queue;

  return {
    id: "D",
    name: "MultilevelLoadShedding",
    entry: queuePool,
    stages: { queuePool }
  }
}