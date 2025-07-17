#!/bin/bash

echo "Testing Distributed Tracing between Hono Publisher and Consumer"
echo "============================================================="

# Test 1: Basic health check
echo -e "\n1. Testing Publisher Health:"
curl -s http://localhost:3000/health | jq '.'

# Test 2: Create an order to trigger distributed trace
echo -e "\n2. Creating Order (this will trigger distributed tracing):"
response=$(curl -s -X POST http://localhost:3000/order \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "test-customer-123", 
    "items": [
      {"id": "item-1", "name": "Test Product", "price": 29.99, "quantity": 2}
    ],
    "total": 59.98
  }')

echo "$response" | jq '.'

# Extract trace ID from response for reference
trace_id=$(echo "$response" | jq -r '.traceId')
echo -e "\nTrace ID: $trace_id"

# Test 3: Test logs endpoint
echo -e "\n3. Testing Log Levels:"
curl -s http://localhost:3000/test-logs | jq '.'

echo -e "\n4. Instructions to view traces:"
echo "   - LGTM/Grafana: http://localhost:3010 → Explore → Tempo → Search traces"
echo "   - Filter by service: 'hono-lgtm-publisher' or 'order-processor-consumer'"
echo "   - Look for trace ID: $trace_id"
echo ""
echo "   - Jaeger UI: http://localhost:16686"
echo "   - Select service and click 'Find Traces'"
echo ""
echo "   - RabbitMQ Management: http://localhost:15672 (admin/admin)"

echo -e "\nDistributed trace should show:"
echo "   1. HTTP Request → hono-lgtm-publisher"
echo "   2. Message Publish → RabbitMQ queue"
echo "   3. Message Consume → order-processor-consumer"
echo "   4. Order Processing → business logic"
echo "   5. Confirmation Send → notification" 