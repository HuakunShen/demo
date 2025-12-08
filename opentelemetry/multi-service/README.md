# Multi-Service OpenTelemetry Pattern (Single Process)

This document describes a specific architectural pattern for running multiple logical services within a single Node.js process while maintaining distinct service identities in OpenTelemetry backends (Grafana, Jaeger, etc.).

**Purpose**: Use this document as context for AI assistants to understand how to modify or extend the codebase.

---

## 🧠 Core Principle

### The Problem: Singleton SDK
The standard OpenTelemetry Node.js SDK (`@opentelemetry/sdk-node`) is designed as a singleton. It assumes one process equals one service (`service.name`). If you run multiple logical services (e.g., `UserService`, `OrderService`) in one process, they all get merged under a single service name in your observability platform.

### The Solution: Hybrid Telemetry
To achieve service isolation in a single process, we separate the concerns:

1.  **Traces & Metrics (Global)**: Handled by the singleton `NodeSDK`. These signals are less sensitive to the "service name" override at the root level, or can be managed via child spans.
2.  **Logs (Per-Service)**: Handled by **separate `LoggerProvider` instances**. We bypass the global logger and create a dedicated provider for each service. This allows us to attach a unique `Resource` (with a unique `service.name`) to each logger.

---

## 💻 Implementation Guide

### 1. The `ServiceLogger` Class (Boilerplate)

This is the core utility that enables the pattern. It creates a standalone `LoggerProvider` for any given service name.

```typescript
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import {
  BatchLogRecordProcessor,
  LoggerProvider,
} from "@opentelemetry/sdk-logs";
import { SeverityNumber } from "@opentelemetry/api-logs";
import type { Logger as OtelLogger } from "@opentelemetry/api-logs";

const OTLP_ENDPOINT = process.env.OTLP_ENDPOINT || "http://localhost:4318";

export class ServiceLogger {
  private otelLogger: OtelLogger;
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
    
    // 1. Create a Resource specific to this service
    const resource = resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
      [ATTR_SERVICE_VERSION]: "1.0.0",
    });

    // 2. Create a dedicated LoggerProvider
    const loggerProvider = new LoggerProvider({
      resource,
      processors: [
        new BatchLogRecordProcessor(
          new OTLPLogExporter({ url: `${OTLP_ENDPOINT}/v1/logs` })
        ),
      ],
    });

    // 3. Get the logger
    this.otelLogger = loggerProvider.getLogger(serviceName, "1.0.0");
  }

  // Helper to emit structured logs
  private log(level: SeverityNumber, message: string, attributes: Record<string, any> = {}) {
    const levelName = SeverityNumber[level].replace("SEVERITY_NUMBER_", "");
    
    // Console output for local debugging
    console.log(`[${this.serviceName}] ${levelName}: ${message}`);

    // OTLP Export
    this.otelLogger.emit({
      severityNumber: level,
      severityText: levelName,
      body: message,
      attributes: {
        ...attributes,
        service: this.serviceName, // Redundant but useful
      },
    });
  }

  info(msg: string, attrs?: Record<string, any>) { this.log(SeverityNumber.INFO, msg, attrs); }
  warn(msg: string, attrs?: Record<string, any>) { this.log(SeverityNumber.WARN, msg, attrs); }
  error(msg: string, attrs?: Record<string, any>) { this.log(SeverityNumber.ERROR, msg, attrs); }
}
```

### 2. Global SDK Initialization (Traces & Metrics)

Initialize this **once** at the start of your application `main()` function.

```typescript
import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";

function initializeOTel() {
  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: "multi-service-root", // The root process name
    }),
    traceExporter: new OTLPTraceExporter({ url: `${OTLP_ENDPOINT}/v1/traces` }),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({ url: `${OTLP_ENDPOINT}/v1/metrics` }),
    }),
  });
  sdk.start();
}
```

### 3. Usage in Services

To add a new service, simply instantiate `ServiceLogger` with the desired service name.

```typescript
import { trace } from "@opentelemetry/api";

class PaymentService {
  private logger: ServiceLogger;
  private tracer = trace.getTracer("payment-service");

  constructor() {
    // This string becomes the service name in Grafana
    this.logger = new ServiceLogger("payment-service");
  }

  async process(orderId: string) {
    // Start a span for tracing
    return this.tracer.startActiveSpan("processPayment", (span) => {
      
      // Log with the correct service context
      this.logger.info("Processing payment", { orderId });
      
      // ... business logic ...
      
      span.end();
    });
  }
}
```

---

## 🔍 How to Modify This Code

If you are an AI assistant modifying this codebase:

1.  **Adding a Service**: Create a new class. Initialize `ServiceLogger` with a unique string (e.g., `"inventory-service"`). Do NOT use the global logger.
2.  **Adding Logs**: Use `this.logger.info/warn/error`. Always pass a structured object as the second argument for metadata.
3.  **Adding Traces**: Use `this.tracer.startActiveSpan("operationName", (span) => { ... })`.
4.  **Changing Configuration**: Modify `createServiceLoggerProvider` or `ServiceLogger` to change export intervals or endpoints.
