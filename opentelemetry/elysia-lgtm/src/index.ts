import { Elysia, t } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { opentelemetry } from "@elysiajs/opentelemetry";

// OpenTelemetry SDK imports
import { NodeSDK } from "@opentelemetry/sdk-node";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { OTLPTraceExporter as OTLPTraceExporterHTTP } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { SimpleLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { WinstonInstrumentation } from "@opentelemetry/instrumentation-winston";
import { trace, SpanStatusCode } from "@opentelemetry/api";
import * as winston from 'winston';
import { OpenTelemetryTransportV3 } from '@opentelemetry/winston-transport';

const OTLP_HOST = process.env.OTLP_HOST || "localhost";
const serviceName = "Elysia Otel";

// Set service name environment variable to ensure proper identification
process.env.OTEL_SERVICE_NAME = serviceName;

// Create multiple exporters for different endpoints
const lgtmTraceExporter = new OTLPTraceExporter({
  url: `http://${OTLP_HOST}:4318/v1/traces`,
});

const jaegerTraceExporter = new OTLPTraceExporterHTTP({
  url: `http://${OTLP_HOST}:4319/v1/traces`,
});

const lgtmLogExporter = new OTLPLogExporter({
  url: `http://${OTLP_HOST}:4318/v1/logs`,
});

// Create span processors for multiple exporters
const spanProcessors = [
  new BatchSpanProcessor(lgtmTraceExporter),
  new BatchSpanProcessor(jaegerTraceExporter),
];

// Initialize OpenTelemetry SDK with Winston instrumentation and log processor
const sdk = new NodeSDK({
  serviceName,
  spanProcessors,
  logRecordProcessor: new SimpleLogRecordProcessor(lgtmLogExporter),
  instrumentations: [
    new WinstonInstrumentation({
      // Disable automatic log sending since we'll use the transport directly
      disableLogSending: true,
      // Enable log correlation to add trace context
      logHook: (span: any, record: any) => {
        record['service.name'] = serviceName;
        record['service.version'] = '1.0.0';
      },
    }),
  ],
});

// Start the SDK
sdk.start();

// Create Winston logger with OpenTelemetry transport
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Add OpenTelemetry transport to send logs via OTLP
    new OpenTelemetryTransportV3()
  ],
});

const appTracer = trace.getTracer(serviceName, "1.0.0");

// Function to simulate database query
function simulateDatabaseQuery() {
  const span = appTracer.startSpan("database-query");
  span.setAttributes({
    "db.system": "postgresql",
    "db.operation": "SELECT",
    "db.table": "users"
  });

  try {
    logger.info('Starting database query for users', {
      operation: 'database-query',
      table: 'users'
    });

    // Simulate some work
    const startTime = Date.now();
    while (Date.now() - startTime < 50) {
      // Busy wait to simulate processing
    }

    const queryTime = Date.now() - startTime;
    
    span.addEvent("query_executed", {
      "db.rows_returned": 5,
      "db.query_time_ms": queryTime
    });

    logger.info('Database query completed successfully', {
      queryTimeMs: queryTime,
      rowsReturned: 5,
      operation: 'database-query'
    });

    span.setStatus({ code: SpanStatusCode.OK });
    return { users: ["user1", "user2", "user3", "user4", "user5"] };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: errorMessage });
    
    logger.error('Database query failed', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      operation: 'database-query'
    });
    
    throw error;
  } finally {
    span.end();
  }
}

// Function to simulate external API call
function simulateExternalApiCall() {
  const span = appTracer.startSpan("external-api-call");
  span.setAttributes({
    "http.method": "GET",
    "http.url": "https://api.external.com/data",
    "http.target": "/data"
  });

  try {
    logger.info('Making external API call', {
      url: 'https://api.external.com/data',
      method: 'GET',
      operation: 'external-api-call'
    });

    // Simulate network delay
    const startTime = Date.now();
    while (Date.now() - startTime < 100) {
      // Busy wait to simulate network delay
    }

    const responseTime = Date.now() - startTime;
    
    span.addEvent("api_response_received", {
      "http.status_code": 200,
      "response_time_ms": responseTime
    });

    logger.info('External API call completed successfully', {
      responseTimeMs: responseTime,
      statusCode: 200,
      operation: 'external-api-call'
    });

    span.setStatus({ code: SpanStatusCode.OK });
    return { data: "external data", timestamp: new Date().toISOString() };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: errorMessage });
    
    logger.error('External API call failed', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      operation: 'external-api-call'
    });
    
    throw error;
  } finally {
    span.end();
  }
}

// Function to process business logic
function processBusinessLogic(dbData: { users: string[] }, apiData: { data: string; timestamp: string }) {
  const span = appTracer.startSpan("business-logic-processing");
  span.setAttributes({
    "business.operation": "data_aggregation",
    "business.domain": "user_management"
  });

  try {
    logger.info('Starting business logic processing', {
      operation: 'business-logic-processing',
      domain: 'user_management'
    });

    span.addEvent("processing_started");

    // Simulate processing time
    const startTime = Date.now();
    while (Date.now() - startTime < 30) {
      // Busy wait to simulate processing
    }

    const processingTime = Date.now() - startTime;
    
    const result = {
      userCount: dbData.users.length,
      externalDataTimestamp: apiData.timestamp,
      processedAt: new Date().toISOString()
    };

    span.addEvent("processing_completed", {
      "processed_items": result.userCount,
      "processing_time_ms": processingTime
    });

    logger.info('Business logic processing completed successfully', {
      processingTimeMs: processingTime,
      processedItems: result.userCount,
      operation: 'business-logic-processing'
    });

    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: errorMessage });
    
    logger.error('Business logic processing failed', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      operation: 'business-logic-processing'
    });
    
    throw error;
  } finally {
    span.end();
  }
}

const app = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: "Elysia Documentation",
          version: "1.0.0",
        },
      },
    })
  )
  .use(swagger())
  .use(
    opentelemetry({
      spanProcessors: spanProcessors,
    })
  )
  .get(
    "/",
    () => {
      const span = appTracer.startSpan("root-request-handler");
      span.setAttributes({
        "http.route": "/",
        "http.method": "GET"
      });

      try {
        logger.info('Root request handler started', {
          route: '/',
          method: 'GET',
          operation: 'root-request-handler'
        });

        span.addEvent("request_started");
        console.log("hi");

        // Call nested functions to create trace hierarchy
        const dbData = simulateDatabaseQuery();
        const apiData = simulateExternalApiCall();
        const processedData = processBusinessLogic(dbData, apiData);

        const responseSize = JSON.stringify(processedData).length;
        
        span.addEvent("request_completed", {
          "response_size": responseSize
        });

        logger.info('Root request completed successfully', {
          responseSizeBytes: responseSize,
          operation: 'root-request-handler'
        });

        span.setStatus({ code: SpanStatusCode.OK });
        return {
          message: "hi",
          data: processedData
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: errorMessage });
        
        logger.error('Root request failed', {
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
          operation: 'root-request-handler'
        });
        
        throw error;
      } finally {
        span.end();
      }
    },
    {
      response: t.Object({
        message: t.String({ description: "Greeting message" }),
        data: t.Object({
          userCount: t.Number({ description: "Number of users" }),
          externalDataTimestamp: t.String({ description: "External API timestamp" }),
          processedAt: t.String({ description: "Processing timestamp" })
        }, { description: "Processed data" })
      }, { description: "Root endpoint response with nested trace data" }),
    }
  )
  .post(
    "/json/:id",
    ({ body, params: { id }, query: { name } }) => ({
      ...body,
      id,
      name,
    }),
    {
      params: t.Object({
        id: t.String(),
      }),
      query: t.Object({
        name: t.String(),
      }),
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
      response: t.Object(
        {
          username: t.String(),
          password: t.String(),
          id: t.String(),
          name: t.String(),
        },
        { description: "sample description" }
      ),
    }
  )
  .listen(3000);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  sdk.shutdown().then(() => {
    console.log('OpenTelemetry SDK shut down successfully');
    process.exit(0);
  }).catch((error) => {
    console.error('Error shutting down OpenTelemetry SDK:', error);
    process.exit(1);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  sdk.shutdown().then(() => {
    console.log('OpenTelemetry SDK shut down successfully');
    process.exit(0);
  }).catch((error) => {
    console.error('Error shutting down OpenTelemetry SDK:', error);
    process.exit(1);
  });
});
