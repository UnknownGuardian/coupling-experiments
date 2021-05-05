import { FIFOQueue } from "@byu-se/quartermaster";
import { QueuePool, Z } from "../stages"
import { Model, ModelCreationFunction } from "./model";

/**
 * Requests are queued and serviced by threads in the worker pool
 * Unbounded Queue and Pool Components Used
 */
type LoadLevelingModel = Model<{
  queuePool: QueuePool
}>

export const createLoadLevelingModel: ModelCreationFunction<LoadLevelingModel> = (z: Z) => {
  const queuePool = new QueuePool(z);

  queuePool.inQueue = new FIFOQueue(Infinity, 28);

  return {
    id: "B",
    name: "LoadLeveling",
    entry: queuePool,
    stages: { queuePool }
  }
}