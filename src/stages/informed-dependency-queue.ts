import { Event } from "@byu-se/quartermaster";
import { DependencyQueue } from "./dependency-queue";

export class InformedDependencyQueue extends DependencyQueue {

  async workOn(event: Event & { capacity: number } & { tries: number }): Promise<void> {
    return super.workOn(event).finally(() => {
      this.inQueue.setNumWorkers(event.capacity);
    });
  }
}
