import { metronome, simulation } from "@byu-se/quartermaster";
import { Model } from "../../models";
import { Z } from "../../stages";
import { Scenario } from "..";
import { TICK_DILATION } from "../..";

/**
 * Z's capacity varies
 * 
 * @param model 
 * @returns 
 */
export function createCapacityAdaptivePoolScenario(model: Model<{ z: Z }>): Scenario {
  simulation.eventsPer1000Ticks = 400 / TICK_DILATION;
  simulation.keyspaceMean = 10000;
  simulation.keyspaceStd = 500;

  metronome.setTimeout(() => model.stages.z.inQueue.setNumWorkers(10), 1);
  metronome.setTimeout(() => model.stages.z.inQueue.setNumWorkers(20), 15000 * TICK_DILATION);
  metronome.setTimeout(() => model.stages.z.inQueue.setNumWorkers(35), 30000 * TICK_DILATION);
  metronome.setTimeout(() => model.stages.z.inQueue.setNumWorkers(15), 45000 * TICK_DILATION);
  metronome.setTimeout(() => model.stages.z.inQueue.setNumWorkers(40), 60000 * TICK_DILATION);

  return {
    name: "CapacityAdaptivePool"
  }
}