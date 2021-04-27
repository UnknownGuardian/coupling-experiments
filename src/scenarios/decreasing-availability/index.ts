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

  // linear function, lower bound at 0.05
  metronome.setInterval(() => {
    model.stages.z.availability = Math.max(0.05, 1 - (metronome.now() * 0.00001 / TICK_DILATION));
  }, 10)

  // step function
  /*
  metronome.setTimeout(() => model.stages.z.availability = 1, 1);
  metronome.setTimeout(() => model.stages.z.availability = 0.75, 10000 * TICK_DILATION);
  metronome.setTimeout(() => model.stages.z.availability = 0.50, 25000 * TICK_DILATION);
  metronome.setTimeout(() => model.stages.z.availability = 0.25, 40000 * TICK_DILATION);
  metronome.setTimeout(() => model.stages.z.availability = 0.05, 55000 * TICK_DILATION);
  */

  return {
    name: "DecreaseAvailability"
  }
}