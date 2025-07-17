import { Hono } from 'hono'
import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
// import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-grpc";
// import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-proto";
import { LoggerProvider, SimpleLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { WinstonInstrumentation } from "@opentelemetry/instrumentation-winston";
import { trace } from "@opentelemetry/api";
import { logs } from "@opentelemetry/api-logs";
import * as winston from 'winston';
import { OpenTelemetryTransportV3 } from '@opentelemetry/winston-transport';

// Set up LoggerProvider to export logs to LGTM
const loggerProvider = new LoggerProvider({
  processors: [
    new SimpleLogRecordProcessor(
      new OTLPLogExporter({
        url: 'http://localhost:4318/v1/logs',
      })
    )
  ]
});

// Register the logger provider
logs.setGlobalLoggerProvider(loggerProvider);

// Initialize OpenTelemetry with Winston instrumentation
const sdk = new NodeSDK({
  serviceName: 'hono-lgtm',
  traceExporter: new OTLPTraceExporter({
    url: 'http://localhost:4318/v1/traces',
  }),
  instrumentations: [
    new WinstonInstrumentation({
      // Disable automatic log sending since we'll use the transport directly
      disableLogSending: true,
      // Enable log correlation to add trace context
      logHook: (span: any, record: any) => {
        record['service.name'] = 'hono-lgtm';
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

const app = new Hono()

// Get tracer
const tracer = trace.getTracer('hono-lgtm');

app.get('/', (c) => {
  // Create a span for this request
  return tracer.startActiveSpan('handle-root-request', (span) => {
    try {
      const userAgent = c.req.header('user-agent') || 'unknown';
      
      span.setAttributes({
        'http.method': 'GET',
        'http.route': '/',
        'user.agent': userAgent
      });
      
      // Log with Winston - trace context will be automatically added
      logger.info('Processing root request', {
        method: 'GET',
        route: '/',
        userAgent: userAgent
      });
      
      span.setStatus({ code: 1 }); // OK status
      
      logger.info('Request processed successfully');
      
      return c.text('Hello Hono with Winston + OpenTelemetry!');
    } catch (error) {
      logger.error('Error processing request', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined 
      });
      
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message }); // ERROR status
      throw error;
    } finally {
      span.end();
    }
  });
})

// Add a test route for different log levels
app.get('/test-logs', (c) => {
  return tracer.startActiveSpan('test-logs', (span) => {
    try {
      logger.debug('Debug message from test route');
      logger.info('Info message from test route');
      logger.warn('Warning message from test route');
      logger.error('Error message from test route');
      
      span.setStatus({ code: 1 });
      return c.json({ 
        message: 'Logs sent with different levels',
        traceId: span.spanContext().traceId 
      });
    } finally {
      span.end();
    }
  });
})

export default app
