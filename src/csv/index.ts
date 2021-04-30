import { unparse, parse } from "papaparse"
import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

/**
 * (R) If it has the word "mean", then it is a per event.
 * Otherwise, it may be 
 * 1) (V) the value at the end of the time slice
 * 2) (C) a count of how many things happened during the time slice
 * 3) (-1) unimplemented
 */
export type Row = {
  tick: number
  loadFromSimulation: number, // C
  loadFromX: number, // C
  loadFromY: number, // C
  meanLatencyFromY: number, // R
  meanLatencyFromZ: number, // R
  meanAvailabilityFromY: number, // R
  meanAvailabilityFromZ: number, // R
  zCapacity: number, // V
  poolSize: number, // V
  poolUsage: number, // -1
  meanQueueWaitTime: number, // R
  queueSize: number, // R
  enqueueCount: number, // C
  queueRejectCount: number, // C
  meanTriesPerRequest: number,
  avgCacheAge: number, // V
  hitCount: number, // C
  missCount: number, // C
  cacheSize: number,
  meanResponseAge: number, // R - mean age for all responses
  meanResponseCacheAge: number, // R - mean age for cached responses
  meanResponseP1Availability: number, // R
  meanResponseP2Availability: number, // R
  meanResponseP3Availability: number, // R
  meanResponseP1Latency: number, // R
  meanResponseP2Latency: number, // R
  meanResponseP3Latency: number, // R
  meanResponseGFastLatency: number, // R
  meanResponseGMediumLatency: number, // R
  meanResponseGSlowLatency: number, // R
  meanResponseGFastAvailability: number, // R
  meanResponseGMediumAvailability: number, // R
  meanResponseGSlowAvailability: number, // R
}

const dir = join(__dirname, "..", "..", "out", "models");
export function write(filename: String, rows: Row[]): void {
  //console.log(rows);
  const csv = unparse(rows);
  writeFileSync(join(dir, `${filename}.csv`), csv)
}


export function extractPropertiesForScenario(scenarioName: string, properties: (keyof Row)[]) {
  const fileList = readdirSync(dir).filter(file => file.includes(`-${scenarioName}.csv`) && !file.includes("~"));
  console.log(fileList);

  if (fileList.length === 0)
    throw 'No files fit this scenario name: ' + scenarioName

  const files = fileList.map(name => parse(readFileSync(join(dir, name), 'utf-8'), { dynamicTyping: true, header: true }).data as Row[])
  const numRows = Math.max(...files.map(rows => rows.length));

  const tickArr = files[0].map(row => row.tick)

  const rows = [];
  // header by property
  // columns are [TICK, COLUMN_A, COLUMN_A, EMPTY, COLUMN_B, COLUMN_B]
  const header = [""].concat(properties.flatMap(p => fileList.map<string>(_ => p).concat([""])))
  rows.push(header);

  // header by scenario name
  // columns are [NONE, MODEL_A, MODEL_B, EMPTY, MODEL_A, MODEL_B]
  const header2 = [""].concat(properties.flatMap(p => fileList.map<string>(fileName => {
    const parts = fileName.split("-");
    return `${parts[0]} - ${parts[2]}`
  }).concat([""])))
  rows.push(header2);

  // columns are [TICK, COLUMN_A, COLUMN_A, EMPTY, COLUMN_B, COLUMN_B]
  for (let i = 0; i < numRows; i++) {
    const row: any[] = [tickArr[i] || -1];
    for (const p of properties) {
      for (const f of files) {
        const fileRow = f[i];
        if (fileRow)
          row.push(fileRow[p])
        else
          row.push("")
      }
      row.push("");
    }
    rows.push(row);
  }


  const csv = unparse(rows);
  writeFileSync(join(dir, "scenario", `${scenarioName}.csv`), csv)

}
