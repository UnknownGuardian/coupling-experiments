import { Stage } from "@byu-se/quartermaster";

/**
 * Wrapped Stage encapsulates a single other stage. Useful for retries,
 * caches, timeouts, etc.
 * 
 * For example, the workOn() method could call: await this.wrapped.accept()
 * and pass on the request to the stage that was wrapped.
 */
export abstract class InjectableWrappedStage extends Stage {
  constructor(public wrapped: Stage) {
    super();
  }
}