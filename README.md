# Non-functional Property Coupling Quartermaster models

Use [Quartermaster](https://github.com/BYU-SE/quartermaster) to model and explore coupling of non-functional properties (NFP).

---

## Installation

To explore and develop locally, you can clone this repository. Then, run `npm i` to install dependencies. The models are written in TypeScript.

## Usage

```
npm start
```

Runs all the scenarios, with some subset of models for each scenario as defined in `src/index.ts`.

The output will be located in (1) `out/models` (by model) and (2) `out/models/scenario` (grouped by scenario, selected properties extracted).

Example, demonstration output is included in the source. The models are not deterministic, so running the models will produce different output each time.

## Navigating this repository

The code is split into 3 parts, located in `src/`

1. **Stages** are core pieces of computation which are used by Quartermaster to model a software system. We use stages to represent subsystems X, Y, Z and components like caches, queues, and pools. Quartermaster is unopinionated about the decomposition of a system into a network of stages.
2. **Scenarios** include everything outside of the interaction code from Y to Z, meaning they include creating subsystems X, Y, timeouts, priority classes, etc.
3. **Models** are the pieces of interaction code used by Y to interact with Z. The models define how a network of Quartermaster stages (the implementations of this interaction code) are connected together and can be used by a scenario.

## Contributing to this Repository

This repository represents the data and code in relation to a paper produced by the BYU Software Engineering Lab, with authors Matt Pope and Jonathan Sillito. A version of this repository in the exact form used for this paper will be tagged here. Bug fixes, additional model tuning, and additional explorations may be accepted for the purpose of improving upon the work in that paper at the discretion of the authors. Work that is unrelated to this paper would be better located in a new repository.
