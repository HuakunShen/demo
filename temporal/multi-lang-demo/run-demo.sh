#!/bin/bash

echo "🚀 Multi-Language Temporal Demo"
echo "================================"
echo ""
echo "This demo showcases Temporal's cross-language capabilities with:"
echo "  • TypeScript: Workflow orchestrator + refund activity + client"
echo "  • Go: Withdrawal activity worker"
echo "  • Python: Deposit activity worker"
echo ""
echo "📋 Prerequisites:"
echo "  1. Temporal Server running on localhost:7233"
echo "  2. Go 1.21+ installed"
echo "  3. Python 3.8+ with pip"
echo "  4. Node.js 16+ and npm"
echo ""

# Function to run command in background and show pid
run_bg() {
    echo "Starting: $1"
    $2 &
    echo "PID: $!"
    echo ""
}

# Check if Temporal is running
echo "🔍 Checking Temporal Server..."
if ! curl -s http://localhost:7233 > /dev/null; then
    echo "❌ Temporal Server is not running!"
    echo "Please start Temporal Server first:"
    echo "  cd docker-compose && docker-compose up"
    exit 1
else
    echo "✅ Temporal Server is running"
fi
echo ""

echo "🛠️  Setting up dependencies..."

# Setup Go dependencies
echo "Installing Go dependencies..."
cd go-worker && go mod tidy && cd ..

# Setup Python dependencies
echo "Installing Python dependencies..."
cd python-worker && python -m pip install -r requirements.txt && cd ..

# Setup Node.js dependencies
echo "Installing Node.js dependencies..."
cd ts-worker && npm install && cd ..

echo ""
echo "✅ Dependencies installed!"
echo ""

echo "🎬 Starting Multi-Language Demo..."
echo ""
echo "Please open 4 separate terminals and run:"
echo ""
echo "Terminal 1 - Go Worker (Withdrawal):"
echo "  cd multi-lang-demo/go-worker && go run worker.go"
echo ""
echo "Terminal 2 - Python Worker (Deposit):"
echo "  cd multi-lang-demo/python-worker && python worker.py"
echo ""
echo "Terminal 3 - TypeScript Worker (Refund + Workflow):"
echo "  cd multi-lang-demo/ts-worker && npm run worker"
echo ""
echo "Terminal 4 - Client (starts the workflow):"
echo "  cd multi-lang-demo/ts-worker && npm run client"
echo ""
echo "📊 Monitor the workflow at: http://localhost:8080"
echo ""
echo "The workflow will demonstrate:"
echo "  1. Client sends request to TypeScript workflow"
echo "  2. Workflow calls Go worker for withdrawal"
echo "  3. Workflow calls Python worker for deposit"
echo "  4. If deposit fails, TypeScript worker handles refund"
echo ""