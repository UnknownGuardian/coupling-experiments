import { metronome, simulation, Timeout } from "@byu-se/quartermaster";
import { TICK_DILATION } from "../..";
import { Model } from "../../models";
import { X, Y, Z } from "../../stages";
import { Scenario } from "../scenario";

/**
 * Z's availability is intermittent
 * 
 * @param model 
 * @returns 
 */
export function varyAvailability(model: Model<{ x: X, y: Y, z: Z }>): Scenario {
  simulation.eventsPer1000Ticks = 400 / TICK_DILATION
  simulation.keyspaceMean = 10000;
  simulation.keyspaceStd = 500;

  // enforces timeout between X and Y
  const timeout = new Timeout(model.stages.y);
  timeout.timeout = 60 * TICK_DILATION + 10
  model.stages.x.wrapped = timeout


  const period = 2 * Math.PI / 40_000; // 40 seconds
  const amplitude = 0.5;
  const average = 0.5;
  // sine wave between 0 and 1
  metronome.setInterval(() => {
    const availability = average + amplitude * Math.sin(metronome.now() * period / TICK_DILATION);
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