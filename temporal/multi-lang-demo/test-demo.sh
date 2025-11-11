#!/bin/bash

echo "🚀 Starting Multi-Language Temporal Demo"
echo "========================================"
echo ""

# Function to check if a process is running
check_process() {
    if pgrep -f "$1" > /dev/null; then
        echo "✅ $2 is running"
        return 0
    else
        echo "❌ $2 is NOT running"
        return 1
    fi
}

# Check if Temporal is running
echo "🔍 Checking prerequisites..."
if ! curl -s http://localhost:7233 > /dev/null; then
    echo "❌ Temporal Server is not running!"
    echo "Please start Temporal Server first:"
    echo "  cd docker-compose && docker-compose up"
    exit 1
else
    echo "✅ Temporal Server is running"
fi

echo ""
echo "📋 Instructions:"
echo "Please open 4 separate terminals and run these commands:"
echo ""
echo "Terminal 1 - Go Worker:"
echo "  cd $(pwd)/go-worker && go run ."
echo ""
echo "Terminal 2 - Python Worker:"
echo "  cd $(pwd)/python-worker && python worker.py"
echo ""
echo "Terminal 3 - TypeScript Worker:"
echo "  cd $(pwd)/ts-worker && npm run worker"
echo ""
echo "Terminal 4 - Client (run after all workers are ready):"
echo "  cd $(pwd)/ts-worker && npm run client"
echo ""
echo "🔍 Monitoring:"
echo "Watch the workflow at: http://localhost:8080"
echo ""
echo "Expected flow:"
echo "1. Client starts workflow"
echo "2. TypeScript workflow orchestrates"
echo "3. Go worker handles withdrawal"
echo "4. Python worker handles deposit"
echo "5. TypeScript worker handles refund if needed"
echo ""