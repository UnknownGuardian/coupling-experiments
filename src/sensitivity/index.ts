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

/*
 Read an input param value file, run the simulations and output a time series for each input
*/



const output = join(__dirname, "..", "..", "out", "sensitivity");
const paramValues = join(output, "param_values.txt");
const file = readFileSync(paramValues, 'utf-8')
const data: number[][] = parse(file, { delimiter: " ", dynamicTyping: true }).data as number[][];
//console.log(data);

const time = +new Date();
const timeseriesDir = join(output, `results-${time}`)

runSteady();
async function runSteady(): Promise<void> {

  mkdirSync(timeseriesDir);
  copyFileSync(paramValues, join(timeseriesDir, "param_values.txt"))

  // loop to data.length - 1 since last row is empty
  for (let i = 0; i < data.length - 1; i++) {
    const params = data[i];
    console.log(`${i + 1}/${data.length}`, params)
    const createScenario = latencyScenarioParamInjector(params);
    await runInstance(createNaiveModel, createScenario, i);
  }
}

async function runInstance(createModel: ModelCreationFunction<any>, createScenario: ScenarioFunction, id: number): Promise<void> {
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
  const rows = getRows();
  write(name, rows);
}


export function write(filename: String, rows: SlimRow[]): void {
  //console.log(rows);
  const csv = unparse(rows);
  writeFileSync(join(timeseriesDir, `${filename}.csv`), csv)
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
  //avgCacheAge: number, // V
  //hitCount: number, // C
  //missCount: number, // C
  //cacheSize: number,
  //meanResponseAge: number, // R - mean age for all responses
  //meanResponseCacheAge: number, // R - mean age for cached responses
}

/**
 * Read the metrics we are interested in from the simulation
 * @returns Rows, corresponding to time slices, of metrics
 */
function getRows(): SlimRow[] {
  const tick: number[] = stats.getRecorded("tick");
  //const loadFromSimulation: number[] = stats.getRecorded("loadFromSimulation");
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
  /*const avgCacheAge: number[] = stats.getRecorded("avgCacheAge");
  const hitCount: number[] = stats.getRecorded("hitCount");
  const missCount: number[] = stats.getRecorded("missCount");
  const cacheSize: number[] = stats.getRecorded("cacheSize");*/

  const events: Event[][] = stats.getRecorded("events");

  return tick.map<SlimRow>((_, index) => {
    /*const subsetEvents = optionalArray<Event>(events, index, []);
    const successSubset = subsetEvents.filter(e => e.response === "success")
    const meanResponseAge: number = mean(successSubset.map(e => (e as any).age));
    const meanResponseCacheAge: number = mean(successSubset.map(e => (e as any).age).filter(age => age > 0));

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
    const meanResponseGSlowAvailability: number = mean(gSlow.map(e => e.response === "success" ? 1 : 0));*/

    return {
      tick: tick[index],
      //loadFromSimulation: loadFromSimulation[index],
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
      //avgCacheAge: optionalNumber(avgCacheAge, index, -1),
      //hitCount: optionalNumber(hitCount, index, -1),
      //missCount: optionalNumber(missCount, index, -1),
      //cacheSize: optionalNumber(cacheSize, index, -1),
      /*meanResponseAge,
      meanResponseCacheAge,
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
      meanResponseGSlowAvailability*/
    }
  })
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
