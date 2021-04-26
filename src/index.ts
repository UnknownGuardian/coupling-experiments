import { metronome, simulation, stats } from "@byu-se/quartermaster";
import { Row, write } from "./csv";
import {
  createAvailabilityCachingModel,
  createAvailabilityInfiniteRetriesModel,
  createAvailabilityRetriesModel,
  createCapacityAdaptivePoolModel,
  createHistoricalCapacityAdaptivePoolModel,
  createImpatientClientModel,
  createLoadLevelingModel,
  createLoadLevelingSheddingModel,
  createPerRequestTimeoutModel,
  createSmartLoadSheddingModel,
  Model,
  StageCollection
} from "./models";
import {
  createAvailabilityCachingScenario,
  createAvailabilityInfiniteRetriesScenario,
  createAvailabilityRetriesScenario,
  createCapacityAdaptivePoolScenario,
  createHistoricalCapacityAdaptivePoolScenario,
  createImpatientClientScenario,
  createLoadLevelingScenario,
  createLoadLevelingSheddingScenario,
  createPerRequestTimeoutScenario,
  createSmartLoadSheddingScenario,
  Scenario
} from "./scenarios";

export const TICK_DILATION = 100;
export const SAMPLE_DURATION = 500 * TICK_DILATION;

run();
async function run(): Promise<void> {
  await runExperiment("1", createLoadLevelingScenario, createLoadLevelingModel);
  await runExperiment("2", createLoadLevelingSheddingScenario, createLoadLevelingSheddingModel);
  await runExperiment("3", createAvailabilityCachingScenario, createAvailabilityCachingModel);
  await runExperiment("4", createImpatientClientScenario, createImpatientClientModel);
  await runExperiment("5", createPerRequestTimeoutScenario, createPerRequestTimeoutModel);
  await runExperiment("6", createAvailabilityRetriesScenario, createAvailabilityRetriesModel);
  await runExperiment("7", createAvailabilityInfiniteRetriesScenario, createAvailabilityInfiniteRetriesModel);
  await runExperiment("8", createCapacityAdaptivePoolScenario, createCapacityAdaptivePoolModel);
  await runExperiment("9", createHistoricalCapacityAdaptivePoolScenario, createHistoricalCapacityAdaptivePoolModel);
  await runExperiment("10", createSmartLoadSheddingScenario, createSmartLoadSheddingModel);
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
  const meanCacheAge: number[] = stats.getRecorded("meanCacheAge");
  const hitCount: number[] = stats.getRecorded("hitCount");
  const missCount: number[] = stats.getRecorded("missCount");
  const cacheSize: number[] = stats.getRecorded("cacheSize");

  return tick.map<Row>((_, index) => ({
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
    meanCacheAge: optionalParam(meanCacheAge, index, -1),
    hitCount: optionalParam(hitCount, index, -1),
    missCount: optionalParam(missCount, index, -1),
    cacheSize: optionalParam(cacheSize, index, -1)
  }))
}

function optionalParam(array: number[], index: number, defaultValue: number): number {
  if (!array || array.length <= index)
    return defaultValue;
  return array[index];
}