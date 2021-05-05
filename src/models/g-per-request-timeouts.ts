import { TICK_DILATION } from "../";
import { QueuePool, Z, PassthroughCache } from "../stages"
import { Model, ModelCreationFunction } from "./model";

/**
 * Immediately return cached value (or failure), but wait a per-request
 * timeout supplied by X before loading from the cache.
 * A Cache component is used
 */
type PerRequestTimeoutModel = Model<{
  cache: PassthroughCache;
  queuePool: QueuePool
}>

export const createPerRequestTimeoutModel: ModelCreationFunction<PerRequestTimeoutModel> = (z: Z) => {
  const queuePool = new QueuePool(z);
  const cache = new PassthroughCache(queuePool);

  cache.ttl = 10000 * TICK_DILATION;
  cache.capacity = 1000; // 68% of the keyspace

  return {
    id: "G",
    name: "PerRequestTimeout",
    entry: cache,
    stages: { cache, queuePool }
  }
}