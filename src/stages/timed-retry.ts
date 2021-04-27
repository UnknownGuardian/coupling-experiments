import { metronome, WrappedStage, Event } from "@byu-se/quartermaster";
/**
 * Retry a wrapped stage as many times until maxRetryTime has passed
 */
export class TimedRetry extends WrappedStage {
  public maxRetryTime: number = 100;

  async workOn(event: Event): Promise<void> {
    const n = metronome.now();
    while (metronome.now() < n + this.maxRetryTime) {
      try {
        await this.wrapped.accept(event);
        return;
      }
      catch { }
    }
    throw "fail"
  }
}
