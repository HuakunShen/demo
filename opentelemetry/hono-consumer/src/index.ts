// IMPORTANT: Import tracing setup FIRST before any other imports
import './tracing';

import { trace, context, propagation, SpanKind } from "@opentelemetry/api";
import * as winston from 'winston';
import { OpenTelemetryTransportV3 } from '@opentelemetry/winston-transport';
import * as amqp from 'amqplib';

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
    // new OpenTelemetryTransportV3()
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
  return tracer.startActiveSpan('process-order', { kind: SpanKind.INTERNAL }, async (span) => {
    try {
      span.setAttributes({
        'service.name': 'order-processor-consumer',
        'order.id': orderEvent.orderId,
        'customer.id': orderEvent.customerId,
        'order.status': orderEvent.status,
        'order.total': orderEvent.total,
        'order.items.count': orderEvent.items.length,
        'business.operation': 'process-order'
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
      await tracer.startActiveSpan('send-confirmation', { kind: SpanKind.CLIENT }, async (confirmationSpan) => {
        try {
          confirmationSpan.setAttributes({
            'service.name': 'order-processor-consumer',
            'notification.type': 'email',
            'customer.id': orderEvent.customerId,
            'order.id': orderEvent.orderId,
            'http.method': 'POST',
            'http.url': 'https://api.email-service.com/send',
            'operation': 'send-notification'
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
        // Extract trace context from message headers to continue distributed trace
        const messageHeaders = msg.properties.headers || {};
        const parentContext = propagation.extract(context.active(), messageHeaders);
        
        // Start span within the extracted context to continue the distributed trace
        return context.with(parentContext, () => {
          return tracer.startActiveSpan('consume-order-event', { kind: SpanKind.CONSUMER }, async (span) => {
            try {
              const messageContent = msg.content.toString();
              const orderEvent: OrderEvent = JSON.parse(messageContent);

              span.setAttributes({
                'service.name': 'order-processor-consumer',
                'messaging.system': 'rabbitmq',
                'messaging.operation': 'receive',
                'messaging.destination.name': QUEUE_NAME,
                'messaging.destination.kind': 'queue',
                'messaging.message.id': msg.properties.messageId || 'unknown',
                'messaging.message.body.size': msg.content.length,
                'order.id': orderEvent.orderId
              });
              
              logger.info('Received order event', {
                orderId: orderEvent.orderId,
                customerId: orderEvent.customerId,
                status: orderEvent.status,
                messageHeaders: Object.keys(messageHeaders),
                traceId: span.spanContext().traceId
              });

              // Process the order (this will inherit the trace context)
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