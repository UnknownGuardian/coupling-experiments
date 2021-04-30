import { metronome, simulation, Timeout } from "@byu-se/quartermaster";
import { TICK_DILATION } from "../..";
import { Model } from "../../models";
import { PerRequestTimeout, X, Y, Z } from "../../stages";
import { Scenario } from "../scenario";

/**
 * Z's latencies increases
 * 
 * @param model 
 * @returns 
 */
export function varyLatency(model: Model<{ x: X, y: Y, z: Z }>): Scenario {
  simulation.eventsPer1000Ticks = 400 / TICK_DILATION
  simulation.keyspaceMean = 10000;
  simulation.keyspaceStd = 500;

  // enforces timeout between X and Y
  const timeout = new PerRequestTimeout(model.stages.y);
  timeout.timeout = 60 * TICK_DILATION + 10
  model.stages.x.wrapped = timeout


  const period = 2 * Math.PI / 40_000; // 40 seconds
  const amplitude = 30;
  const average = 60;
  // sine wave
  metronome.setInterval(() => {
    const mean = average + amplitude * Math.sin(metronome.now() * period / TICK_DILATION);
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