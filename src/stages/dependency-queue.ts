import { Stage, Event, stats, FIFOQueue, metronome } from "@byu-se/quartermaster";
import { SAMPLE_DURATION } from "..";
import { mean } from "../util";

export type FullQueueEvent = Event & { dependencyQueueFull: boolean }

export class DependencyQueue extends Stage {

  // stats
  public latencies: number[] = [];
  public availabilities: number[] = [];
  public queueTimes: number[] = [];
  public enqueueCount: number = 0;
  public queueRejectCount: number = 0;
  public lastAddCount: number = 0;
  public tries: number[] = [];


  constructor(protected wrapped: Stage) {
    super();
    metronome.setInterval(() => {
      stats.record("meanLatencyFromZ", mean(this.latencies));
      stats.record("meanAvailabilityFromZ", mean(this.availabilities));
      stats.record("poolSize", this.inQueue.getCapacity() || 0);
      stats.record("poolUsage", -1);
      stats.record("meanQueueWaitTime", mean(this.queueTimes));
      stats.record("queueSize", this.inQueue instanceof FIFOQueue ? this.inQueue.length() : -1);
      stats.record("enqueueCount", this.enqueueCount);
      stats.record("queueRejectCount", this.queueRejectCount);
      stats.record("meanTriesPerRequest", mean(this.tries));
      this.latencies = [];
      this.queueTimes = [];
      this.enqueueCount = 0;
      this.queueRejectCount = 0;
      this.tries = [];
    }, SAMPLE_DURATION)
  }

  protected async add(event: FullQueueEvent): Promise<void> {
    if (this.inQueue.isFull()) {
      this.queueRejectCount++;
      event.dependencyQueueFull = true;
      return Promise.reject("fail");
    }
    this.enqueueCount++;
  }

  async workOn(event: Event & { tries: number }): Promise<void> {
    const queueTime = event.stageTimes.find(x => x.stage == this.constructor.name)?.queueTime as number;
    this.queueTimes.push(queueTime);

    const n = metronome.now();
    try {
      await this.wrapped.accept(event)
      this.availabilities.push(1);
    } catch (e) {
      this.availabilities.push(0);
      throw e;
    } finally {
      this.latencies.push(metronome.now() - n)
      this.tries.push(event.tries)
    }
  }
}
