import { Stage, Event, metronome, stats } from "@byu-se/quartermaster";
import { SAMPLE_DURATION, TICK_DILATION } from "..";
import { SeededMath } from "../util";

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

    if (SeededMath.random() > this.availability) {
      throw "fail";
    }

    // don't overwrite previous value if timeout
    if (typeof (event as any).value === 'undefined') {
      (event as any).value = 1;
    }
    if (typeof (event as any).age === 'undefined') {
      (event as any).age = 0;
    }
  }

  getLatency() {
    return Math.max(1, this.seededNormal(this.mean, this.std));
  }


  seededNormal(mean: number, std: number): number {
    return Math.floor(this.seededStandardNormal() * std + mean);
  }

  seededStandardNormal(): number {
    let u: number = 0;
    let v: number = 0;
    while (u == 0)
      u = SeededMath.random();
    while (v == 0)
      v = SeededMath.random();
    const value = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    if (isNaN(value)) {
      console.error("NAN achieved with values", u, v)
    }
    return value
  }
}