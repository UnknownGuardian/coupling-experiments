const jStat = require("jstat");

export function mean(arr: number[]): number {
  return jStat.mean(arr);
}

export function bound(num: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, num));
}
