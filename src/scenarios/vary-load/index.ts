import { FIFOQueue, metronome, simulation } from "@byu-se/quartermaster";
import { TICK_DILATION } from "../..";
import { Model } from "../../models";
import { Z } from "../../stages";
import { Scenario } from "../scenario";

/**
 * Load from X varies, at times beyond Z's capacity
 * 
 * @param model 
 * @returns 
 */
export function varyLoad(model: Model<{ z: Z }>): Scenario {
  simulation.keyspaceMean = 10000;
  simulation.keyspaceStd = 500;

  model.stages.z.inQueue = new FIFOQueue(1, 28);  // the load Z is provisioned to handle

  // sine wave
  metronome.setInterval(() => {
    const rate = (800 + 500 * Math.sin(0.0005 * metronome.now() / TICK_DILATION))
    simulation.eventsPer1000Ticks = rate / TICK_DILATION
  }, 10);
  return {
    name: "VaryLoad"
  }
}