import { metronome, simulation } from "@byu-se/quartermaster";
import { TICK_DILATION } from "../..";
import { Model } from "../../models";
import { Z } from "../../stages";
import { Scenario } from "../scenario";

/**
 * Z's availability is decreasing
 * 
 * @param model 
 * @returns 
 */
export function decreasingAvailability(model: Model<{ z: Z }>): Scenario {
  simulation.eventsPer1000Ticks = 400 / TICK_DILATION
  simulation.keyspaceMean = 10000;
  simulation.keyspaceStd = 500;

  metronome.setTimeout(() => model.stages.z.availability = 1, 1);
  metronome.setTimeout(() => model.stages.z.availability = 0.75, 10000 * TICK_DILATION);
  metronome.setTimeout(() => model.stages.z.availability = 0.50, 25000 * TICK_DILATION);
  metronome.setTimeout(() => model.stages.z.availability = 0.25, 40000 * TICK_DILATION);
  metronome.setTimeout(() => model.stages.z.availability = 0.05, 55000 * TICK_DILATION);

  return {
    name: "DecreaseAvailability"
  }
}