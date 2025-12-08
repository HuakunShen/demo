# Temporal Performance Benchmarks

This project provides a light-weight Temporal benchmark that focuses on two scenarios that matter for high-frequency market data systems:

1. **Signal-driven hot workflow** – keeps a single workflow execution running and drives it with signals to measure peak signal throughput and end-to-end latency.
2. **Workflow-per-event fan-out** – starts an individual workflow per event and measures throughput/latency while letting you vary the number of workers to see when scaling out helps.

> The code is intentionally minimal so you can copy/paste pieces directly into other repos or extend it with your own workflows.

## Layout

- `cmd/benchmark` – CLI entrypoint that spins up workers, runs the selected benchmarks, and prints a short report.
- `internal/workflows` – reusable workflow/activity implementations and shared signal constants.
- `internal/bench` – benchmarking helpers (worker pool management, metrics, and scenario runners).

## Prerequisites

- Go 1.23+ (uses toolchain go1.24.7).
- A reachable Temporal Frontend (e.g., `temporal server start-dev` in another terminal).

## Running the benchmarks

```bash
cd benchmark-temporal-go
GOMODCACHE=$PWD/.gocache/mod GOCACHE=$PWD/.gocache/build go run ./cmd/benchmark \
  --host-port localhost:7233 \
  --namespace default \
  --workers 4 \
  --signal-events 50000 \
  --workflow-events 10000 \
  --workflow-concurrency 512 \
  --scenario all
```

Key flags:

- `--scenario` – `signal`, `workflow`, or `all`.
- `--workers` – number of worker processes to start (lets you compare single vs multi-worker throughput).
- `--signal-events` / `--signal-concurrency` – controls pressure on the signal-hot workflow.
- `--signal-events-per-workflow` – upper bound of signals per workflow (defaults to 8k). Temporal's default history limit is ~10k events, so keep this below that unless you've raised the server limit. The benchmark streams per-workflow progress as each chunk completes so you get feedback even on very large runs.
- `--workflow-events` / `--workflow-concurrency` – controls how many workflows are started concurrently.
- `--activity-micros` – optional simulated work inside each workflow (microseconds) to model CPU/IO.

The CLI prints per-scenario throughput plus min/avg/max latencies so you can see how Temporal responds when:

1. **One workflow + signals** attempts to absorb bursts (useful for shared state such as arbitrage books).
2. **Many workflows + configurable workers** scale out independently; run the tool multiple times with different `--workers` to understand when you saturate a worker and how much additional throughput multiple workers deliver.

## Cleaning up caches

All module/download caches stay under `.gocache/` so they can be deleted safely if you want a clean tree:

```bash
rm -rf benchmark-temporal-go/.gocache
```
