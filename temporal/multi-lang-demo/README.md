# Multi-Language Temporal Demo

This demo showcases Temporal's cross-language compatibility by implementing a money transfer workflow across multiple programming languages.

> 📚 **New to this demo?** Start with **[QUICKSTART.md](./QUICKSTART.md)** for detailed step-by-step instructions!
> 
> 🐛 **Having issues?** Check **[FIXES_APPLIED.md](./FIXES_APPLIED.md)** for common problems and solutions.
>
> 🐍 **Python errors?** See **[PYTHON_FIX.md](./PYTHON_FIX.md)** for the critical field naming fix!
>
> 🚀 **Performance testing?** See **[STRESS_TESTING.md](./STRESS_TESTING.md)** for stress tests and latency measurements!

## Architecture

- **TypeScript**: Workflow orchestrator + client + refund activity
- **Go**: Withdrawal activity worker
- **Python**: Deposit activity worker

## Task Queues

- `MULTI_LANG_TRANSFER_QUEUE`: Main workflow queue + Refund activity (TypeScript)
- `WITHDRAWAL_QUEUE`: Withdraw activity queue (Go)
- `DEPOSIT_QUEUE`: Deposit activity queue (Python)

## Running the Demo

1. Start all workers in separate terminals:
   ```bash
   # Terminal 1: Go worker
   cd go-worker && go run worker.go

   # Terminal 2: Python worker
   cd python-worker && python worker.py

   # Terminal 3: TypeScript worker
   cd ts-worker && npm run worker
   ```

2. Run the client in another terminal:
   ```bash
   cd ts-worker && npm run client
   ```

The workflow will coordinate across all three languages to complete the money transfer.