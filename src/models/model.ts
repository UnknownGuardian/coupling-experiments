import { Stage } from "@byu-se/quartermaster";
import { Z } from "../stages";

export type StageCollection = Record<string, Stage>;

export type Model<T extends StageCollection> = {
  id: string,
  name: string,
  entry: Stage;
  stages: T;
}

export type ModelCreationFunction<Model> = (z: Z) => Model;