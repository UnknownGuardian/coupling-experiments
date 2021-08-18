import { WrappedStage, Event, metronome } from "@byu-se/quartermaster";
import { TICK_DILATION } from "..";


/**
 * Retry on Failure and some condition.
 * If {exitCondition} is true, it will not retry.
 */
export class ConditionalRetry extends WrappedStage {
  public exitCondition: (event: Event) => boolean = () => false
  public attempts: number = 2;
  async workOn(event: Event): Promise<void> {
    let attempt: number = 1;
    while (attempt <= this.attempts) {
      try {
        await this.wrapped.accept(event);
        return;
      }
      catch {
        attempt++;
      }
      if (this.exitCondition(event))
        throw "fail";
      
      // wait for at least 1 tick (1ms), but if we wait some more we can prevent quartermaster
      // from eating 90% of runtime just in this retry loop, especially since its infinite
      await metronome.wait(Math.floor(TICK_DILATION  * 2 - 3))
    }
    throw "fail"
  }
}
