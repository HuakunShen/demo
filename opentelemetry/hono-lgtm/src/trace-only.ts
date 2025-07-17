import { Hono } from 'hono'
import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { trace } from "@opentelemetry/api";

// Initialize OpenTelemetry with basic configuration
const sdk = new NodeSDK({
  serviceName: 'hono-lgtm',
  traceExporter: new OTLPTraceExporter({
    url: 'http://localhost:4318/v1/traces',
  }),
});

// Start the SDK
sdk.start();

const app = new Hono()

// Get tracer
const tracer = trace.getTracer('hono-lgtm');

app.get('/', (c) => {
  // Create a span for this request
  return tracer.startActiveSpan('handle-root-request', (span) => {
    try {
      span.setAttributes({
        'http.method': 'GET',
        'http.route': '/',
        'user.agent': c.req.header('user-agent') || 'unknown'
      });

      console.log('Processing root request with trace:', span.spanContext().traceId);

      span.setStatus({ code: 1 }); // OK status
      return c.text('Hello Hono!');
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message }); // ERROR status
      throw error;
    } finally {
      span.end();
    }
  });
})

export default app
