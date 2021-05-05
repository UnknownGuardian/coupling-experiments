import { TICK_DILATION } from "..";
import { TimedQueuePool, AgeLRUCache, Z } from "../stages"
import { Model, ModelCreationFunction } from "./model";

/**
 * Responses from Z are cached and used in place of a call to Z when present.
 * A Cache component is used
 */
type RequestCachingModel = Model<{
  cache: AgeLRUCache;
  queuePool: TimedQueuePool
}>

export const createRequestCachingModel: ModelCreationFunction<RequestCachingModel> = (z: Z) => {
  const queuePool = new TimedQueuePool(z);
  const cache = new AgeLRUCache(queuePool);

  queuePool.timeout = 60 * TICK_DILATION;

  cache.ttl = 10000 * TICK_DILATION;
  cache.capacity = 1000; // 68% of the keyspace

  return {
    id: "E",
    name: "RequestCaching",
    entry: cache,
    stages: { cache, queuePool }
  }
}