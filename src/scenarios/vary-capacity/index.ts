import { FIFOQueue, metronome, NoQueue, simulation } from "@byu-se/quartermaster";
import { TICK_DILATION } from "../..";
import { Model } from "../../models";
import { Z } from "../../stages";
import { Scenario } from "../scenario";

/**
 * Z's capacity varies
 * 
 * @param model 
 * @returns 
 */
export function varyCapacity(model: Model<{ z: Z }>): Scenario {
  simulation.eventsPer1000Ticks = 800 / TICK_DILATION
  simulation.keyspaceMean = 10000;
  simulation.keyspaceStd = 500;

  // we need to give it a capacity, to do so, it must get a FIFOQueue if its a noqueue
  if (model.stages.z.inQueue instanceof NoQueue) {
    model.stages.z.inQueue = new FIFOQueue(1, 28);
  }

  // sine wave
  metronome.setInterval(() => {
    const numWorkers = Math.floor(25 + 15 * Math.sin(0.0005 * metronome.now() / TICK_DILATION));
    model.stages.z.inQueue.setNumWorkers(numWorkers)
  }, 10)

  // step function
  /*
  metronome.setTimeout(() => model.stages.z.inQueue.setNumWorkers(30), 1);
  metronome.setTimeout(() => model.stages.z.inQueue.setNumWorkers(10), 5000 * TICK_DILATION);
  metronome.setTimeout(() => model.stages.z.inQueue.setNumWorkers(35), 15000 * TICK_DILATION);
  metronome.setTimeout(() => model.stages.z.inQueue.setNumWorkers(15), 30000 * TICK_DILATION);
  metronome.setTimeout(() => model.stages.z.inQueue.setNumWorkers(40), 40000 * TICK_DILATION);
  */

  return {
    name: "VaryCapacity"
  }
}