import { Stage, Event, metronome, stats } from "@byu-se/quartermaster";
import fetch from "node-fetch";

export class RemoteStage extends Stage {
  // stats
  public load: number = 0;
  public reqId = 0;

  constructor() {
    super();
    metronome.setInterval(() => {
      stats.record("loadFromX", this.load);
      this.load = 0;
    }, 5000)
  }

  protected async add(): Promise<void> {
    this.load++;
    if (this.inQueue.isFull()) {
      return Promise.reject("fail");
    }
  }


  async workOn(event: Event): Promise<void> {
    const res = await fetch("https://www.fastswf.com")
    console.log(`  << Got response (${res.status})`, this.reqId++)

    if (res.status != 200)
      return Promise.reject("fail");
    //res.text().then(x => console.log(x));
  }
}