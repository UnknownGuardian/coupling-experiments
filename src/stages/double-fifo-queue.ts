import { Event, Queue, Worker } from "@byu-se/quartermaster";


type Item = { callback: Function, event: Event };

/**
 * A FIFO queue implementation with 2 queues that work
 * like double-buffering. When one drains completely, 
 * they swap positions
 */
export class DoubleFIFOQueue implements Queue {
  public readonly current: Item[] = [];
  public readonly secondQueue: Item[] = [];
  private workers: Worker[] = [];
  private capacity: number = 0;

  constructor(capacity: number, numWorkers: number) {
    this.setCapacity(capacity);
    this.setNumWorkers(numWorkers);
  }

  async enqueue(event: Event): Promise<Worker> {
    return new Promise<Worker>((resolve, reject) => {
      const callback = (err: any, data: Worker) => {
        if (err)
          reject(err);
        else
          resolve(data);
      }
      this.add({ event, callback });
    })
  }
  isFull(): boolean {
    return this.secondQueue.length >= this.capacity;
  }
  hasFreeWorker(): boolean {
    return this.workers.some(w => w.event == null);
  }
  hasWorkToDo(): boolean {
    return this.current.length > 0;
  }

  add(item: Item): void {
    if (this.isFull())
      throw "fail"

    this.current.push(item);
    this.work();
  }

  work(): void {
    if (!this.hasFreeWorker())
      return;

    // if no work to be done in our current queue, lets
    // add all the work in the second queue.
    if (this.current.length === 0) {
      this.current.push(...this.secondQueue.slice());
      this.secondQueue.length = 0;
    }

    if (!this.hasWorkToDo())
      return;

    const nextUp: Item = this.current.shift() as Item
    const worker = this.workers.find(w => w.event == null) as Worker;
    worker.event = nextUp.event;
    nextUp.callback(null, worker);
  }

  length(): number {
    return this.current.length + this.secondQueue.length;
  }
  setCapacity(capacity: number): void {
    this.capacity = capacity;
  }
  getCapacity(): number {
    return this.capacity;
  }

  /**
   * Sets the number of workers. If more than there are currently, add new 
   * Workers. If less than there are currently, just drop some from the pool,
   * while allowing those workers to process whatever work they have remaining
   * @param num Then new amount of workers
   */
  setNumWorkers(num: number): void {
    if (num > this.workers.length) {
      while (this.workers.length < num) {
        this.workers.push(new Worker(this));
        this.work();
      }
    } else {
      // This really just depends on garbage collection implementation. For
      // some gc, we have to explicitly destroy reference to the queue in the
      // worker
      for (let i = num; i < this.workers.length; i++) {
        this.workers[i].destroy();
      }
      this.workers.length = num;
    }
  }
  getNumWorkers(): number {
    return this.workers.length
  }
}