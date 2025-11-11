#!/bin/bash

echo "🔍 Multi-Language Temporal Demo - Setup Check"
echo "=============================================="
echo ""

ERRORS=0
WARNINGS=0

# Check Temporal Server
echo "Checking Temporal Server..."
if curl -s -f http://localhost:7233 > /dev/null 2>&1 || nc -z localhost 7233 > /dev/null 2>&1; then
    echo "  ✅ Temporal Server is running on localhost:7233"
else
    echo "  ❌ Temporal Server is NOT running"
    echo "     Start it with: cd docker-compose && docker-compose up"
    ((ERRORS++))
fi
echo ""

# Check Temporal Web UI
echo "Checking Temporal Web UI..."
if curl -s -f http://localhost:8080 > /dev/null 2>&1; then
    echo "  ✅ Temporal Web UI is accessible at http://localhost:8080"
else
    echo "  ⚠️  Temporal Web UI is not accessible"
    echo "     This is usually included with Temporal Server"
    ((WARNINGS++))
fi
echo ""

# Check Go
echo "Checking Go..."
if command -v go &> /dev/null; then
    GO_VERSION=$(go version | awk '{print $3}')
    echo "  ✅ Go is installed: $GO_VERSION"
    
    # Check Go worker dependencies
    cd go-worker
    if go list -m all &> /dev/null; then
        echo "  ✅ Go dependencies are ready"
    else
        echo "  ⚠️  Go dependencies might need updating"
        echo "     Run: cd go-worker && go mod tidy"
        ((WARNINGS++))
    fi
    cd ..
else
    echo "  ❌ Go is NOT installed"
    ((ERRORS++))
fi
echo ""

# Check Python
echo "Checking Python..."
if command -v python &> /dev/null || command -v python3 &> /dev/null; then
    PYTHON_CMD=$(command -v python3 &> /dev/null && echo "python3" || echo "python")
    PYTHON_VERSION=$($PYTHON_CMD --version 2>&1)
    echo "  ✅ Python is installed: $PYTHON_VERSION"
    
    # Check for virtual environment
    if [ -d "python-worker/.venv" ]; then
        echo "  ✅ Python virtual environment exists"
        
        # Check if temporalio is installed in venv
        if [ -f "python-worker/.venv/bin/python" ]; then
            if python-worker/.venv/bin/python -c "import temporalio" &> /dev/null; then
                echo "  ✅ temporalio package is installed"
            else
                echo "  ⚠️  temporalio package not found in virtual environment"
                echo "     Run: cd python-worker && source .venv/bin/activate && pip install -r requirements.txt"
                ((WARNINGS++))
            fi
        fi
    else
        echo "  ⚠️  Python virtual environment not found"
        echo "     Create it with: cd python-worker && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
        ((WARNINGS++))
    fi
else
    echo "  ❌ Python is NOT installed"
    ((ERRORS++))
fi
echo ""

# Check Node.js
echo "Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "  ✅ Node.js is installed: $NODE_VERSION"
    
    # Check TypeScript dependencies
    if [ -d "ts-worker/node_modules" ]; then
        echo "  ✅ TypeScript dependencies are installed"
    else
        echo "  ⚠️  TypeScript dependencies not found"
        echo "     Run: cd ts-worker && npm install"
        ((WARNINGS++))
    fi
else
    echo "  ❌ Node.js is NOT installed"
    ((ERRORS++))
fi
echo ""

# Summary
echo "=============================================="
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ ALL CHECKS PASSED!"
    echo ""
    echo "You're ready to run the demo! Follow these steps:"
    echo ""
    echo "1. Terminal 1: cd go-worker && go run ."
    echo "2. Terminal 2: cd python-worker && source .venv/bin/activate && python worker.py"
    echo "3. Terminal 3: cd ts-worker && npm run worker"
    echo "4. Terminal 4: cd ts-worker && npm run client"
    echo ""
    echo "See QUICKSTART.md for detailed instructions."
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  Setup is mostly complete with $WARNINGS warning(s)"
    echo "Review the warnings above and fix them if needed."
else
    echo "❌ Setup is incomplete with $ERRORS error(s) and $WARNINGS warning(s)"
    echo "Please fix the errors above before running the demo."
    exit 1
fi

