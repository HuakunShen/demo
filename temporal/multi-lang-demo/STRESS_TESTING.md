# Stress Testing & Performance Measurement Guide 🚀

This guide explains how to run stress tests and measure the performance of your multi-language Temporal workflow.

## 📋 Prerequisites

**All three workers MUST be running before starting the stress test:**

```bash
# Terminal 1: Go Worker
cd multi-lang-demo/go-worker
go run .

# Terminal 2: Python Worker  
cd multi-lang-demo/python-worker
source .venv/bin/activate
python worker.py

# Terminal 3: TypeScript Worker
cd multi-lang-demo/ts-worker
npm run worker
```

## 🏃 Running Stress Tests

### Quick Start (Default Test)

Run a default stress test with 20 requests:

```bash
cd multi-lang-demo/ts-worker
npm run stress-test
```

**Default configuration:**
- Total Requests: 20
- Concurrent Batches: 2
- Batch Size: 5
- Effective Concurrency: 10 workflows at a time

### Pre-configured Test Sizes

**Small Test (10 requests, 2 concurrent batches, 5 per batch):**
```bash
npm run stress-test:small
```

**Medium Test (50 requests, 5 concurrent batches, 10 per batch):**
```bash
npm run stress-test:medium
```

**Large Test (100 requests, 10 concurrent batches, 10 per batch):**
```bash
npm run stress-test:large
```

### Custom Configuration

You can specify your own parameters:

```bash
npm run stress-test [total_requests] [concurrent_batches] [batch_size]
```

**Examples:**

```bash
# 30 total requests, 3 concurrent batches, 5 requests per batch
npm run stress-test 30 3 5

# 200 requests, 20 concurrent batches, 10 per batch (high load!)
npm run stress-test 200 20 10

# 5 requests, 1 batch at a time, 5 per batch (sequential)
npm run stress-test 5 1 5
```

## 📊 Understanding the Results

### Sample Output

```
╔════════════════════════════════════════════════════════════════╗
║   Multi-Language Temporal Workflow - Stress Test Client       ║
╚════════════════════════════════════════════════════════════════╝

🔌 Connecting to Temporal server...

🚀 Starting Stress Test
────────────────────────────────────────────────────────────────
Configuration:
  Total Requests:      20
  Concurrent Batches:  2
  Batch Size:          5
  Requests per Batch:  10
────────────────────────────────────────────────────────────────

📦 Running batch set 1/2 (2 concurrent batches)...
   ✓ Completed: 10/10 successful (avg: 1234.56ms)
   Progress: 10/20 total requests

📦 Running batch set 2/2 (2 concurrent batches)...
   ✓ Completed: 10/10 successful (avg: 1198.32ms)
   Progress: 20/20 total requests

================================================================================
📊 STRESS TEST RESULTS
================================================================================

📈 Overview:
  Total Requests:      20
  Successful:          20 (100.0%)
  Failed:              0 (0.0%)
  Total Test Duration: 15.43s

⏱️  Latency Statistics (ms):
  Minimum:             1089.23 ms
  Maximum:             1456.78 ms
  Mean (Average):      1216.45 ms
  Median (P50):        1203.12 ms
  P90:                 1387.45 ms
  P95:                 1421.33 ms
  P99:                 1452.11 ms

🚀 Throughput:
  Requests/Second:     1.30 req/s

================================================================================
💾 Results saved to: stress-test-results-2025-11-10T18-00-00-000Z.json
```

## 📈 Key Metrics Explained

### Latency Metrics

- **Minimum**: Fastest workflow completion time
- **Maximum**: Slowest workflow completion time
- **Mean (Average)**: Average completion time across all successful requests
- **Median (P50)**: 50% of requests completed faster than this
- **P90**: 90% of requests completed faster than this
- **P95**: 95% of requests completed faster than this
- **P99**: 99% of requests completed faster than this

### Why These Metrics Matter

- **Mean** gives you the average performance
- **Median (P50)** is often more representative than mean (less affected by outliers)
- **P95/P99** show your worst-case scenarios, important for SLAs
- **Throughput** shows how many workflows can be processed per second

### Example Analysis

```
Mean:    1216.45 ms  → Average workflow takes ~1.2 seconds
Median:  1203.12 ms  → Typical workflow takes ~1.2 seconds
P95:     1421.33 ms  → 95% of workflows complete within ~1.4 seconds
P99:     1452.11 ms  → Even worst-case is under 1.5 seconds ✅
```

## 🎯 Performance Expectations

### Typical Performance Profile

For the multi-language money transfer workflow:

1. **Network calls**: TypeScript → Go → Python → TypeScript
2. **Processing time**: Each activity simulates 200-1000ms of work
3. **Serialization**: Data converted between languages
4. **Temporal overhead**: Workflow orchestration, history recording

**Expected latency per workflow:**
- Minimum: ~800ms (best case with minimal processing)
- Typical: ~1000-1500ms (normal operation)
- Maximum: ~2000ms (during high load or slow activities)

### What Affects Performance?

1. **Worker Availability**
   - More workers = better parallelism
   - Each language worker can handle multiple activities

2. **Temporal Server Load**
   - Local docker instance has limits
   - Production deployments are much faster

3. **Activity Execution Time**
   - Withdrawal: 200-1000ms (simulated)
   - Deposit: 200-800ms (simulated)
   - Refund: 300-1000ms (if triggered)

4. **Concurrency Level**
   - Higher concurrency = more load
   - May reveal bottlenecks or rate limits

## 🔍 Analyzing Results Files

Each test run saves detailed results to a JSON file:

```json
{
  "totalRequests": 20,
  "successfulRequests": 20,
  "failedRequests": 0,
  "totalDuration": 15432,
  "metrics": [
    {
      "workflowId": "stress-test-1699999999999-1",
      "startTime": 1699999999999,
      "endTime": 1700000001234,
      "duration": 1235,
      "success": true
    },
    // ... more results
  ],
  "statistics": {
    "min": 1089.23,
    "max": 1456.78,
    "mean": 1216.45,
    "median": 1203.12,
    "p50": 1203.12,
    "p90": 1387.45,
    "p95": 1421.33,
    "p99": 1452.11,
    "throughput": 1.30
  }
}
```

## 🐛 Troubleshooting

### High Failure Rate

**Symptom**: Many failed requests

**Possible Causes:**
1. Workers not running or overloaded
2. Temporal server connection issues
3. Too high concurrency for your system

**Solutions:**
- Ensure all 3 workers are running
- Reduce concurrency: `npm run stress-test 20 1 5`
- Check worker logs for errors
- Monitor Temporal Web UI at http://localhost:8080

### Slow Performance

**Symptom**: P95 > 3000ms or throughput < 0.5 req/s

**Possible Causes:**
1. Limited CPU/memory resources
2. Docker resource constraints
3. Network latency
4. Worker bottlenecks

**Solutions:**
- Check Docker resource allocation
- Monitor CPU/memory usage during tests
- Scale workers horizontally (run multiple instances)
- Use dedicated hardware for Temporal server

### Inconsistent Results

**Symptom**: Large variance between runs

**Possible Causes:**
1. Background processes affecting performance
2. Random activity duration simulation
3. Temporal server state

**Solutions:**
- Run multiple tests and average results
- Close unnecessary applications
- Restart Temporal server between large tests

## 📊 Benchmarking Tips

### Establishing a Baseline

1. **Run small test first:**
   ```bash
   npm run stress-test:small
   ```

2. **Verify all workers are healthy**

3. **Run medium test:**
   ```bash
   npm run stress-test:medium
   ```

4. **Compare results** - should be similar latencies, higher throughput

### Comparing Configurations

Test different worker configurations:

```bash
# Baseline: All workers on same machine
npm run stress-test:medium

# Stop Python worker, observe failure handling
# Stop & restart, observe recovery

# Scale up: Run 2 Python workers in parallel
# Re-run test, observe improved throughput
```

### Load Testing

Gradually increase load to find limits:

```bash
npm run stress-test 10 2 5    # Warm-up
npm run stress-test 25 5 5    # Light load
npm run stress-test 50 5 10   # Medium load  
npm run stress-test 100 10 10 # Heavy load
npm run stress-test 200 20 10 # Stress test
```

Watch for:
- When latency starts increasing significantly
- When failures start occurring
- System resource utilization (CPU, memory, disk)

## 🎓 Best Practices

1. **Always have all workers running** before starting tests
2. **Run multiple test iterations** to get consistent results
3. **Monitor Temporal Web UI** during tests (http://localhost:8080)
4. **Save and compare results** over time to track performance
5. **Start small** and gradually increase load
6. **Test failure scenarios** (stop workers mid-test to see recovery)

## 🌐 Viewing Test Progress

While tests run, monitor:

1. **Temporal Web UI**: http://localhost:8080
   - View active workflows
   - See task queue backlogs
   - Monitor worker activity

2. **Worker Terminal Windows**
   - Go worker: See withdrawal logs
   - Python worker: See deposit logs
   - TypeScript worker: See workflow orchestration

3. **Test Terminal**
   - Progress updates per batch
   - Success rates
   - Average durations

## 🚀 Advanced: Production Testing

For production-like testing:

1. **Use production Temporal Cloud** or self-hosted cluster
2. **Scale workers horizontally** (multiple instances per language)
3. **Monitor with Prometheus/Grafana**
4. **Set up alerts** for SLA violations
5. **Test disaster recovery** (kill workers, observe recovery)

## 📚 Next Steps

After understanding your baseline performance:

1. **Optimize activity code** if latencies are too high
2. **Scale workers** if throughput is insufficient
3. **Tune Temporal configuration** for your workload
4. **Implement caching** where appropriate
5. **Add monitoring and alerting** for production

---

**Happy Testing! 🎉**

For more information, see:
- [QUICKSTART.md](./QUICKSTART.md) - Basic setup
- [FIXES_APPLIED.md](./FIXES_APPLIED.md) - Technical details
- [Temporal Documentation](https://docs.temporal.io/)

