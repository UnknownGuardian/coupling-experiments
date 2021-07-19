/**
 * An exploration which demonstrates the queue growing and processing halting
 * after traffic exceeds 1900 events / 1000 ticks.
 * 
 * This exploration exists to prove the design of the Database and Build
 * Service appropriately mock the architecture and problems listed in the 
 * incident report.
 * 
 */

import {
  metronome,
  Retry,
  simulation,
  stats, Event, eventSummary, stageSummary
} from "@byu-se/quartermaster";
import { Database } from "./database"
import { BuildService } from "./build-service"
import { record } from ".";
import { X } from "./x";

const db = new Database();
const retry = new Retry(db);
const service = new BuildService(retry);
service.inQueue.setCapacity(10000);
const x = new X(service);
//retry.attempts = 1;

// scenario
simulation.keyspaceMean = 1000;
simulation.keyspaceStd = 200;
simulation.eventsPer1000Ticks = 4500;

async function work() {
  const events = await simulation.run(x, 50000);
  console.log("done");
  eventSummary(events);
  stageSummary([db, retry, service]);

  const accepted = events.filter(x => x.response === "success")
  const rejected = events.filter(x => x.response != "success")

  const queueTimeCounter = (acc: number, curr: Event) => {
    const stage = curr.stageTimes.find(x => x.stage == 'BuildService');
    return acc + (stage?.queueTime || 0);
  };


  const meanQueueTime = service.time.queueTime / events.length;
  const meanQueueTimeSuccess = accepted.reduce(queueTimeCounter, 0) / accepted.length;
  const meanQueueTimeFailed = rejected.reduce(queueTimeCounter, 0) / rejected.length;
  stats.max('mean-time-in-queue', meanQueueTime);
  stats.max('mean-time-in-queue-success', meanQueueTimeSuccess);
  stats.max('mean-time-in-queue-failed', meanQueueTimeFailed);

  stats.max('throughput', events.length / metronome.now());
  stats.max('recovery-time', metronome.now());

  //stats.summary();

  console.log('rejected-queue-events', stats.get('rejected-queue-events'))
  console.log('max-queue-size', stats.get('max-queue-size'))
  console.log('mean-time-in-queue', meanQueueTime);
  console.log('mean-time-in-queue-success', meanQueueTimeSuccess);
  console.log('mean-time-in-queue-failed', meanQueueTimeFailed);

  console.log('throughput', events.length / metronome.now());
  console.log('recovery-time', metronome.now());


  record("model_a");
}
work();