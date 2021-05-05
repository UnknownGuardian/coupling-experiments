import { Event, metronome, simulation, Timeout } from "@byu-se/quartermaster";
import { TICK_DILATION } from "..";
import { Model, ModelCreationFunction } from "../models";
import { X, Y, Z } from "../stages";
import { Scenario, ScenarioFunction } from "./scenario";

/**
 * Z's availability is intermittent
 * 
 * @param model 
 * @returns 
 */
export const varyAvailability: ScenarioFunction = (modelCreator: ModelCreationFunction<any>): Scenario => {
  simulation.eventsPer1000Ticks = 400 / TICK_DILATION
  simulation.keyspaceMean = 10000;
  simulation.keyspaceStd = 500;


  const z = new Z();
  const model = modelCreator(z);
  const y = new Y(model.entry);
  const x = new X(y);

  /*// enforces timeout between X and Y
  const timeout = new Timeout(model.stages.y);
  timeout.timeout = 60 * TICK_DILATION + 10
  x.wrapped = timeout*/


  const period = 2 * Math.PI / 40_000; // 40 seconds
  const amplitude = 0.5;
  const average = 0.5;
  // sine wave between 0 and 1
  metronome.setInterval(() => {
    const availability = average + amplitude * Math.sin(metronome.now() * period / TICK_DILATION);
    z.availability = availability;
  }, 10)

  // additional properties that some models can take advantage of
  // inject event priority
  x.beforeHook = (event: Event) => {
    const key = parseInt(event.key.slice(2));
    (<Event & { priority: number }>event).priority = key % 3;
  }


  return {
    name: "VaryAvailability",
    model,
    entry: x
  }
}