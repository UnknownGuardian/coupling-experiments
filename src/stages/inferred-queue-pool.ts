import { Event, metronome } from "@byu-se/quartermaster";
import { TICK_DILATION } from "..";
import { bound } from "../util";
import { QueuePool } from "./queue-pool";
import { Z } from "./z";

/**
 * Adjust the size of the pool every so often by inferring the capacity of 
 * Z. Scale up linearly as the ratio of successful, timely responses to the 
 * call rate approaches 1 and scale down proportionally as that ratio declines.
 */
export class InferredQueuePool extends QueuePool {
  public callRate: number = 0;
  public successResponseRate: number = 0;

  public UNACCEPTABLE_LATENCY: number = 40 * TICK_DILATION;

  public MIN_WORKERS = 1;
  public MAX_WORKERS = 50;

  constructor(protected wrapped: Z) {
    super(wrapped);

    // grow capacity slowly over time, if our average is good
    metronome.setInterval(() => {
      // if WELL BELOW, reduce greatly
      // if BELOW, reduce little
      // if NEAR BELOW, do nothing
      // if VERY NEAR BELOW, grow linearly
      // if ABOVE, grow linearly
      const ratio = this.successResponseRate / this.callRate;


      let currentWorkers = this.inQueue.getNumWorkers();
      //console.log(ratio, currentWorkers);
      let numWorkers = currentWorkers;
      if (ratio < 0.5)
        numWorkers -= 8
      else if (ratio < 0.6)
        numWorkers -= 5
      else if (ratio < 0.75)
        numWorkers -= 3
      else if (ratio < 0.98)
        numWorkers -= 1
      else
        numWorkers += 2;

      numWorkers = bound(numWorkers, this.MIN_WORKERS, this.MAX_WORKERS);

      let actualWorkers = Math.floor(currentWorkers + (numWorkers - currentWorkers) / 2);

      this.inQueue.setNumWorkers(actualWorkers);
      this.callRate = 0;
      this.successResponseRate = 0;
    }, 200 * TICK_DILATION)
  }

  async workOn(event: Event & { capacity: number } & { tries: number }): Promise<void> {
    try {
      this.callRate++;
      const n = metronome.now();
      await super.workOn(event);
      if (metronome.now() - n < this.UNACCEPTABLE_LATENCY)
        this.successResponseRate++;
    } catch (e) {
      throw e;
    }
  }
}