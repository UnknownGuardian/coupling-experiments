import { Event, metronome, Stage, Response } from "@byu-se/quartermaster";
import { extractPropertiesForScenario, Row, write } from "./csv";
import { RemoteStage } from "./remote-stage";



run();
async function run(): Promise<void> {
  const remote = new RemoteStage();
  //const x = new X(remote);
  //remote.accept(new Event("cat"));

  const numEventstoSend = 5;
  const pendingEvents: Promise<Event>[] = await sendEvents(remote, numEventstoSend);

  console.log("Waiting for completion");
  const events = await Promise.all(pendingEvents);
  console.log("Completed");
  console.log(events);


  const name = "fastswf-load";
}

async function sendEvents(stage: Stage, numEventsToSend: number): Promise<Promise<Event>[]> {
  const events: Promise<Event>[] = [];

  let finishedCallback: Function;
  const eventsAllSent = new Promise((resolve) => { finishedCallback = resolve; })

  let eventsSent = 0;
  const id = setInterval(async () => {
    events.push(createEvent(stage));

    eventsSent++;
    console.log(">> Sent request", eventsSent)
    if (eventsSent >= numEventsToSend) {
      clearInterval(id);
      finishedCallback();
    }

  }, 100) // 100 = 10 rps

  await eventsAllSent;

  return events;
}

function createEvent(stage: Stage): Promise<Event> {
  const event = new Event("");
  const time = event.responseTime;
  time.startTime = +new Date()

  return stage.accept(event).then(response => {
    event.response = response as Response;
    time.endTime = +new Date()
    return event;
  }).catch(error => {
    event.response = error as Response;
    time.endTime = +new Date()
    return event
  });
}

/*

async function runExperiment(createModel: ModelCreationFunction<any>, createScenario: ScenarioFunction): Promise<void> {
  // reset the environment
  simulation.reset();
  metronome.resetCurrentTime();
  stats.reset();

  // create the model of the system and the scenario
  const scenario = createScenario(createModel);

  const modelId = scenario.model.id;
  const modelName = scenario.model.name;
  const name = `${modelId}-${TICK_DILATION}-${modelName}-${scenario.name}`
  console.log("Beginning Experiment", name)

  // run the simulation
  await simulation.run(scenario.entry, 40000);
  console.log("Experiment finished. Metronome stopped at", metronome.now());

  // record the results
  const rows = getRows();
  write(name, rows);
}

/**
 * Read the metrics we are interested in from the simulation
 * @returns Rows, corresponding to time slices, of metrics
 * /
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
    const meanResponseGSlowAvailability: number = mean(gSlow.map(e => e.response === "success" ? 1 : 0));

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
      meanResponseGFastLatency,
      meanResponseGMediumLatency,
      meanResponseGSlowLatency,
      meanResponseGFastAvailability,
      meanResponseGMediumAvailability,
      meanResponseGSlowAvailability
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
}*/