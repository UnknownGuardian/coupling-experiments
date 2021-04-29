import { metronome, simulation } from "@byu-se/quartermaster";
import { TICK_DILATION } from "../..";
import { Model } from "../../models";
import { Z } from "../../stages";
import { Scenario } from "../scenario";

/**
 * Z's latencies increases
 * 
 * @param model 
 * @returns 
 */
export function varyLatency(model: Model<{ z: Z }>): Scenario {
  simulation.eventsPer1000Ticks = 400 / TICK_DILATION
  simulation.keyspaceMean = 10000;
  simulation.keyspaceStd = 500;


  // sine wave
  metronome.setInterval(() => {
    const mean = 50 + 25 * Math.sin(0.0005 * metronome.now() / TICK_DILATION);
    model.stages.z.mean = mean;
  }, 10)

  // linear function
  /*
  metronome.setInterval(() => {
    model.stages.z.mean = 15 + (metronome.now() * 0.0005 / TICK_DILATION);
  }, 10)
  */

  // step function
  /*
  metronome.setTimeout(() => model.stages.z.mean = 15, 1);
  metronome.setTimeout(() => model.stages.z.mean = 25, 15000 * TICK_DILATION);
  metronome.setTimeout(() => model.stages.z.mean = 30, 30000 * TICK_DILATION);
  metronome.setTimeout(() => model.stages.z.mean = 35, 45000 * TICK_DILATION);
  metronome.setTimeout(() => model.stages.z.mean = 45, 60000 * TICK_DILATION);
  */

  return {
    name: "VaryLatency"
  }
}