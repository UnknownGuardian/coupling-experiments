import { metronome, simulation } from "@byu-se/quartermaster";
import { TICK_DILATION } from "../..";
import { Model } from "../../models";
import { AgeLRUCache, Z } from "../../stages";
import { Scenario } from "../scenario";

/**
 * Z's availability varies intermittently
 * 
 * @param model 
 * @returns 
 */
export function createAvailabilityCachingScenario(model: Model<{ cache: AgeLRUCache, z: Z }>): Scenario {
  simulation.eventsPer1000Ticks = 400 / TICK_DILATION;
  simulation.keyspaceMean = 10000;
  simulation.keyspaceStd = 500;

  model.stages.cache.ttl = 10000 * TICK_DILATION;;
  model.stages.cache.capacity = 1000; // 68% of the keyspace

  metronome.setTimeout(() => model.stages.z.availability = 1, 1);
  metronome.setTimeout(() => model.stages.z.availability = 0.60, 5000 * TICK_DILATION);
  metronome.setTimeout(() => model.stages.z.availability = 0.85, 30000 * TICK_DILATION);
  metronome.setTimeout(() => model.stages.z.availability = 0.70, 50000 * TICK_DILATION);
  metronome.setTimeout(() => model.stages.z.availability = 0.95, 55000 * TICK_DILATION);
  metronome.setTimeout(() => model.stages.z.availability = 0.25, 58000 * TICK_DILATION);
  return {
    name: "AvailabilityCaching"
  }
}