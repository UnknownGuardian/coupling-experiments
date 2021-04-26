import { WrappedStage, Event, metronome } from "@byu-se/quartermaster";
type IndividualTimeoutEvent = Event & { timeout: number }
/**
 * Limit the amount of time to wait for a response from the wrapped stage
 * on a per-request basis, with some stage timeout in case the request
 * doesn't have one.
 */
export class PerRequestTimeout extends WrappedStage {
  public timeout: number = 300;
  async workOn(event: IndividualTimeoutEvent): Promise<void> {
    const actualTimeout = event.timeout || this.timeout
    const tookTooLong = metronome.wait(actualTimeout).then(() => {
      throw "fail"
    });
    await Promise.race([tookTooLong, this.wrapped.accept(event)]);
  }
}
