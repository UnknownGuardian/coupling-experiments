import { Event, Queue, stats, Worker } from "@byu-se/quartermaster";


type Item = { callback: Function, event: Event };

/**
 * A Priority queue implementation, differing from typical implementations by
 * 1) accepts all incoming events
 * 2) immediately sorting
 * 3) evicting events if the queue is over capacity
 * 
 * Instead of
 * 1) only accepting events if there is room
 * 2) sorting accepted events
 */
export class PriorityQueue implements Queue {
  // highest priority first, default to FIFO
  public priority: (event: Event) => number = (event: Event) => 1 / event.responseTime.startTime
  public readonly items: Item[] = [];
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
    // a priority queue, since it can evict, can never be full
    return false
  }
  hasFreeWorker(): boolean {
    return this.workers.some(w => w.event == null);
  }
  hasWorkToDo(): boolean {
    return this.items.length > 0;
  }

  add(item: Item): void {
    // always push
    this.items.push(item);

    // sort
    this.items.sort((a, b) => this.priority(b.event) - this.priority(a.event));


    //this.items.length > 190 && console.log(this.items.length, this.capacity)

    // if more than full (full means 10 items in a 10 capacity, we only want to trigger if 11)
    if (this.items.length > this.capacity) {
      // evict something by evicting the last thing in the queue
      const lastItem = this.items.pop() as Item;

      // let it know its been failed
      lastItem.callback('fail', null);
      //stats.add(`eviction-priority-${(<any>lastItem.event)["priority"]}`, 1)
    }

    // trigger our work check
    this.work();
  }

  work(): void {
    if (!this.hasFreeWorker())
      return;

    if (!this.hasWorkToDo())
      return;



    const nextUp: Item = this.items.shift() as Item
    const worker = this.workers.find(w => w.event == null) as Worker;
    worker.event = nextUp.event;
    nextUp.callback(null, worker);
  }

  length(): number {
    return this.items.length;
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