import { FIFOServiceQueue } from "@byu-se/quartermaster";
import { InferredQueuePool, Z } from "../stages"
import { Model, ModelCreationFunction } from "./model";

/**
 * Dynamically adjust the pool size based on an inferred capacity of Z
 * A Cache component is used
 */
type InferredPoolSizingModel = Model<{
  queuePool: InferredQueuePool
}>

export const createInferredPoolSizingModel: ModelCreationFunction<InferredPoolSizingModel> = (z: Z) => {
  const queuePool = new InferredQueuePool(z);
  queuePool.inQueue = new FIFOServiceQueue(Infinity, 28);

  return {
    id: "L",
    name: "InferredPoolSizing",
    entry: queuePool,
    stages: { queuePool }
  }
}