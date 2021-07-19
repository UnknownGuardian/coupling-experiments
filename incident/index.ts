export const SAMPLE_DURATION = 1000;

import { unparse, parse } from "papaparse"
import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { stats } from "@byu-se/quartermaster";




export function record(filename: String): void {
  const tick: number[] = stats.getRecorded("tick");
  const loadFromX: number[] = stats.getRecorded("loadFromX");
  const loadFromY: number[] = stats.getRecorded("loadFromY");
  const meanLatencyFromY: number[] = stats.getRecorded("meanLatencyFromY");
  const meanLatencyFromZ: number[] = stats.getRecorded("meanLatencyFromZ");
  const meanAvailabilityFromY: number[] = stats.getRecorded("meanAvailabilityFromY");
  const meanAvailabilityFromZ: number[] = stats.getRecorded("meanAvailabilityFromZ");
  const throughput: number[] = stats.getRecorded("throughput");
  const zCapacity: number[] = stats.getRecorded("zCapacity");

  const rows: IncidentPollRow[] = tick.map<IncidentPollRow>((_, index) => {
    return {
      tick: tick[index],
      loadFromX: loadFromX[index],
      loadFromY: loadFromY[index],
      meanLatencyFromY: meanLatencyFromY[index],
      meanLatencyFromZ: meanLatencyFromZ[index],
      meanAvailabilityFromY: meanAvailabilityFromY[index],
      meanAvailabilityFromZ: meanAvailabilityFromZ[index],
      throughput: throughput[index],
      zCapacity: zCapacity[index],
    }
  });

  write(filename, rows);
}


/**
 * (R) If it has the word "mean", then it is a per event.
 * Otherwise, it may be 
 * 1) (V) the value at the end of the time slice
 * 2) (C) a count of how many things happened during the time slice
 * 3) (-1) unimplemented
 */
export type IncidentPollRow = {
  tick: number
  loadFromX: number, // C
  loadFromY: number, // C
  meanLatencyFromY: number, // R
  meanLatencyFromZ: number, // R
  meanAvailabilityFromY: number, // R
  meanAvailabilityFromZ: number, // R
  throughput: number, // R
  zCapacity: number, // V
}

const dir = join(__dirname, "out");
export function write(filename: String, rows: IncidentPollRow[]): void {
  //console.log(rows);
  const csv = unparse(rows);
  writeFileSync(join(dir, `${filename}.csv`), csv)
}


export function extractPropertiesForScenario(scenarioName: string, properties: (keyof IncidentPollRow)[]) {
  const fileList = readdirSync(dir).filter(file => file.includes(`-${scenarioName}.csv`) && !file.includes("~"));
  console.log(fileList);

  if (fileList.length === 0)
    throw 'No files fit this scenario name: ' + scenarioName

  const files = fileList.map(name => parse(readFileSync(join(dir, name), 'utf-8'), { dynamicTyping: true, header: true }).data as IncidentPollRow[])
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
