# Stress Test Quick Reference 🚀

## Prerequisites ✅

**Start all workers first:**

```bash
# Terminal 1
cd go-worker && go run .

# Terminal 2
cd python-worker && source .venv/bin/activate && python worker.py

# Terminal 3
cd ts-worker && npm run worker
```

## Run Tests 🏃

**Terminal 4 (from `ts-worker` directory):**

```bash
# Quick tests
npm run stress-test:small   # 10 requests
npm run stress-test:medium  # 50 requests  
npm run stress-test:large   # 100 requests

# Default (20 requests)
npm run stress-test

# Custom: npm run stress-test [total] [batches] [size]
npm run stress-test 30 3 10
```

## Key Metrics 📊

| Metric | What It Means |
|--------|---------------|
| **Mean** | Average latency |
| **Median (P50)** | Typical request time |
| **P95** | 95% of requests faster than this |
| **P99** | Worst-case latency |
| **Throughput** | Requests per second |

## Expected Results ⏱️

**Good performance indicators:**
- Mean: 1000-1500ms
- P95: < 2000ms
- P99: < 2500ms
- Success Rate: 100%
- Throughput: > 0.5 req/s

## Troubleshooting 🔧

**High failure rate?**
- Check all 3 workers are running
- Reduce concurrency

**Slow performance?**
- Check system resources
- Restart workers
- Restart Temporal server

**View workflows:**
http://localhost:8080

## Results 💾

Each test saves results to:
```
stress-test-results-[timestamp].json
```

Contains detailed metrics for every request!

