import { FIFOQueue } from "@byu-se/quartermaster";
import { QueuePool, Z } from "../stages"
import { Model, ModelCreationFunction } from "./model";

/**
 * Load-leveling, but the queue is bounded and excess requests are rejected.
 * Bounded Queue and Pool Components Used
 */
type LoadSheddingModel = Model<{
  queuePool: QueuePool
}>

export const createLoadSheddingModel: ModelCreationFunction<LoadSheddingModel> = (z: Z) => {
  const queuePool = new QueuePool(z);

  queuePool.inQueue = new FIFOQueue(200, 28);

  return {
    id: "C",
    name: "LoadShedding",
    entry: queuePool,
    stages: { queuePool }
  }
}