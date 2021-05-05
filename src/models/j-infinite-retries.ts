import { Event, Retry } from "@byu-se/quartermaster";
import { TICK_DILATION } from "../";
import { QueuePool, Z, BackgroundCache, PriorityQueue, ConditionalRetry, FullQueueEvent } from "../stages"
import { Model, ModelCreationFunction } from "./model";

/**
 * Extending Async-Retries by using a priority queue and worker thread
 * pool to control the cost of the retry strategy
 * Queue, Pool, and Cache components are used
 */
export type InfiniteRetriesModel = Model<{
  cache: BackgroundCache;
  retry: Retry;
  queuePool: QueuePool
}>

export const createInfiniteRetriesModel: ModelCreationFunction<InfiniteRetriesModel> = (z: Z) => {
  const queuePool = new QueuePool(z);
  const retry = new ConditionalRetry(queuePool);
  const cache = new BackgroundCache(retry);

  cache.ttl = 10000 * TICK_DILATION;
  cache.capacity = 1000; // 68% of the keyspace

  retry.attempts = Infinity;
  // to ensure we don't retry when the dependency queue rejected because it is full.
  retry.exitCondition = (event) => (<FullQueueEvent>event).dependencyQueueFull;


  // inform queue order
  const queue = new PriorityQueue(200, 28);
  queue.priority = (event: Event) => (<Event & { priority: number }>event).priority
  queuePool.inQueue = queue;

  return {
    id: "J",
    name: "InfiniteRetries",
    entry: cache,
    stages: { cache, retry, queuePool }
  }
}