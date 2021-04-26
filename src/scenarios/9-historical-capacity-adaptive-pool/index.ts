import { metronome, simulation } from "@byu-se/quartermaster";
import { Model } from "../../models";
import { Z } from "../../stages";
import { Scenario, createCapacityAdaptivePoolScenario } from "..";

/**
 * Z's capacity varies
 * 
 * @param model 
 * @returns 
 */
export function createHistoricalCapacityAdaptivePoolScenario(model: Model<{ z: Z }>): Scenario {
  createCapacityAdaptivePoolScenario(model);
  return {
    name: "HistoricalCapacityAdaptivePool"
  }
}