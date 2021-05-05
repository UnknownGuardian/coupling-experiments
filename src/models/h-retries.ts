import { Retry } from "@byu-se/quartermaster";
import { QueuePool, Z } from "../stages"
import { Model, ModelCreationFunction } from "./model";

/**
 * On failed responses from Z, Y retries call to Z up to a maximum
 * number of tries.
 * No Components Used
 */
type RetriesModel = Model<{
  queuePool: QueuePool;
  retry: Retry;
}>

export const createRetriesModel: ModelCreationFunction<RetriesModel> = (z: Z) => {
  const queuePool = new QueuePool(z);
  const retry = new Retry(queuePool);

  retry.attempts = 3;

  return {
    id: "H",
    name: "Retries",
    entry: retry,
    stages: { retry, queuePool }
  }
}