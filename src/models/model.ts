import { Stage } from "@byu-se/quartermaster";

export type StageCollection = Record<string, Stage>;

export type Model<T extends StageCollection> = {
  id: string,
  name: string,
  entry: Stage;
  stages: T;
}