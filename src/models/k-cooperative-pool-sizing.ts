import { FIFOQueue } from "@byu-se/quartermaster";
import { CooperativeQueuePool, Z } from "../stages"
import { Model, ModelCreationFunction } from "./model";

/**
 * Dynamically adjust pool size based on a response header from Z
 * A Queue and Pool Component is used
 */
type CooperativePoolSizingModel = Model<{
  queuePool: CooperativeQueuePool
}>

export const createCooperativePoolSizingModel: ModelCreationFunction<CooperativePoolSizingModel> = (z: Z) => {
  const queuePool = new CooperativeQueuePool(z);
  queuePool.inQueue = new FIFOQueue(Infinity, 28);

  return {
    id: "K",
    name: "CooperativePoolSizing",
    entry: queuePool,
    stages: { queuePool }
  }
}