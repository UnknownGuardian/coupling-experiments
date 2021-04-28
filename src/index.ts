import { Event, metronome, simulation, stats } from "@byu-se/quartermaster";
import { Row, write } from "./csv";
import {
  Model,
  StageCollection,
  createNaiveModel,
  createLoadLevelingModel,
  createLoadSheddingModel,
  createSmartLoadSheddingModel,
  createRequestCachingModel,
  createAsyncCacheLoadingModel,
  createPerRequestTimeoutModel,
  createRetriesModel,
  createInfiniteRetriesModel,
  createInferredPoolSizingModel,
  createCooperativePoolSizingModel
} from "./models";
import {
  varyLoad,
  Scenario,
  intermittentAvailability,
  increaseLatency,
  decreasingAvailability,
  varyCapacity
} from "./scenarios";
import { mean } from "./util";

export const TICK_DILATION = 100;
export const SAMPLE_DURATION = 500 * TICK_DILATION;

run();
async function run(): Promise<void> {
  //await runExperiment("A", varyLoad, createNaiveModel);
  //await runExperiment("B", varyLoad, createLoadLevelingModel);
  //await runExperiment("C", varyLoad, createLoadSheddingModel);
  //await runExperiment("D", varyLoad, createSmartLoadSheddingModel);


  //await runExperiment("A", intermittentAvailability, createNaiveModel);
  //await runExperiment("E", intermittentAvailability, createRequestCachingModel);
  //await runExperiment("F", intermittentAvailability, createAsyncCacheLoadingModel); // not in original
  await runExperiment("H", intermittentAvailability, createRetriesModel);
  await runExperiment("I", intermittentAvailability, createInfiniteRetriesModel);

  //await runExperiment("A", increaseLatency, createNaiveModel);
  //await runExperiment("F", increaseLatency, createAsyncCacheLoadingModel);
  //await runExperiment("G", increaseLatency, createPerRequestTimeoutModel);

  //await runExperiment("A", decreasingAvailability, createNaiveModel);
  //await runExperiment("H", decreasingAvailability, createRetriesModel);
  //await runExperiment("I", decreasingAvailability, createInfiniteRetriesModel);
  await runExperiment("E", decreasingAvailability, createRequestCachingModel);
  await runExperiment("F", decreasingAvailability, createAsyncCacheLoadingModel); // not in original

  //await runExperiment("A", varyCapacity, createNaiveModel);
  //await runExperiment("J", varyCapacity, createInferredPoolSizingModel);
  //await runExperiment("K", varyCapacity, createCooperativePoolSizingModel);

}



export type ModelFunction<T extends StageCollection> = () => Model<T>;
export type ScenarioFunction<T extends StageCollection> = (model: Model<T>) => Scenario;
async function runExperiment<T extends StageCollection, K extends T>
  (filePrefix: string, createScenario: ScenarioFunction<T>, createModel: ModelFunction<K>): Promise<void> {
  simulation.reset();
  metronome.resetCurrentTime();
  stats.reset();

  const model = createModel();
  const scenario = createScenario(model);

  const name = `${filePrefix}-${TICK_DILATION}-${model.name}-${scenario.name}`
  console.log("Beginning Experiment", name)


  await simulation.run(model.entry, 40000);
  console.log("Experiment finished. Metronome stopped at", metronome.now());

  const rows = getRows();
  write(name, rows);
}

function getRows(): Row[] {
  const tick: number[] = stats.getRecorded("tick");
  const loadFromSimulation: number[] = stats.getRecorded("loadFromSimulation");
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
  const avgCacheAge: number[] = stats.getRecorded("avgCacheAge");
  const hitCount: number[] = stats.getRecorded("hitCount");
  const missCount: number[] = stats.getRecorded("missCount");
  const cacheSize: number[] = stats.getRecorded("cacheSize");

  const events: Event[][] = stats.getRecorded("events");

  return tick.map<Row>((_, index) => {
    const subsetEvents = optionalArray<Event>(events, index, []);
    const successSubset = subsetEvents.filter(e => e.response === "success")
    const priority1 = subsetEvents.filter(e => (e as any).priority == 0);
    const priority2 = subsetEvents.filter(e => (e as any).priority == 1);
    const priority3 = subsetEvents.filter(e => (e as any).priority == 2);
    const meanResponseAge: number = mean(successSubset.map(e => (e as any).age));
    const meanResponseCacheAge: number = mean(successSubset.map(e => (e as any).age).filter(age => age > 0));
    const meanResponseP1Availability: number = mean(priority1.map(e => e.response === "success" ? 1 : 0));
    const meanResponseP2Availability: number = mean(priority2.map(e => e.response === "success" ? 1 : 0));
    const meanResponseP3Availability: number = mean(priority3.map(e => e.response === "success" ? 1 : 0));
    const meanResponseP1Latency: number = mean(priority1.map(e => e.responseTime.endTime - e.responseTime.startTime));
    const meanResponseP2Latency: number = mean(priority2.map(e => e.responseTime.endTime - e.responseTime.startTime));
    const meanResponseP3Latency: number = mean(priority3.map(e => e.responseTime.endTime - e.responseTime.startTime));
    return {
      tick: tick[index],
      loadFromSimulation: loadFromSimulation[index],
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
      avgCacheAge: optionalNumber(avgCacheAge, index, -1),
      hitCount: optionalNumber(hitCount, index, -1),
      missCount: optionalNumber(missCount, index, -1),
      cacheSize: optionalNumber(cacheSize, index, -1),
      meanResponseAge,
      meanResponseCacheAge,
      meanResponseP1Availability,
      meanResponseP2Availability,
      meanResponseP3Availability,
      meanResponseP1Latency,
      meanResponseP2Latency,
      meanResponseP3Latency,
    }
  })
}

function optionalNumber(array: number[], index: number, defaultValue: number): number {
  if (!array || array.length <= index)
    return defaultValue;
  return array[index];
}
function optionalArray<T>(array: T[][], index: number, defaultValue: T[]): T[] {
  if (!array || array.length <= index)
    return defaultValue;
  return array[index];
}