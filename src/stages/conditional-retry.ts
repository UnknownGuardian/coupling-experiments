import { WrappedStage, Event } from "@byu-se/quartermaster";


/**
 * Retry on Failure and some condition.
 * If {exitCondition} is true, it will not retry.
 */
export class ConditionalRetry extends WrappedStage {
  public exitCondition: (event: Event) => boolean = () => true
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
    }
    throw "fail"
  }
}
