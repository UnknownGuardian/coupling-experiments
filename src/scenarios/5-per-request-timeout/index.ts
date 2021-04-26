import { Model } from "../../models";
import { AgeLRUCache, Z } from "../../stages";
import { Scenario, createImpatientClientScenario } from "../";

/**
 * Z's latency varies (incrementally getting worse and worse to some extreme)
 * Same as 4-x
 * 
 * TODO: We don't vary each per request timeout
 * 
 * @param model 
 * @returns 
 */
export function createPerRequestTimeoutScenario(model: Model<{ cache: AgeLRUCache, z: Z }>): Scenario {
  return createImpatientClientScenario(model);
}