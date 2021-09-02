import { join } from "path";
import { getModelFromModelName, getInjectorFromScenarioName, runInstance } from ".";


export async function runJob(outputDir: string, scenario: string, model: string, work: { id: number, inputs: number[] }[]): Promise<void> {
  const scenarioInjector = getInjectorFromScenarioName(scenario);
  const createModel = getModelFromModelName(model);

  const modelSimDir = join(outputDir, model, "sim");

  for (let i = 0; i < work.length; i++) {
    const id = work[i].id;
    const params = work[i].inputs;

    console.log(`Simulation: ${i + 1}/${work.length}`, params)


    const createScenario = scenarioInjector(params);
    await runInstance(createModel, createScenario, modelSimDir, id);

  }
}
