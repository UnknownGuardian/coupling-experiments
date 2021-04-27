import { metronome, simulation, LRUCache } from "@byu-se/quartermaster";
import { TICK_DILATION } from "../..";
import { Model } from "../../models";
import { Z } from "../../stages";
import { Scenario } from "../scenario";

/**
 * Z's latency varies (incrementally getting worse and worse to some extreme)
 * 
 * @param model 
 * @returns 
 */
export function createImpatientClientScenario(model: Model<{ cache: LRUCache, z: Z }>): Scenario {
  simulation.eventsPer1000Ticks = 400 / TICK_DILATION;
  simulation.keyspaceMean = 10000;
  simulation.keyspaceStd = 500;

  model.stages.cache.ttl = 10000 * TICK_DILATION;
  model.stages.cache.capacity = 1000; // 68% of the keyspace

  metronome.setTimeout(() => model.stages.z.availability = 1, 1);
  metronome.setTimeout(() => model.stages.z.availability = 0.75, 15000 * TICK_DILATION);
  metronome.setTimeout(() => model.stages.z.availability = 0.50, 30000 * TICK_DILATION);
  metronome.setTimeout(() => model.stages.z.availability = 0.25, 45000 * TICK_DILATION);
  metronome.setTimeout(() => model.stages.z.availability = 0.00, 60000 * TICK_DILATION);
  return {
    name: "ImpatientClient"
  }
}