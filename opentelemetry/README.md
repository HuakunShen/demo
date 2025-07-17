# OpenTelemetry Distributed Tracing with RabbitMQ

This project demonstrates distributed tracing across microservices using OpenTelemetry, RabbitMQ, and LGTM stack.

## Architecture

The setup includes:

1. **LGTM Stack** (Grafana, Loki, Tempo, Mimir) - Observability platform
2. **Jaeger** - Alternative tracing UI
3. **RabbitMQ** - Message queue for inter-service communication
4. **Hono Publisher Service** - Web API that publishes order events to RabbitMQ
5. **Order Processor Consumer** - Background service that consumes and processes orders

## Services

### Publisher Service (`hono-lgtm/`)
- **Port**: 3000
- **Framework**: Hono
- **Purpose**: REST API that creates orders and publishes events to RabbitMQ
- **OpenTelemetry**: Traces HTTP requests and message publishing

### Consumer Service (`hono-consumer/`)
- **Purpose**: Processes order events from RabbitMQ queue
- **OpenTelemetry**: Traces message consumption and order processing
- **Features**: Simulates order processing, confirmation emails, and error handling

## Getting Started

### 1. Start Infrastructure

```bash
# Start LGTM, Jaeger, and RabbitMQ
docker-compose up -d

# Wait for services to be ready (especially RabbitMQ)
sleep 30
```

### 2. Install Dependencies

```bash
# Install publisher service dependencies
cd hono-lgtm
bun install

# Install consumer service dependencies  
cd ../hono-consumer
bun install
```

### 3. Start Services

```bash
# Terminal 1: Start the publisher service
cd hono-lgtm
bun run dev

# Terminal 2: Start the consumer service
cd hono-consumer  
bun run dev
```

## Testing Distributed Tracing

### 1. Create Orders

```bash
# Create a simple order
curl -X POST http://localhost:3000/order \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer-123",
    "items": [
      {"id": "item-1", "name": "Widget", "price": 10.99, "quantity": 2}
    ],
    "total": 21.98
  }'

# Create multiple orders to see different traces
curl -X POST http://localhost:3000/order \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer-456", 
    "items": [
      {"id": "item-2", "name": "Gadget", "price": 25.00, "quantity": 1}
    ],
    "total": 25.00
  }'
```

### 2. Check Service Health

```bash
# Check publisher health
curl http://localhost:3000/health

# Basic endpoints
curl http://localhost:3000/
curl http://localhost:3000/test-logs
```

### 3. View Traces

**LGTM Stack (Grafana):**
- URL: http://localhost:3010
- Navigate to: Explore → Tempo → Search traces
- Filter by service: `hono-lgtm-publisher` or `order-processor-consumer`

**Jaeger UI:**
- URL: http://localhost:16686
- Select service: `hono-lgtm-publisher` or `order-processor-consumer`
- Click "Find Traces"

**RabbitMQ Management:**
- URL: http://localhost:15672
- Username: `admin`
- Password: `admin`

## What You'll See in Traces

### Complete Distributed Trace Flow:
1. **HTTP Request** → Publisher service receives POST /order
2. **Message Publishing** → Event sent to RabbitMQ queue  
3. **Message Consumption** → Consumer receives message from queue
4. **Order Processing** → Business logic processing
5. **Confirmation Sending** → Email notification simulation

### Trace Attributes:
- HTTP method, route, user agent
- Order ID, customer ID, order total
- Messaging system details (RabbitMQ)
- Queue names, message sizes
- Processing times and status codes
- Error details when failures occur

### Log Correlation:
- All logs include trace context
- Filter logs by trace ID to see complete flow
- Structured logging with OpenTelemetry transport

## Key Features Demonstrated

### 1. **Distributed Tracing**
- Traces span across HTTP → RabbitMQ → Background processing
- Parent-child span relationships maintained
- Trace context propagation through message headers

### 2. **Message Queue Instrumentation**
- Automatic amqplib instrumentation
- Message publishing and consuming traced
- Queue metrics and message attributes

### 3. **Error Handling & Observability**
- Failed message processing (10% simulation)
- Exception tracking in spans
- Retry logic with message requeuing

### 4. **Multi-Service Architecture**
- Independent services with different concerns
- Asynchronous processing patterns
- Service health monitoring

## Troubleshooting

### RabbitMQ Connection Issues
```bash
# Check if RabbitMQ is running
docker ps | grep rabbitmq

# Check RabbitMQ logs
docker logs rabbitmq

# Restart RabbitMQ if needed
docker-compose restart rabbitmq
```

### Service Dependencies
```bash
# Reinstall dependencies if needed
cd hono-lgtm && bun install
cd hono-consumer && bun install
```

### View Service Logs
```bash
# Both services log to console with structured JSON
# Look for trace IDs to correlate logs with traces
```

## Advanced Usage

### Generate Load
```bash
# Generate multiple orders quickly
for i in {1..10}; do
  curl -X POST http://localhost:3000/order \
    -H "Content-Type: application/json" \
    -d "{\"customerId\":\"load-test-$i\",\"items\":[{\"id\":\"item-$i\",\"price\":10}],\"total\":10}"
  sleep 1
done
```

### Monitor Queue Metrics
- Check queue depth and message rates in RabbitMQ Management UI
- Monitor processing times in trace data
- Observe error rates and retry patterns

This setup provides a comprehensive example of distributed tracing in a microservices architecture with message queues, demonstrating real-world observability patterns. 