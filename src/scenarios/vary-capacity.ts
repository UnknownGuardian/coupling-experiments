import { FIFOServiceQueue, metronome, simulation } from "@byu-se/quartermaster";
import { TICK_DILATION } from "..";
import { Model, ModelCreationFunction } from "../models";
import { X, Y, Z } from "../stages";
import { Scenario, ScenarioFunction } from "./scenario";

/**
 * Z's capacity varies
 * 
 * @param model 
 * @returns 
 */
export const varyCapacity: ScenarioFunction = (modelCreator: ModelCreationFunction<any>): Scenario => {
  simulation.eventsPer1000Ticks = 800 / TICK_DILATION
  simulation.keyspaceMean = 10000;
  simulation.keyspaceStd = 500;

  const z = new Z();
  const model = modelCreator(z);
  const y = new Y(model.entry);
  const x = new X(y);

  // z's capacity
  z.inQueue = new FIFOServiceQueue(0, 28);

  // sine wave
  metronome.setInterval(() => {
    const numWorkers = Math.floor(25 + 15 * Math.sin(0.0005 * metronome.now() / TICK_DILATION));
    z.inQueue.setNumWorkers(numWorkers)
  }, 10)


  return {
    name: "VaryCapacity",
    model,
    entry: x
  }
}