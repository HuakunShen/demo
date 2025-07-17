import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { LoggerProvider, SimpleLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { WinstonInstrumentation } from "@opentelemetry/instrumentation-winston";
import { AmqplibInstrumentation } from "@opentelemetry/instrumentation-amqplib";
import { trace, context, propagation } from "@opentelemetry/api";
import { logs } from "@opentelemetry/api-logs";
import * as winston from 'winston';
import { OpenTelemetryTransportV3 } from '@opentelemetry/winston-transport';
import * as amqp from 'amqplib';

// Set service name environment variable to ensure proper identification
process.env.OTEL_SERVICE_NAME = 'order-processor-consumer';

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

// Initialize OpenTelemetry with Winston and AMQP instrumentations
const sdk = new NodeSDK({
  serviceName: 'order-processor-consumer',
  traceExporter: new OTLPTraceExporter({
    url: 'http://localhost:4318/v1/traces',
  }),
  instrumentations: [
    new WinstonInstrumentation({
      disableLogSending: true,
      logHook: (span: any, record: any) => {
        record['service.name'] = 'order-processor-consumer';
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

// Create Winston logger
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
    new OpenTelemetryTransportV3()
  ],
});

const RABBITMQ_URL = 'amqp://admin:admin@localhost:5672';
const QUEUE_NAME = 'order_events';

// Get tracer
const tracer = trace.getTracer('order-processor-consumer');

interface OrderEvent {
  orderId: string;
  customerId: string;
  timestamp: string;
  status: string;
  items: any[];
  total: number;
  traceId?: string;
  spanId?: string;
}

async function processOrder(orderEvent: OrderEvent): Promise<void> {
  return tracer.startActiveSpan('process-order', async (span) => {
    try {
      span.setAttributes({
        'order.id': orderEvent.orderId,
        'customer.id': orderEvent.customerId,
        'order.status': orderEvent.status,
        'order.total': orderEvent.total,
        'order.items.count': orderEvent.items.length,
        'messaging.operation': 'process'
      });

      logger.info('Processing order', {
        orderId: orderEvent.orderId,
        customerId: orderEvent.customerId,
        status: orderEvent.status,
        total: orderEvent.total
      });

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

      // Simulate different processing outcomes
      const shouldFail = Math.random() < 0.1; // 10% chance of failure

      if (shouldFail) {
        throw new Error(`Failed to process order ${orderEvent.orderId}: Payment validation failed`);
      }

      // Update order status to processed
      const updatedOrder = {
        ...orderEvent,
        status: 'processed',
        processedAt: new Date().toISOString()
      };

      logger.info('Order processed successfully', {
        orderId: orderEvent.orderId,
        originalStatus: orderEvent.status,
        newStatus: 'processed',
        processingTime: Date.now() - Date.parse(orderEvent.timestamp)
      });

      // Simulate sending confirmation email or notification
      await tracer.startActiveSpan('send-confirmation', async (confirmationSpan) => {
        try {
          confirmationSpan.setAttributes({
            'notification.type': 'email',
            'customer.id': orderEvent.customerId,
            'order.id': orderEvent.orderId
          });

          // Simulate email sending delay
          await new Promise(resolve => setTimeout(resolve, 200));

          logger.info('Order confirmation sent', {
            orderId: orderEvent.orderId,
            customerId: orderEvent.customerId,
            notificationType: 'email'
          });

          confirmationSpan.setStatus({ code: 1 });
        } catch (error) {
          confirmationSpan.recordException(error as Error);
          confirmationSpan.setStatus({ code: 2, message: (error as Error).message });
          throw error;
        } finally {
          confirmationSpan.end();
        }
      });

      span.setStatus({ code: 1 });
    } catch (error) {
      logger.error('Error processing order', {
        orderId: orderEvent.orderId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      throw error;
    } finally {
      span.end();
    }
  });
}

async function startConsumer() {
  try {
    logger.info('Connecting to RabbitMQ...');
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    // Ensure queue exists
    await channel.assertQueue(QUEUE_NAME, { durable: true });

    // Set prefetch to process one message at a time
    await channel.prefetch(1);

    logger.info(`Waiting for messages in queue: ${QUEUE_NAME}`);

    // Start consuming messages
    await channel.consume(QUEUE_NAME, async (msg) => {
      if (msg) {
        return tracer.startActiveSpan('consume-order-event', async (span) => {
          try {
            const messageContent = msg.content.toString();
            const orderEvent: OrderEvent = JSON.parse(messageContent);

            span.setAttributes({
              'messaging.system': 'rabbitmq',
              'messaging.operation': 'receive',
              'messaging.destination.name': QUEUE_NAME,
              'messaging.message.id': msg.properties.messageId || 'unknown',
              'order.id': orderEvent.orderId,
              'message.size': msg.content.length
            });

            // Extract trace context from message headers if available
            const traceHeaders = msg.properties.headers || {};
            
            logger.info('Received order event', {
              orderId: orderEvent.orderId,
              customerId: orderEvent.customerId,
              status: orderEvent.status,
              messageHeaders: Object.keys(traceHeaders)
            });

            // Process the order
            await processOrder(orderEvent);

            // Acknowledge the message
            channel.ack(msg);

            span.setStatus({ code: 1 });
          } catch (error) {
            logger.error('Error consuming message', {
              error: error instanceof Error ? error.message : 'Unknown error',
              stack: error instanceof Error ? error.stack : undefined
            });

            span.recordException(error as Error);
            span.setStatus({ code: 2, message: (error as Error).message });

            // Reject and requeue the message for retry
            channel.nack(msg, false, true);
          } finally {
            span.end();
          }
        });
      }
    });

    // Handle connection close
    connection.on('close', () => {
      logger.warn('RabbitMQ connection closed, attempting to reconnect...');
      setTimeout(startConsumer, 5000);
    });

    // Handle connection error
    connection.on('error', (error) => {
      logger.error('RabbitMQ connection error', { error: error.message });
    });

  } catch (error) {
    logger.error('Failed to start consumer', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    // Retry after 5 seconds
    setTimeout(startConsumer, 5000);
  }
}

// Start the consumer
logger.info('Starting Order Processor Consumer Service...');
startConsumer();

// Keep the process running
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
}); 