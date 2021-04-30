import { Event, metronome } from "@byu-se/quartermaster";
import { TICK_DILATION } from "..";
import { DependencyQueue } from "./dependency-queue";
import { Z } from "./z";

export class TimedDependencyQueue extends DependencyQueue {

  //behavior
  public timeout: number = 300 * TICK_DILATION;


  constructor(protected wrapped: Z) {
    super(wrapped);
  }

  async workOn(event: Event & { tries: number }): Promise<void> {
    await this.wrapTimeout(event);
  }

  private async wrapTimeout(event: Event & { tries: number }): Promise<void> {
    const tookTooLong = metronome.wait(this.timeout).then(() => {
      throw "fail"
    });
    await Promise.race([tookTooLong, super.workOn(event)]);
  }
}
