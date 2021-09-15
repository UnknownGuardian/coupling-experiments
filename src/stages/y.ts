import { Stage, Event, metronome, stats } from "@byu-se/quartermaster";
import { SAMPLE_DURATION } from "..";

export class Y extends Stage {
  // stats
  public load: number = 0;

  constructor(protected wrapped: Stage) {
    super();
    metronome.setInterval(() => {
      stats.record("loadFromX", this.load);
      this.load = 0;
    }, SAMPLE_DURATION)
  }

  protected async add(event: Event): Promise<void> {
    this.load++;
    if (this.inQueue.isFull()) {
      return Promise.reject("fail");
    }
  }


  async workOn(event: Event): Promise<void> {
    await this.wrapped.accept(event)
  }
}