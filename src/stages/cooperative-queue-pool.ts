import { Event } from "@byu-se/quartermaster";
import { QueuePool } from "./queue-pool";


/**
 * Adjust the size of the pool after every response based on a header included in the response
 */
export class CooperativeQueuePool extends QueuePool {
  async workOn(event: Event & { capacity: number } & { tries: number }): Promise<void> {
    return super.workOn(event).finally(() => {
      this.inQueue.setNumWorkers(event.capacity);
    });
  }
}
