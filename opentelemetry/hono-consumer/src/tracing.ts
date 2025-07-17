import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { SimpleLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { WinstonInstrumentation } from "@opentelemetry/instrumentation-winston";
import { AmqplibInstrumentation } from "@opentelemetry/instrumentation-amqplib";
const serviceName = 'order-processor-consumer';

// Set service name environment variable to ensure proper identification
process.env.OTEL_SERVICE_NAME = serviceName;

// Initialize OpenTelemetry with Winston and AMQP instrumentations
const sdk = new NodeSDK({
  serviceName: serviceName,
  traceExporter: new OTLPTraceExporter({
    url: 'http://localhost:4318/v1/traces',
  }),
  logRecordProcessor: new SimpleLogRecordProcessor(
    new OTLPLogExporter({
      url: 'http://localhost:4318/v1/logs',
    })
  ),
  instrumentations: [
    new WinstonInstrumentation({
      disableLogSending: true,
      logHook: (span: any, record: any) => {
        record['service.name'] = serviceName;
        record['service.version'] = '1.0.0';
      },
    }),
    new AmqplibInstrumentation({
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
    }),
  ],
});

// Start the SDK
sdk.start();

console.log('OpenTelemetry initialized for', serviceName);

export { sdk }; 