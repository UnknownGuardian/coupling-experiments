import { Retry } from "@byu-se/quartermaster";
import { TICK_DILATION } from "../";
import { QueuePool, Z, BackgroundCache } from "../stages"
import { Model, ModelCreationFunction } from "./model";

/**
 * Extending Async-Cache-Loading by retrying failed attempts to call Z
 * when loading the cache.
 * A Cache component is used
 */
type AsyncRetriesModel = Model<{
  cache: BackgroundCache;
  retry: Retry;
  queuePool: QueuePool
}>

export const createAsyncRetriesModel: ModelCreationFunction<AsyncRetriesModel> = (z: Z) => {
  const queuePool = new QueuePool(z);
  const retry = new Retry(queuePool)
  const cache = new BackgroundCache(retry);

  cache.ttl = 10000 * TICK_DILATION;
  cache.capacity = 1000; // 68% of the keyspace

  retry.attempts = 6;

  return {
    id: "I",
    name: "AsyncRetries",
    entry: cache,
    stages: { cache, retry, queuePool }
  }
}