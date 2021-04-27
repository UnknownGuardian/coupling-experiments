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
      if (mean(this.times) > 10) {
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
      if (time < 4) {
        const workers = bound(this.inQueue.getNumWorkers() - 1, this.MIN_WORKERS, this.MAX_WORKERS);
        this.inQueue.setNumWorkers(workers);
      }
      this.times.push(time);
      if (this.times.length > 40) {
        this.times.shift();
      }
    });
  }
}

