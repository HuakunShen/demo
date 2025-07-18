import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { SimpleLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

const serviceName = 'order-processor-consumer';

// Set service name environment variable to ensure proper identification
process.env.OTEL_SERVICE_NAME = serviceName;
const OTEL_HOST = process.env.OTEL_HOST || 'localhost';
const OTEL_TRACE_URL = `http://${OTEL_HOST}:4318/v1/traces`
const OTEL_LOG_URL = `http://${OTEL_HOST}:4318/v1/logs`
console.table({
  OTEL_TRACE_URL,
  OTEL_LOG_URL,
})

// Initialize OpenTelemetry with auto-instrumentations
const sdk = new NodeSDK({
  serviceName: serviceName,
  traceExporter: new OTLPTraceExporter({
    url: OTEL_TRACE_URL,
  }),
  logRecordProcessor: new SimpleLogRecordProcessor(
    new OTLPLogExporter({
      url: OTEL_LOG_URL,
    })
  ),
  instrumentations: [
    getNodeAutoInstrumentations({
      // Configure Winston instrumentation
      '@opentelemetry/instrumentation-winston': {
        // // Disable automatic log sending since we're using the transport directly
        // disableLogSending: true,
        // // Enable log correlation to add trace context
        // logHook: (span: any, record: any) => {
        //   record['service.name'] = serviceName;
        //   record['service.version'] = '1.0.0';
        // },
      },
      // Configure AMQP instrumentation
      '@opentelemetry/instrumentation-amqplib': {
        publishHook: (span: any, publishInfo: any) => {
          span.setAttributes({
            'messaging.system': 'rabbitmq',
            'messaging.destination.name': publishInfo.exchange || publishInfo.routingKey || 'default',
            'messaging.operation': 'publish',
          });
        },
        consumeHook: (span: any, msg: any) => {
          span.setAttributes({
            'messaging.system': 'rabbitmq',
            'messaging.operation': 'receive',
          });
        },
      },
      // HTTP instrumentation will automatically handle any HTTP clients
      '@opentelemetry/instrumentation-http': {
        // You can add custom configuration here if needed
      },
    })
  ],
});

// Start the SDK
sdk.start();

console.log('OpenTelemetry initialized for', serviceName, 'with auto-instrumentations');

export { sdk }; 