import { unparse } from "papaparse"
import { writeFileSync } from "fs";
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

}
export function write(filename: String, rows: Row[]): void {
  //console.log(rows);
  const csv = unparse(rows);
  writeFileSync(join(__dirname, "..", "..", "out", "models", `${filename}.csv`), csv)
}
