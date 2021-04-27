import { metronome, Retry, simulation, Timeout } from "@byu-se/quartermaster";
import { Model } from "../../models";
import { AgeLRUCache, ConditionalRetry, Z } from "../../stages";
import { createAvailabilityRetriesScenario, Scenario } from "../";
import { TICK_DILATION } from "../..";

/**
 * Z's availability varies (incrementally getting worse and worse to 0%)
 * 
 * @param model 
 * @returns 
 */
export function createAvailabilityInfiniteRetriesScenario(model: Model<{ xyTimeout: Timeout, cache: AgeLRUCache, yzTimeout: Timeout, retry: ConditionalRetry, z: Z }>): Scenario {
  // ensure that the yz timeout is close to the xy timeout specified in the scenario
  model.stages.yzTimeout.timeout = 95 * TICK_DILATION;
  return createAvailabilityRetriesScenario(model);
}