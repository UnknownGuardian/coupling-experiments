import { Stage } from "@byu-se/quartermaster";

export type StageCollection = Record<string, Stage>;

export type Model<T extends StageCollection> = {
  name: string,
  entry: Stage;
  stages: T;
}