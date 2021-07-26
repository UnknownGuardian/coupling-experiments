import { unparse, parse } from "papaparse"
import { readdirSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from "fs";
import { join } from "path";
import { Event, FIFOQueue, metronome, simulation, stats } from "@byu-se/quartermaster";
import { PerRequestTimeout, X, Y, Z } from "../stages";
import {
  createNaiveModel,
  createLoadLevelingModel,
  createLoadSheddingModel,
  createMultilevelLoadSheddingModel,
  createRequestCachingModel,
  createAsyncCacheLoadingModel,
  createPerRequestTimeoutModel,
  createRetriesModel,
  createInferredPoolSizingModel,
  createCooperativePoolSizingModel,
  createAsyncRetriesModel,
  createInfiniteRetriesModel,
  ModelCreationFunction,
  Model
} from "../models";
import {
  Scenario,
  varyLoad,
  varyAvailability,
  varyCapacity,
  ScenarioFunction
} from "../scenarios";
import { TICK_DILATION } from "..";

// Read the inputs needed to run the simulations
const outputDirectory = join(__dirname, "..", "..", "out", "sensitivity");

// Consisting of 1) The simulation JSON 
const simulationPath = join(outputDirectory, "simulation.json");
const simulationData = require(simulationPath);

// and 2) The inputs to each simulation
const paramPath = join(outputDirectory, "param_values.txt");
const paramFile = readFileSync(paramPath, 'utf-8')
const paramCSV: number[][] = parse(paramFile, { delimiter: " ", dynamicTyping: true }).data as number[][];

// Prepare a new directory for a copy of the inputs and all the outputs to be dumped
const timeseriesDir = join(outputDirectory, `results-${+new Date()}`)
mkdirSync(timeseriesDir);
copyFileSync(paramPath, join(timeseriesDir, "param_values.txt"))
copyFileSync(simulationPath, join(timeseriesDir, "simulation.json"))


run();
async function run(): Promise<void> {
  const models = simulationData.models;
  for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
    const model = models[modelIndex];

    const outputDir = join(timeseriesDir, model);
    mkdirSync(outputDir);

    const scenarioInjector = getInjectorFromScenarioName(simulationData.scenario);
    const createModel = getModelFromModelName(model);

    // loop to data.length - 1 since last row is empty
    for (let i = 0; i < paramCSV.length - 1; i++) {
      const params = paramCSV[i];
      console.log(`Model ${modelIndex + 1}/${models.length} Simulation: ${i + 1}/${paramCSV.length}`, params)

      const createScenario = scenarioInjector(params);
      await runInstance(createModel, createScenario, outputDir, i);
    }
  }

}

async function runInstance(createModel: ModelCreationFunction<any>, createScenario: ScenarioFunction, outputDir: string, id: number): Promise<void> {
  // reset the environment
  simulation.reset();
  metronome.resetCurrentTime();
  stats.reset();

  // create the model of the system and the scenario
  const scenario = createScenario(createModel);

  const modelId = scenario.model.id;
  const modelName = scenario.model.name;
  const name = `${modelId}-${id}-${scenario.name}`

  // run the simulation
  await simulation.run(scenario.entry, 10000);
  console.log(`Experiment ${name} finished. Metronome stopped at`, metronome.now());

  // record the time series results
  const rows = getSlimRows();
  writeFileSync(join(outputDir, `${name}.csv`), unparse(rows));
}

// just a subset of the timeseries data we might be interested in
export type SlimRow = {
  tick: number
  //loadFromSimulation: number, // C
  loadFromX: number, // C
  loadFromY: number, // C
  meanLatencyFromY: number, // R
  meanLatencyFromZ: number, // R
  meanAvailabilityFromY: number, // R
  meanAvailabilityFromZ: number, // R
  zCapacity: number, // V
  poolSize: number, // V
  poolUsage: number, // -1
  meanQueueWaitTime: number, // R
  queueSize: number, // R
  enqueueCount: number, // C
  queueRejectCount: number, // C
  meanTriesPerRequest: number,
}

/**
 * Read the metrics we are interested in from the simulation
 * @returns Rows, corresponding to time slices, of metrics
 */
function getSlimRows(): SlimRow[] {
  const tick: number[] = stats.getRecorded("tick");
  const loadFromX: number[] = stats.getRecorded("loadFromX");
  const loadFromY: number[] = stats.getRecorded("loadFromY");
  const meanLatencyFromY: number[] = stats.getRecorded("meanLatencyFromY");
  const meanLatencyFromZ: number[] = stats.getRecorded("meanLatencyFromZ");
  const meanAvailabilityFromY: number[] = stats.getRecorded("meanAvailabilityFromY");
  const meanAvailabilityFromZ: number[] = stats.getRecorded("meanAvailabilityFromZ");
  const zCapacity: number[] = stats.getRecorded("zCapacity");
  const poolSize: number[] = stats.getRecorded("poolSize");
  const poolUsage: number[] = stats.getRecorded("poolUsage");
  const meanQueueWaitTime: number[] = stats.getRecorded("meanQueueWaitTime");
  const queueSize: number[] = stats.getRecorded("queueSize");
  const enqueueCount: number[] = stats.getRecorded("enqueueCount");
  const queueRejectCount: number[] = stats.getRecorded("queueRejectCount");
  const meanTriesPerRequest: number[] = stats.getRecorded("meanTriesPerRequest");
  return tick.map<SlimRow>((_, index) => {
    return {
      tick: tick[index],
      loadFromX: loadFromX[index],
      loadFromY: loadFromY[index],
      meanLatencyFromY: meanLatencyFromY[index],
      meanLatencyFromZ: meanLatencyFromZ[index],
      meanAvailabilityFromY: meanAvailabilityFromY[index],
      meanAvailabilityFromZ: meanAvailabilityFromZ[index],
      zCapacity: zCapacity[index],
      poolSize: poolSize[index],
      poolUsage: poolUsage[index],
      meanQueueWaitTime: meanQueueWaitTime[index],
      queueSize: queueSize[index],
      enqueueCount: enqueueCount[index],
      queueRejectCount: queueRejectCount[index],
      meanTriesPerRequest: meanTriesPerRequest[index],
    }
  })
}


function getInjectorFromScenarioName(scenarioName: String): (params: number[]) => ScenarioFunction {
  if (scenarioName == "latency")
    return latencyScenarioParamInjector;
  throw `No Injector available for ${scenarioName}`
}
function getModelFromModelName(modelName: String): ModelCreationFunction<any> {
  if (modelName == "A")
    return createNaiveModel;
  throw `No Model available for ${modelName}`
}


function latencyScenarioParamInjector(params: number[]): ScenarioFunction {
  return (modelCreator: ModelCreationFunction<Model<any>>): Scenario => {
    simulation.keyspaceMean = 10000;
    simulation.keyspaceStd = 500;

    const z = new Z();
    const model = modelCreator(z);
    const y = new Y(model.entry);
    const timeout = new PerRequestTimeout(y);
    const x = new X(timeout);

    // enforces timeout between X and Y
    timeout.timeout = 60 * TICK_DILATION + 10

    //  add extra properties for models that can take advantage of it
    x.beforeHook = (event: Event) => {
      const e = event as Event & { readAtTime: number; readAtTimeName: string; timeout: number }
      const key = parseInt(event.key.slice(2));
      e.readAtTime = [55, 60, 65][key % 3] * TICK_DILATION;
      e.readAtTimeName = ["fast", "medium", "slow"][key % 3];
      e.timeout = e.readAtTime + 10
    }

    /*    PARAM changes   */
    // PARAM load
    simulation.eventsPer1000Ticks = params[0] / TICK_DILATION
    // PARAM z's capacity
    z.inQueue = new FIFOQueue(1, params[1]);
    // PARAM z's latency
    z.mean = params[2]
    // PARAM z's availability
    z.availability = params[3]
    //PARAM z's new latency
    metronome.setTimeout(() => z.mean = params[4], 2000 * TICK_DILATION)

    return {
      name: "SteadyLatency",
      model,
      entry: x
    }
  }
}
