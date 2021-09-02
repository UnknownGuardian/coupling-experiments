import { unparse, parse } from "papaparse"
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "fs";
import { join } from "path";
import { Event, FIFOQueue, FIFOServiceQueue, MathFunctions, metronome, simulation, stats } from "@byu-se/quartermaster";
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
import { Scenario, ScenarioFunction } from "../scenarios";
import { SAMPLE_DURATION, TICK_DILATION } from "..";
import { SeededMath } from "../util";








const jStat = require("jstat");

// Read the inputs needed to run the simulations
const outputDirectory = join(__dirname, "..", "..", "out", "sensitivity");

// Consisting of 1) The simulation JSON 
const simulationPath = join(outputDirectory, "simulation.json");
const simulationData = require(simulationPath);
const scenarioName = simulationData.scenario;

// and 2) The inputs to each simulation
const paramPath = join(outputDirectory, "param_values.txt");
const paramFile = readFileSync(paramPath, 'utf-8')
const paramCSV: number[][] = parse(paramFile, { delimiter: " ", dynamicTyping: true }).data as number[][];

// Prepare a new directory for a copy of the inputs and all the outputs to be dumped
const timeseriesDir = join(outputDirectory, `results-${scenarioName}-${+new Date()}`)
mkdirSync(timeseriesDir);
copyFileSync(paramPath, join(timeseriesDir, "param_values.txt"))
copyFileSync(simulationPath, join(timeseriesDir, "simulation.json"))


run();
async function run(): Promise<void> {
  const models = simulationData.models;
  for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
    const model = models[modelIndex];

    const modelDir = join(timeseriesDir, model)
    mkdirSync(modelDir);
    const outputDir = join(timeseriesDir, model, "sim");
    mkdirSync(outputDir);

    const scenarioInjector = getInjectorFromScenarioName(simulationData.scenario);
    const createModel = getModelFromModelName(model);

    // loop to data.length - 1 since last row is empty
    for (let i = 0; i < paramCSV.length - 1; i++) {
      const params = paramCSV[i];
      console.log(`Model ${model} (${modelIndex + 1}/${models.length}) Simulation: ${i + 1}/${paramCSV.length}`, params)

      const createScenario = scenarioInjector(params);
      await runInstance(createModel, createScenario, outputDir, i).catch(e => console.log('xxxxxxxxxx'));
    }
  }

}


async function runInstance(createModel: ModelCreationFunction<any>, createScenario: ScenarioFunction, outputDir: string, id: number): Promise<void> {
  // reset the environment
  simulation.reset();
  metronome.resetCurrentTime();
  stats.reset();
  SeededMath.reseed();
  MathFunctions.random = SeededMath.random

  // create the model of the system and the scenario
  const scenario = createScenario(createModel);

  const modelId = scenario.model.id;
  const modelName = scenario.model.name;
  const name = `${modelId}-${id}-${scenario.name}`

  // run the simulation
  await simulation.run(scenario.entry, 20_000).catch(e => console.log('Caught simulation.run abort', e));
  console.log(`Experiment ${name} finished. Metronome stopped at`, metronome.now());
  if (metronome.now() < 145000) {
    console.log(`\t\t\t\t\tSHORT ${name}`)
  }

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

  meanResponseP1Availability: number, // R
  meanResponseP2Availability: number, // R
  meanResponseP3Availability: number, // R
  meanResponseP1Latency: number, // R
  meanResponseP2Latency: number, // R
  meanResponseP3Latency: number, // R
  meanResponseGFastLatency: number, // R
  meanResponseGMediumLatency: number, // R
  meanResponseGSlowLatency: number, // R
  meanResponseGFastAvailability: number, // R
  meanResponseGMediumAvailability: number, // R
  meanResponseGSlowAvailability: number // R
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

  const events: Event[][] = stats.getRecorded("events");

  const mean = jStat.mean;

  return tick.map<SlimRow>((_, index) => {
    const subsetEvents = optionalArray<Event>(events, index, []);

    const priority1 = subsetEvents.filter(e => (e as any).priority == 0);
    const priority2 = subsetEvents.filter(e => (e as any).priority == 1);
    const priority3 = subsetEvents.filter(e => (e as any).priority == 2);
    const meanResponseP1Availability: number = mean(priority1.map(e => e.response === "success" ? 1 : 0));
    const meanResponseP2Availability: number = mean(priority2.map(e => e.response === "success" ? 1 : 0));
    const meanResponseP3Availability: number = mean(priority3.map(e => e.response === "success" ? 1 : 0));
    const meanResponseP1Latency: number = mean(priority1.map(e => e.responseTime.endTime - e.responseTime.startTime));
    const meanResponseP2Latency: number = mean(priority2.map(e => e.responseTime.endTime - e.responseTime.startTime));
    const meanResponseP3Latency: number = mean(priority3.map(e => e.responseTime.endTime - e.responseTime.startTime));

    const gFast = subsetEvents.filter(e => (e as any).readAtTimeName == "fast");
    const gMedium = subsetEvents.filter(e => (e as any).readAtTimeName == "medium");
    const gSlow = subsetEvents.filter(e => (e as any).readAtTimeName == "slow");


    const meanResponseGFastLatency: number = mean(gFast.map(e => e.responseTime.endTime - e.responseTime.startTime));
    const meanResponseGMediumLatency: number = mean(gMedium.map(e => e.responseTime.endTime - e.responseTime.startTime));
    const meanResponseGSlowLatency: number = mean(gSlow.map(e => e.responseTime.endTime - e.responseTime.startTime));
    const meanResponseGFastAvailability: number = mean(gFast.map(e => e.response === "success" ? 1 : 0));
    const meanResponseGMediumAvailability: number = mean(gMedium.map(e => e.response === "success" ? 1 : 0));
    const meanResponseGSlowAvailability: number = mean(gSlow.map(e => e.response === "success" ? 1 : 0));

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
      meanResponseP1Availability,
      meanResponseP2Availability,
      meanResponseP3Availability,
      meanResponseP1Latency,
      meanResponseP2Latency,
      meanResponseP3Latency,
      meanResponseGFastLatency,
      meanResponseGMediumLatency,
      meanResponseGSlowLatency,
      meanResponseGFastAvailability,
      meanResponseGMediumAvailability,
      meanResponseGSlowAvailability
    }
  })
}

function optionalArray<T>(array: T[][], index: number, defaultValue: T[]): T[] {
  if (!array || array.length <= index)
    return defaultValue;
  return array[index];
}



function getModelFromModelName(modelName: String): ModelCreationFunction<any> {
  if (modelName == "A")
    return createNaiveModel;
  if (modelName == "B")
    return createLoadLevelingModel;
  if (modelName == "C")
    return createLoadSheddingModel;
  if (modelName == "D")
    return createMultilevelLoadSheddingModel;
  if (modelName == "E")
    return createRequestCachingModel;
  if (modelName == "F")
    return createAsyncCacheLoadingModel;
  if (modelName == "G")
    return createPerRequestTimeoutModel;
  if (modelName == "H")
    return createRetriesModel;
  if (modelName == "I")
    return createAsyncRetriesModel;
  if (modelName == "J")
    return createInfiniteRetriesModel;
  if (modelName == "K")
    return createCooperativePoolSizingModel;
  if (modelName == "L")
    return createInferredPoolSizingModel;
  throw `No Model available for ${modelName}`
}

function getInjectorFromScenarioName(scenarioName: String): (params: number[]) => ScenarioFunction {
  if (scenarioName == "latency")
    return latencyScenarioParamInjector;
  if (scenarioName == "latency2")
    return latency2ScenarioParamInjector;
  if (scenarioName == "latency2earlyexit")
    return latency2EarlyExitScenarioParamInjector;
  //if (scenarioName == "load")
  //  return loadScenarioParamInjector;
  if (scenarioName == "load2")
    return load2ScenarioParamInjector;
  if (scenarioName == "availability")
    return availabilityScenarioParamInjector;
  if (scenarioName == "availability2")
    return availability2ScenarioParamInjector;
  //if (scenarioName == "capacity")
  //  return capacityScenarioParamInjector;
  throw `No Injector available for ${scenarioName}`
}

function latency2EarlyExitScenarioParamInjector(params: number[]): ScenarioFunction {
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
      // keys are not determinisitic, so instead we random sample
      //const key = Math.floor(SeededMath.random() * 999999);
      e.readAtTime = [55, 60, 65][key % 3] * TICK_DILATION;
      e.readAtTimeName = ["fast", "medium", "slow"][key % 3];
      e.timeout = e.readAtTime + 10
    }

    /*    PARAM changes   */
    // PARAM load
    simulation.eventsPer1000Ticks = params[0] / TICK_DILATION
    // PARAM z's capacity
    z.inQueue = new FIFOServiceQueue(0, 500);
    // PARAM z's latency
    z.mean = Math.floor(params[1])
    // PARAM z's availability
    z.availability = params[2]
    //PARAM z's new latency
    metronome.setTimeout(() => z.mean = Math.floor(params[3]), 8000 * TICK_DILATION) // index 4 = 2000 * TICK_DILATION

    //simulation.debug = true;
    metronome.setTimeout(async () => {
      console.log("Early abort, trying to stop metronome")
      await metronome.stop(true);
      console.log("metronome stopped")
    }, SAMPLE_DURATION * 35)

    return {
      name: "SteadyLatency",
      model,
      entry: x
    }
  }
}

function latency2ScenarioParamInjector(params: number[]): ScenarioFunction {
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
      // keys are not determinisitic, so instead we random sample
      //const key = Math.floor(SeededMath.random() * 999999);
      e.readAtTime = [55, 60, 65][key % 3] * TICK_DILATION;
      e.readAtTimeName = ["fast", "medium", "slow"][key % 3];
      e.timeout = e.readAtTime + 10;
    }

    /*    PARAM changes   */
    // PARAM load
    simulation.eventsPer1000Ticks = params[0] / TICK_DILATION
    // PARAM z's capacity
    z.inQueue = new FIFOServiceQueue(0, 500);
    // PARAM z's latency
    z.mean = Math.floor(params[1])
    // PARAM z's availability
    z.availability = params[2]
    //PARAM z's new latency
    metronome.setTimeout(() => z.mean = Math.floor(params[3]), 8000 * TICK_DILATION) // index 4 = 2000 * TICK_DILATION
    metronome.setInterval(() => {
      //console.log((z.inQueue as FIFOServiceQueue).length())
      //console.log(stats.get("poolSize"), stats.get("meanQueueWaitTime"), stats.get("queueRejectCount"))
    }, 5000 * TICK_DILATION) // index 4 = 2000 * TICK_DILATION

    return {
      name: "SteadyLatency",
      model,
      entry: x
    }
  }
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
    z.inQueue = new FIFOQueue(1, Math.floor(params[1]));
    // PARAM z's latency
    z.mean = Math.floor(params[2])
    // PARAM z's availability
    z.availability = params[3]
    //PARAM z's new latency
    metronome.setTimeout(() => z.mean = Math.floor(params[4]), 8000 * TICK_DILATION) // index 4 = 2000 * TICK_DILATION

    return {
      name: "SteadyLatency",
      model,
      entry: x
    }
  }
}

// just like the load scenario, except fixed capacity
function load2ScenarioParamInjector(params: number[]): ScenarioFunction {
  return (modelCreator: ModelCreationFunction<Model<any>>): Scenario => {
    simulation.keyspaceMean = 10000;
    simulation.keyspaceStd = 500;

    const z = new Z();
    const model = modelCreator(z);
    const y = new Y(model.entry);
    const x = new X(y);

    //  add extra properties for models that can take advantage of it
    x.beforeHook = (event: Event) => {
      const key = parseInt(event.key.slice(2));
      (<Event & { priority: number }>event).priority = key % 3;
    }

    /*    PARAM changes   */
    // PARAM load
    simulation.eventsPer1000Ticks = params[0] / TICK_DILATION
    // PARAM z's capacity
    z.inQueue = new FIFOQueue(1, 500); // 28 in the original model
    // PARAM z's latency
    z.mean = Math.floor(params[1])
    // PARAM z's availability
    z.availability = params[2]
    //PARAM x's new Load
    metronome.setTimeout(() => simulation.eventsPer1000Ticks = params[3] / TICK_DILATION, 8000 * TICK_DILATION) // index 4 = 2000 * TICK_DILATION

    return {
      name: "SteadyLoad",
      model,
      entry: x
    }
  }
}

function loadScenarioParamInjector(params: number[]): ScenarioFunction {
  return (modelCreator: ModelCreationFunction<Model<any>>): Scenario => {
    simulation.keyspaceMean = 10000;
    simulation.keyspaceStd = 500;

    const z = new Z();
    const model = modelCreator(z);
    const y = new Y(model.entry);
    const x = new X(y);

    //  add extra properties for models that can take advantage of it
    x.beforeHook = (event: Event) => {
      const key = parseInt(event.key.slice(2));
      (<Event & { priority: number }>event).priority = key % 3;
    }

    /*    PARAM changes   */
    // PARAM load
    simulation.eventsPer1000Ticks = params[0] / TICK_DILATION
    // PARAM z's capacity
    z.inQueue = new FIFOQueue(1, Math.floor(params[1]));
    // PARAM z's latency
    z.mean = Math.floor(params[2])
    // PARAM z's availability
    z.availability = params[3]
    //PARAM x's new Load
    metronome.setTimeout(() => simulation.eventsPer1000Ticks = params[4] / TICK_DILATION, 8000 * TICK_DILATION) // index 4 = 2000 * TICK_DILATION

    return {
      name: "SteadyLoad",
      model,
      entry: x
    }
  }
}

function availability2ScenarioParamInjector(params: number[]): ScenarioFunction {
  return (modelCreator: ModelCreationFunction<Model<any>>): Scenario => {
    simulation.keyspaceMean = 10000;
    simulation.keyspaceStd = 500;

    metronome.realSleepTime = 3;
    metronome.realSleepFrequency = 1000;


    const z = new Z();
    const model = modelCreator(z);
    const y = new Y(model.entry);
    const x = new X(y);

    //  add extra properties for models that can take advantage of it
    x.beforeHook = (event: Event) => {
      const key = parseInt(event.key.slice(2));
      (<Event & { priority: number }>event).priority = key % 3;
    }

    /*    PARAM changes   */
    // PARAM load
    simulation.eventsPer1000Ticks = params[0] / TICK_DILATION
    // PARAM z's capacity
    z.inQueue = new FIFOServiceQueue(1, 500);
    // PARAM z's latency
    z.mean = Math.floor(params[1])
    // PARAM z's availability
    z.availability = params[2]
    //PARAM z's new availability
    metronome.setTimeout(() => z.availability = params[3], 8000 * TICK_DILATION) // index 4 = 2000 * TICK_DILATION

    return {
      name: "SteadyAvailability",
      model,
      entry: x
    }
  }
}



let time = 0;

function availabilityScenarioParamInjector(params: number[]): ScenarioFunction {
  return (modelCreator: ModelCreationFunction<Model<any>>): Scenario => {
    simulation.keyspaceMean = 10000;
    simulation.keyspaceStd = 500;

    metronome.realSleepTime = 3;
    metronome.realSleepFrequency = 1000;


    const z = new Z();
    const model = modelCreator(z);
    const y = new Y(model.entry);
    const x = new X(y);

    //  add extra properties for models that can take advantage of it
    x.beforeHook = (event: Event) => {
      const key = parseInt(event.key.slice(2));
      (<Event & { priority: number }>event).priority = key % 3;
    }

    //simulation.debug = true;

    metronome.setInterval(() => {
      let d = +new Date() - time;
      time = time + d;
      console.log("oo", metronome.now(), `+${d}`)
    }, 1000)
    /*metronome.setTimeout(() => {
      console.log("xx", metronome.now())
      metronome.debug(true)
    }, 99999)
    metronome.setTimeout(() => {
      console.log("yy", metronome.now())
      metronome.debug(true)
    }, 100000)*/

    /*    PARAM changes   */
    // PARAM load
    simulation.eventsPer1000Ticks = params[0] / TICK_DILATION
    // PARAM z's capacity
    z.inQueue = new FIFOServiceQueue(1, Math.floor(params[1]));
    // PARAM z's latency
    z.mean = Math.floor(params[2])
    // PARAM z's availability
    z.availability = params[3]
    //PARAM z's new availability
    metronome.setTimeout(() => z.availability = params[4], 8000 * TICK_DILATION) // index 4 = 2000 * TICK_DILATION

    return {
      name: "SteadyAvailability",
      model,
      entry: x
    }
  }
}
function capacityScenarioParamInjector(params: number[]): ScenarioFunction {
  return (modelCreator: ModelCreationFunction<Model<any>>): Scenario => {
    simulation.keyspaceMean = 10000;
    simulation.keyspaceStd = 500;

    const z = new Z();
    const model = modelCreator(z);
    const y = new Y(model.entry);
    const x = new X(y);

    //  add extra properties for models that can take advantage of it
    x.beforeHook = (event: Event) => {
      const key = parseInt(event.key.slice(2));
      (<Event & { priority: number }>event).priority = key % 3;
    }

    /*    PARAM changes   */
    // PARAM load
    simulation.eventsPer1000Ticks = params[0] / TICK_DILATION
    // PARAM z's capacity
    z.inQueue = new FIFOQueue(1, Math.floor(params[1]));
    // PARAM z's latency
    z.mean = Math.floor(params[2])
    // PARAM z's availability
    z.availability = params[3]
    //PARAM z's new capacity
    metronome.setTimeout(() => z.inQueue.setNumWorkers(Math.floor(params[4])), 8000 * TICK_DILATION) // index 4 = 2000 * TICK_DILATION

    return {
      name: "SteadyCapacity",
      model,
      entry: x
    }
  }
}
