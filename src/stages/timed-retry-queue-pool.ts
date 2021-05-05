import { Event, metronome } from "@byu-se/quartermaster";
import { TICK_DILATION } from "..";
import { QueuePool } from "./queue-pool";
import { Z } from "./z";

/**
 * Bound the time that each worker has to obtain a response from Z
 * by a timeout and permit each worker to retry multiple times.
 */
export class TimedRetryQueuePool extends QueuePool {

  //behavior
  public maxRetryTime: number = 100;
  public timeout: number = 300 * TICK_DILATION;


  constructor(protected wrapped: Z) {
    super(wrapped);
  }

  async workOn(event: Event & { tries: number }): Promise<void> {
    const queueTime = event.stageTimes.find(x => x.stage == this.constructor.name)?.queueTime as number;
    this.queueTimes.push(queueTime);

    await this.wrapTimeout(event);
  }

  private async wrapTimeout(event: Event & { tries: number }): Promise<void> {
    const tookTooLong = metronome.wait(this.timeout).then(() => {
      throw "fail"
    });
    await Promise.race([tookTooLong, this.wrapTimedRetry(event)]);
  }

  /**
   * Retry as many times we can within maxRetryTime
   * @param event Re
   * @returns 
   */
  private async wrapTimedRetry(event: Event & { tries: number }): Promise<void> {
    const n = metronome.now();
    while (metronome.now() < n + this.maxRetryTime) {
      const n = metronome.now();
      try {
        await this.wrapped.accept(event);
        this.availabilities.push(1);
        return;
      }
      catch {
        this.availabilities.push(0);
      } finally {
        this.latencies.push(metronome.now() - n)
        this.tries.push(event.tries)
      }
    }
    throw "fail"
  }
}
