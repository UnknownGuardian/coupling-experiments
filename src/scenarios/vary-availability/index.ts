import { metronome, simulation } from "@byu-se/quartermaster";
import { TICK_DILATION } from "../..";
import { Model } from "../../models";
import { Z } from "../../stages";
import { Scenario } from "../scenario";

/**
 * Z's availability is intermittent
 * 
 * TODO: Consider 0 availability.
 * 
 * @param model 
 * @returns 
 */
export function varyAvailability(model: Model<{ z: Z }>): Scenario {
  simulation.eventsPer1000Ticks = 400 / TICK_DILATION
  simulation.keyspaceMean = 10000;
  simulation.keyspaceStd = 500;


  // sine wave between 0 and 1
  metronome.setInterval(() => {
    const availability = 0.5 + 0.5 * Math.sin(0.0005 * metronome.now() / TICK_DILATION);
    model.stages.z.availability = availability;
  }, 10)

  // step function
  /*
  metronome.setTimeout(() => model.stages.z.availability = 1, 1);
  metronome.setTimeout(() => model.stages.z.availability = 0.60, 10000 * TICK_DILATION);
  metronome.setTimeout(() => model.stages.z.availability = 0.85, 30000 * TICK_DILATION);
  metronome.setTimeout(() => model.stages.z.availability = 0.70, 50000 * TICK_DILATION);
  metronome.setTimeout(() => model.stages.z.availability = 0.95, 65000 * TICK_DILATION);
  metronome.setTimeout(() => model.stages.z.availability = 0.25, 70000 * TICK_DILATION);
  */

  return {
    name: "VaryAvailability"
  }
}