import { Event, metronome, simulation } from "@byu-se/quartermaster";
import { Model } from "../../models";
import { X } from "../../stages";
import { Scenario } from "..";
import { TICK_DILATION } from "../..";

/**
 * Z's capacity varies
 * 
 * @param model 
 * @returns 
 */
export function createSmartLoadSheddingScenario(model: Model<{ x: X }>): Scenario {
  simulation.eventsPer1000Ticks = 200 / TICK_DILATION
  simulation.keyspaceMean = 10000;
  simulation.keyspaceStd = 500;

  // sine wave
  metronome.setTimeout(() => simulation.eventsPer1000Ticks = 400 / TICK_DILATION, 15000 * TICK_DILATION);
  metronome.setTimeout(() => simulation.eventsPer1000Ticks = 800 / TICK_DILATION, 30000 * TICK_DILATION);
  metronome.setTimeout(() => simulation.eventsPer1000Ticks = 1200 / TICK_DILATION, 45000 * TICK_DILATION);
  metronome.setTimeout(() => simulation.eventsPer1000Ticks = 1600 / TICK_DILATION, 60000 * TICK_DILATION);

  model.stages.x.beforeHook = (event: Event) => {
    const key = parseInt(event.key.slice(2));
    (<Event & { priority: number }>event).priority = key % 10;
  }

  return {
    name: "SmartLoadShedding"
  }
}