import { Event, metronome, Stage } from "@byu-se/quartermaster";
import { TICK_DILATION } from "..";
import { mean, bound } from "../util";
import { DependencyQueue } from "./dependency-queue";
import { Z } from "./z";

export class InferredDependencyQueue extends DependencyQueue {
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
      // if NEAR BELOW, reduce little
      // if NEAR ABOVE, do nothing
      // if WELL ABOVE, do nothing
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

/*
// latency and availability
import { Event, metronome, Stage } from "@byu-se/quartermaster";
import { TICK_DILATION } from "..";
import { mean, bound } from "../util";
import { DependencyQueue } from "./dependency-queue";

export class InferredDependencyQueue extends DependencyQueue {
  public successRate: number[] = [];
  public successLatencies: number[] = [];
  public MIN_WORKERS = 1;
  public MAX_WORKERS = 50;
  public UNACCEPTABLE_LATENCY = 40 * TICK_DILATION;

  constructor(protected wrapped: Stage) {
    super(wrapped);

    // grow capacity slowly over time, if our average is good
    metronome.setInterval(() => {
      const availability = mean(this.successRate) || 1;
      const latency = mean(this.successLatencies) || 1;

      const range = this.MAX_WORKERS - this.MIN_WORKERS;
      const idealNumWorkers = Math.floor(range * (availability * latency)) + this.MIN_WORKERS;
      const actualNumWorkers = Math.floor(this.inQueue.getNumWorkers() + (idealNumWorkers - this.inQueue.getNumWorkers()) / 3)

      console.log(availability, latency, this.inQueue.getNumWorkers());
      this.inQueue.setNumWorkers(actualNumWorkers);
      this.successRate = [];
      this.successLatencies = [];
    }, 1000 * TICK_DILATION)
  }

  async workOn(event: Event & { capacity: number } & { tries: number }): Promise<void> {
    const n = metronome.now();
    try {
      await super.workOn(event);
      this.successRate.push(1);

      const time = metronome.now() - n;
      this.successLatencies.push(time < this.UNACCEPTABLE_LATENCY ? 1 : 0);
    } catch (e) {
      this.successRate.push(0);
      throw e;
    }
  }
}*/



/*

// LATENCY ONLY
import { Event, metronome, Stage } from "@byu-se/quartermaster";
import { TICK_DILATION } from "..";
import { mean, bound } from "../util";
import { DependencyQueue } from "./dependency-queue";

export class InferredDependencyQueue extends DependencyQueue {
  public times: number[] = [];
  public MIN_WORKERS = 1;
  public MAX_WORKERS = 50;

  constructor(protected wrapped: Stage) {
    super(wrapped);

    // grow capacity slowly over time, if our average is good
    metronome.setInterval(() => {
      const m = mean(this.times);
      console.log(m, this.inQueue.getNumWorkers());
      if (m > 10) {
        const workers = bound(this.inQueue.getNumWorkers() + 1, this.MIN_WORKERS, this.MAX_WORKERS);
        this.inQueue.setNumWorkers(workers);
      }
    }, 100 * TICK_DILATION)
  }

  async workOn(event: Event & { capacity: number } & { tries: number }): Promise<void> {
    const n = metronome.now();
    return super.workOn(event).finally(() => {
      const time = metronome.now() - n;
      // if time is very small, likely getting rejected immediately,
      // reduce capacity immediately
      if (time < 3 * TICK_DILATION) {
        const workers = bound(this.inQueue.getNumWorkers() - 1, this.MIN_WORKERS, this.MAX_WORKERS);
        this.inQueue.setNumWorkers(workers);

        console.log("shrink it bro")
      }
      this.times.push(time);
      if (this.times.length > 40) {
        this.times.shift();
      }
    });
  }
}

*/