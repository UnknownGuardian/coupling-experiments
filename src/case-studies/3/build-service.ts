import { Stage, FIFOQueue, Event, metronome, normal, stats } from "@byu-se/quartermaster";
import { SAMPLE_DURATION } from ".";
import { mean } from "../../util";

export class BuildService extends Stage {

  public load: number = 0;
  public completed: number = 0;
  public availabilities: number[] = [];
  public latencies: number[] = [];


  constructor(protected wrapped: Stage) {
    super();
    this.inQueue = new FIFOQueue(Infinity, 220);

    metronome.setInterval(() => {
      stats.record("loadFromX", this.load);
      stats.record("meanLatencyFromZ", mean(this.latencies));
      stats.record("meanAvailabilityFromZ", mean(this.availabilities));


      stats.record("queue-size", (<FIFOQueue>this.inQueue).length())
      stats.record("throughput", this.completed / (1000 / SAMPLE_DURATION));
      this.load = 0;
      this.completed = 0;
      this.availabilities = [];
      this.latencies = [];
    }, SAMPLE_DURATION)
  }

  /**
   * Admission control before an event reaches the queue.
   * @param event The event that is seeking entry into the stage
   */
  protected async add(event: Event): Promise<void> {
    this.load++;
    if (this.inQueue.isFull()) {
      stats.add('rejected-queue-events', 1);
      return Promise.reject("fail");
    }
  }

  async workOn(event: Event): Promise<void> {

    stats.max("max-queue-size", (this.inQueue as FIFOQueue).length());
    // do some work
    const latency = normal(8, 2);
    await metronome.wait(latency);

    const n = metronome.now();
    try {
      await this.wrapped.accept(event);
      this.availabilities.push(1);
    } catch (e) {
      this.availabilities.push(0);
      throw e;
    } finally {
      this.completed++;
      this.latencies.push(metronome.now() - n)
    }
  }
}