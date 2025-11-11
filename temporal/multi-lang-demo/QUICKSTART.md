# Multi-Language Temporal Demo - Quick Start

## 🎯 What This Demo Does

This demonstrates Temporal's ability to orchestrate activities across **three different programming languages**:

1. **TypeScript** - Workflow orchestration & refund activity
2. **Go** - Withdrawal activity  
3. **Python** - Deposit activity

## ⚡ Quick Start (4 Terminals Required)

### Prerequisites
- ✅ Temporal Server running on `localhost:7233`
- ✅ Go 1.21+ installed
- ✅ Python 3.8+ installed  
- ✅ Node.js 16+ installed

### Terminal 1: Start Go Worker (Withdrawal)

```bash
cd multi-lang-demo/go-worker
go run .
```

**Expected output:**
```
Go Worker started for withdrawal activities on queue: WITHDRAWAL_QUEUE
```

### Terminal 2: Start Python Worker (Deposit)

```bash
cd multi-lang-demo/python-worker

# If using virtual environment (recommended):
source .venv/bin/activate

python worker.py
```

**Expected output:**
```
INFO:python-worker:Python Worker starting for deposit activities
INFO:python-worker:Python Worker started on queue: DEPOSIT_QUEUE
```

### Terminal 3: Start TypeScript Worker (Workflow + Refund)

```bash
cd multi-lang-demo/ts-worker
npm run worker
```

**Expected output:**
```
TypeScript Worker starting for refund activities and workflows
TypeScript Worker started on queue: MULTI_LANG_TRANSFER_QUEUE
Worker state changed { state: 'RUNNING' }
```

### Terminal 4: Run the Client

```bash
cd multi-lang-demo/ts-worker
npm run client
```

**Expected output:**
```
Starting multi-language money transfer workflow...
Started workflow: multi-lang-transfer-DEMO-001-...
✅ Workflow completed successfully!
Result: Multi-language transfer complete! Withdrawal: W-..., Deposit: D-...
```

## 🔍 How It Works

1. **Client** sends a workflow execution request
2. **TypeScript Workflow** receives the request on `MULTI_LANG_TRANSFER_QUEUE`
3. **Workflow schedules withdrawal** → Routes to `WITHDRAWAL_QUEUE` (Go Worker)
4. **Go Worker** processes withdrawal and returns result
5. **Workflow schedules deposit** → Routes to `DEPOSIT_QUEUE` (Python Worker)  
6. **Python Worker** processes deposit and returns result
7. **Workflow completes** with success or triggers refund if needed

## 🎨 Activity Flow Diagram

```
┌──────────────────┐
│  TypeScript      │
│  Client          │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────┐
│  TypeScript Worker           │
│  Queue: MULTI_LANG_TRANSFER  │
│  - Workflow Orchestrator     │
│  - Refund Activity           │
└─────┬─────────┬──────────────┘
      │         │
      │         └──────────────┐
      ▼                        ▼
┌─────────────┐         ┌──────────────┐
│  Go Worker  │         │ Python Worker│
│  Queue:     │         │ Queue:       │
│  WITHDRAWAL │         │ DEPOSIT      │
└─────────────┘         └──────────────┘
```

## 🐛 Common Issues & Solutions

### Issue: "Module not found: temporalio"
**Solution:**
```bash
cd python-worker
source .venv/bin/activate  # or create: python -m venv .venv
pip install -r requirements.txt
```

### Issue: "Workflow failed: Activity task failed"
**Cause:** Not all workers are running

**Solution:** Make sure **all 3 workers** are started before running the client:
1. ✅ Go worker running
2. ✅ Python worker running  
3. ✅ TypeScript worker running

### Issue: "Unable to connect to Temporal server"
**Solution:**
```bash
cd docker-compose
docker-compose up
```

Wait for Temporal server to be ready (check http://localhost:8080)

### Issue: Go compilation errors
**Solution:**
```bash
cd go-worker
go mod tidy
go run .
```

### Issue: Python "Failed decoding arguments" or "TypeError"
**Cause:** Field name mismatch between languages (camelCase vs snake_case)

**Solution:** This should already be fixed in the code. The Python `PaymentDetails` must use `camelCase` fields (`sourceAccount`, `targetAccount`, `referenceId`) to match TypeScript.

**Note:** This is a critical consideration in cross-language Temporal workflows - data structures must use **consistent field names** across all languages!

## 📊 Monitoring

Visit the Temporal Web UI at **http://localhost:8080** to:
- View workflow execution history
- See which activities were executed by which language worker
- Debug failures with full stack traces
- Monitor task queue polling

## ✅ Success Indicators

You'll know it's working when you see:

**In Go Worker terminal:**
```
Go: Starting withdrawal of $100.00 from account ACC-12345
Go: Withdrawal completed. Transaction ID: W-...
```

**In Python Worker terminal:**
```
Python: Starting deposit of $100.00 to account ACC-67890
Python: Deposit completed. Transaction ID: D-...
```

**In TypeScript Worker terminal:**
```
[multiLanguageMoneyTransfer(...)] Starting multi-language money transfer
[multiLanguageMoneyTransfer(...)] Withdrawal successful: W-...
[multiLanguageMoneyTransfer(...)] Deposit successful: D-...
```

**In Client terminal:**
```
✅ Workflow completed successfully!
Result: Multi-language transfer complete! Withdrawal: W-..., Deposit: D-...
```

## 🎓 Key Takeaways

This demo proves that:
- ✅ Workflows can orchestrate activities across **any language**
- ✅ Task queues enable **language-independent** routing
- ✅ Type safety is maintained through shared data structures
- ✅ Error handling works seamlessly across language boundaries
- ✅ No custom serialization needed - Temporal handles it all

## 🔄 Testing Failure Scenarios

To test the refund flow, you can:
1. Stop the Python worker
2. Run the client
3. Watch the workflow fail on deposit and trigger the TypeScript refund activity

This demonstrates how Temporal handles failures gracefully across multiple language workers!

