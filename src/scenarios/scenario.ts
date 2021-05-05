import { Stage } from "@byu-se/quartermaster";
import { Model, ModelCreationFunction } from "../models";

export type Scenario = {
  name: string;
  entry: Stage;
  model: Model<any>
}

export type ScenarioFunction = (creator: ModelCreationFunction<any>) => Scenario;