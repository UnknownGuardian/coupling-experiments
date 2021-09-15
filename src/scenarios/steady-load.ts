import { Event, FIFOServiceQueue, metronome, simulation } from "@byu-se/quartermaster";
import { TICK_DILATION } from "..";
import { ModelCreationFunction } from "../models";
import { X, Y, Z } from "../stages";
import { Scenario, ScenarioFunction } from "./scenario";

/**
 * Load from X varies, at times beyond Z's capacity
 * 
 * @param model 
 * @returns 
 */
export const steadyLoad: ScenarioFunction = (modelCreator: ModelCreationFunction<any>): Scenario => {
  simulation.keyspaceMean = 10000;
  simulation.keyspaceStd = 500;

  const z = new Z();
  const model = modelCreator(z);
  const y = new Y(model.entry);
  const x = new X(y);

  // the load Z is provisioned to handle
  z.inQueue = new FIFOServiceQueue(0, 28);

  // steady
  simulation.eventsPer1000Ticks = 750 / TICK_DILATION;
  metronome.setTimeout(() => {
    simulation.eventsPer1000Ticks = 1500 / TICK_DILATION;
  }, 1000 * TICK_DILATION)

  // priority, which can be used by some models only
  x.beforeHook = (event: Event) => {
    const key = parseInt(event.key.slice(2));
    (<Event & { priority: number }>event).priority = key % 3;
  }

  return {
    name: "SteadyLoad",
    model,
    entry: x
  }
}