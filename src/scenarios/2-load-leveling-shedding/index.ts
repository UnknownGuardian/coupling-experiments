import { FIFOQueue, metronome, simulation } from "@byu-se/quartermaster";
import { TICK_DILATION } from "../..";
import { Model } from "../../models";
import { DependencyQueue, Y, Z } from "../../stages";
import { Scenario } from "../scenario";

/**
 * Load from X varies, at times beyond Z's capacity, use a bounded queue.
 * 
 * Notes: meanQueueWaitTime and queueSize should be going up? Are we
 *        measuring the wrong queues here?
 * @param model 
 * @returns 
 */
export function createLoadLevelingSheddingScenario(model: Model<{ y: Y, dependencyQueue: DependencyQueue, z: Z }>): Scenario {
  // flat rate
  //simulation.eventsPer1000Ticks = 1000 / TICK_DILATION

  // sine wave
  metronome.setInterval(() => {
    const rate = (800 + 500 * Math.sin(0.0005 * metronome.now() / TICK_DILATION))
    simulation.eventsPer1000Ticks = rate / TICK_DILATION
  }, 10);

  model.stages.y.inQueue = new FIFOQueue(1000, 28);  // the load Y is provisioned to handle
  model.stages.dependencyQueue.inQueue = new FIFOQueue(1000, 28);  // the load to send to Z
  model.stages.z.inQueue = new FIFOQueue(Infinity, 28);  // the load Z is provisioned to handle

  return {
    name: "LoadLevelingShedding"
  }
}