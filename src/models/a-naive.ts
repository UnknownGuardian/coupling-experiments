import { QueuePool, Z } from "../stages"
import { Model, ModelCreationFunction } from "./model";

/**
 * Per-request thread calls Z and responds to X when Z responds.
 * No components used.
 */
type NaiveModel = Model<{
  queuePool: QueuePool;
}>

export const createNaiveModel: ModelCreationFunction<NaiveModel> = (z: Z) => {
  const queuePool = new QueuePool(z);
  return {
    id: "A",
    name: "Naive",
    entry: queuePool,
    stages: { queuePool }
  }
}