import { Stage, Event, metronome, normal, stats } from "@byu-se/quartermaster";
import { SAMPLE_DURATION, TICK_DILATION } from "..";

export class Z extends Stage {
  // stats
  public load: number = 0;

  // internal behavior
  public availability = 1;
  public mean: number = 30;
  public std = 4;

  constructor() {
    super();
    metronome.setInterval(() => {
      stats.record("loadFromY", this.load);
      stats.record("zCapacity", this.inQueue.getNumWorkers() || 0);
      this.load = 0;
    }, SAMPLE_DURATION)
  }

  protected async add(event: Event & { tries: number }): Promise<void> {
    this.load++;
    event.tries = (event.tries || 0) + 1
    return super.add(event);
  }


  async workOn(event: Event & { capacity: number }): Promise<void> {
    const latency = this.getLatency();
    if (isNaN(latency) || latency === Infinity) {
      throw "fail";
    }
    await metronome.wait(latency * TICK_DILATION);

    // mark capacity
    event.capacity = this.inQueue.getNumWorkers();

    if (Math.random() > this.availability) {
      throw "fail";
    }

    // don't overwrite previous value if timeout
    if (typeof (event as any).value === 'undefined')
      (event as any).value = 1;
  }

  getLatency() {
    return Math.max(1, normal(this.mean, this.std));
  }
}