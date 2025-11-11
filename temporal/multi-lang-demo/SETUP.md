# Multi-Language Temporal Demo - Complete Setup Guide

## 🎯 Demo Overview

This demo showcases Temporal's **cross-language compatibility** by implementing a money transfer workflow across 3 different programming languages:

- **TypeScript**: Workflow orchestrator + client + refund activity
- **Go**: Withdrawal activity worker
- **Python**: Deposit activity worker

## 📋 Prerequisites

1. **Temporal Server** running on localhost:7233
2. **Go 1.21+** installed
3. **Python 3.8+** with pip
4. **Node.js 16+** and npm

## 🚀 Quick Start

### Step 1: Start Temporal Server

```bash
# From the root directory
cd docker-compose
docker-compose up
```

### Step 2: Setup Dependencies

```bash
# From the multi-lang-demo directory
cd multi-lang-demo

# Install Go dependencies
cd go-worker && go mod tidy && cd ..

# Install Python dependencies
cd python-worker && python -m pip install -r requirements.txt && cd ..

# Install Node.js dependencies
cd ts-worker && npm install && cd ..
```

### Step 3: Start All Workers (in separate terminals)

```bash
# Terminal 1 - Go Worker (Withdrawal Activities)
cd multi-lang-demo/go-worker
go run .

# Terminal 2 - Python Worker (Deposit Activities)
cd multi-lang-demo/python-worker
python worker.py

# Terminal 3 - TypeScript Worker (Refund Activities + Workflow)
cd multi-lang-demo/ts-worker
npm run worker
```

### Step 4: Run the Client

```bash
# Terminal 4 - TypeScript Client
cd multi-lang-demo/ts-worker
npm run client
```

## 🔄 Workflow Flow

1. **Client** (TypeScript) → Sends money transfer request
2. **Workflow** (TypeScript) → Orchestrates the process
3. **Withdrawal** (Go) → Handles withdrawal from source account
4. **Deposit** (Python) → Handles deposit to target account
5. **Refund** (TypeScript) → Handles refund if deposit fails

## 📊 Monitoring

- **Temporal Web UI**: http://localhost:8080
- Watch the workflow execution across different language workers
- See task queue activity for each language

## 🏗️ Architecture Details

### Task Queues
- `MULTI_LANG_TRANSFER_QUEUE`: Main workflow + Refund activities (TypeScript)
- `WITHDRAWAL_QUEUE`: Withdraw activities (Go)
- `DEPOSIT_QUEUE`: Deposit activities (Python)

### Data Flow
All workers share the same `PaymentDetails` and `ActivityResult` structures, ensuring seamless data exchange between languages.

## 🧪 Testing Cross-Language Compatibility

This demo proves that:
- ✅ Workflows can be written in any language
- ✅ Activities can be distributed across languages
- ✅ Type safety is maintained across language boundaries
- ✅ Error handling works seamlessly across languages
- ✅ Task queues coordinate activities regardless of language

## 🔧 Troubleshooting

- **Temporal connection errors**: Ensure Temporal server is running
- **Module not found errors**: Run dependency installation steps
- **Worker not polling**: Check task queue names match exactly