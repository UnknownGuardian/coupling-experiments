import { TICK_DILATION } from "..";
import { QueuePool, Z, BackgroundCache } from "../stages"
import { Model, ModelCreationFunction } from "./model";

/**
 * Immediately return a cached value (or failure), and asynchronously load the cache
 * A Cache component is used
 */
type AsyncCacheLoadingModel = Model<{
  cache: BackgroundCache;
  queuePool: QueuePool
}>

export const createAsyncCacheLoadingModel: ModelCreationFunction<AsyncCacheLoadingModel> = (z: Z) => {
  const queuePool = new QueuePool(z);
  const cache = new BackgroundCache(queuePool);

  cache.ttl = 10000 * TICK_DILATION;
  cache.capacity = 1000; // 68% of the keyspace

  return {
    id: "F",
    name: "AsyncCacheLoading",
    entry: cache,
    stages: { cache, queuePool }
  }
}