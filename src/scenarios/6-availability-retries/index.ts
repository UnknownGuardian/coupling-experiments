import { metronome, Retry, simulation, Timeout } from "@byu-se/quartermaster";
import { TICK_DILATION } from "../..";
import { Model } from "../../models";
import { AgeLRUCache, Z } from "../../stages";
import { Scenario } from "../scenario";

/**
 * Z's availability varies (incrementally getting worse and worse to 0%)
 * 
 * @param model 
 * @returns 
 */
export function createAvailabilityRetriesScenario(model: Model<{ xyTimeout: Timeout, cache: AgeLRUCache, retry: Retry, z: Z }>): Scenario {
  simulation.eventsPer1000Ticks = 400 / TICK_DILATION;
  simulation.keyspaceMean = 10000;
  simulation.keyspaceStd = 500;

  model.stages.retry.attempts = 2;
  model.stages.xyTimeout.timeout = 100 * TICK_DILATION;;
  model.stages.cache.ttl = 10000 * TICK_DILATION;;
  model.stages.cache.capacity = 1000; // 68% of the keyspace

  metronome.setTimeout(() => model.stages.z.availability = 1.00, 1);
  metronome.setTimeout(() => model.stages.z.availability = 0.75, 15000 * TICK_DILATION);
  metronome.setTimeout(() => model.stages.z.availability = 0.50, 30000 * TICK_DILATION);
  metronome.setTimeout(() => model.stages.z.availability = 0.25, 45000 * TICK_DILATION);
  metronome.setTimeout(() => model.stages.z.availability = 0.00, 60000 * TICK_DILATION);
  return {
    name: "AvailabilityRetries"
  }
}