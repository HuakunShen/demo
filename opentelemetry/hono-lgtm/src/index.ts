import { Hono } from 'hono'
import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
// import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-grpc";
// import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-proto";
import { SimpleLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { WinstonInstrumentation } from "@opentelemetry/instrumentation-winston";
import { AmqplibInstrumentation } from "@opentelemetry/instrumentation-amqplib";
import { trace } from "@opentelemetry/api";
import * as winston from 'winston';
import { OpenTelemetryTransportV3 } from '@opentelemetry/winston-transport';
import * as amqp from 'amqplib';

const serviceName = 'hono-lgtm-publisher';

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
      // Disable automatic log sending since we'll use the transport directly
      disableLogSending: true,
      // Enable log correlation to add trace context
      logHook: (span: any, record: any) => {
        record['service.name'] = serviceName;
        record['service.version'] = '1.0.0';
      },
    }),
    new AmqplibInstrumentation({
      // Enable publishing hooks for better tracing
      publishHook: (span: any, publishInfo: any) => {
        span.setAttributes({
          'messaging.system': 'rabbitmq',
          'messaging.destination.name': publishInfo.exchange || publishInfo.routingKey || 'default',
          'messaging.operation': 'publish',
        });
      },
      // Enable consuming hooks
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

// RabbitMQ connection setup
let connection: amqp.ChannelModel;
let channel: amqp.Channel;

const RABBITMQ_URL = 'amqp://admin:admin@localhost:5672';
const QUEUE_NAME = 'order_events';

async function setupRabbitMQ() {
  try {
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    
    // Ensure queue exists
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    
    logger.info('RabbitMQ connection established');
  } catch (error) {
    logger.error('Failed to connect to RabbitMQ', { error: error instanceof Error ? error.message : 'Unknown error' });
    // Retry after 5 seconds
    setTimeout(setupRabbitMQ, 5000);
  }
}

// Initialize RabbitMQ connection
setupRabbitMQ();

const app = new Hono()

// Get tracer
const tracer = trace.getTracer('hono-lgtm-publisher');

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
      
      return c.text('Hello Hono with Winston + OpenTelemetry + RabbitMQ!');
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

// New route to publish messages to RabbitMQ
app.post('/order', async (c) => {
  return tracer.startActiveSpan('create-order', async (span) => {
    try {
      const body = await c.req.json();
      const orderId = body.orderId || `order-${Date.now()}`;
      const customerId = body.customerId || 'anonymous';
      
      span.setAttributes({
        'http.method': 'POST',
        'http.route': '/order',
        'order.id': orderId,
        'customer.id': customerId,
      });
      
      // Create order event to publish
      const orderEvent = {
        orderId,
        customerId,
        timestamp: new Date().toISOString(),
        status: 'created',
        items: body.items || [],
        total: body.total || 0,
        traceId: span.spanContext().traceId,
        spanId: span.spanContext().spanId
      };
      
      logger.info('Creating new order', { orderId, customerId });
      
      // Publish message to RabbitMQ with distributed tracing
      if (channel) {
        const message = Buffer.from(JSON.stringify(orderEvent));
        await channel.sendToQueue(QUEUE_NAME, message, {
          persistent: true,
          headers: {
            'service': 'hono-lgtm-publisher',
            'operation': 'order-created'
          }
        });
        
        logger.info('Order event published to queue', { 
          orderId, 
          queue: QUEUE_NAME,
          traceId: span.spanContext().traceId 
        });
        
        span.setStatus({ code: 1 });
        return c.json({ 
          success: true,
          orderId, 
          message: 'Order created and event published',
          traceId: span.spanContext().traceId 
        });
      } else {
        throw new Error('RabbitMQ channel not available');
      }
      
    } catch (error) {
      logger.error('Error creating order', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined 
      });
      
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      
      return c.json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }, 500);
    } finally {
      span.end();
    }
  });
})

// Health check endpoint
app.get('/health', (c) => {
  return tracer.startActiveSpan('health-check', (span) => {
    try {
      const isRabbitMQHealthy = !!channel && !!channel.connection
      
      span.setAttributes({
        'health.rabbitmq': isRabbitMQHealthy,
        'health.status': isRabbitMQHealthy ? 'healthy' : 'unhealthy'
      });
      
      if (isRabbitMQHealthy) {
        span.setStatus({ code: 1 });
        return c.json({ 
          status: 'healthy',
          services: {
            rabbitmq: 'connected'
          }
        });
      } else {
        span.setStatus({ code: 2, message: 'RabbitMQ not connected' });
        return c.json({ 
          status: 'unhealthy',
          services: {
            rabbitmq: 'disconnected'
          }
        }, 503);
      }
    } finally {
      span.end();
    }
  });
})

export default app
