import { Event, FIFOQueue, metronome, simulation } from "@byu-se/quartermaster";
import { TICK_DILATION } from "../";
import { ModelCreationFunction } from "../models";
import { X, Y, Z } from "../stages";
import { Scenario, ScenarioFunction } from "./scenario";

/**
 * Load from X varies, at times beyond Z's capacity
 * 
 * @param model 
 * @returns 
 */
export const varyLoad: ScenarioFunction = (modelCreator: ModelCreationFunction<any>): Scenario => {
  simulation.keyspaceMean = 10000;
  simulation.keyspaceStd = 500;

  const z = new Z();
  const model = modelCreator(z);
  const y = new Y(model.entry);
  const x = new X(y);

  // the load Z is provisioned to handle
  z.inQueue = new FIFOQueue(1, 28);

  // sine wave
  metronome.setInterval(() => {
    const rate = (800 + 500 * Math.sin(0.0005 * metronome.now() / TICK_DILATION))
    simulation.eventsPer1000Ticks = rate / TICK_DILATION
  }, 10);

  // priority, which can be used by some models only
  x.beforeHook = (event: Event) => {
    const key = parseInt(event.key.slice(2));
    (<Event & { priority: number }>event).priority = key % 3;
  }

  return {
    name: "VaryLoad",
    model,
    entry: x
  }
}