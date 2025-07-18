// IMPORTANT: Import tracing setup FIRST before any other imports
import "./tracing";

import { Hono } from "hono";
import { otel } from "@hono/otel";
import { trace, propagation, context, SpanKind } from "@opentelemetry/api";
import * as winston from "winston";
import { OpenTelemetryTransportV3 } from "@opentelemetry/winston-transport";
import * as amqp from "amqplib";

// Create Winston logger with OpenTelemetry transport
const logger = winston.createLogger({
  level: "info",
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
      ),
    }),
    // Add OpenTelemetry transport to send logs via OTLP
    new OpenTelemetryTransportV3()
  ],
});

// RabbitMQ connection setup
let connection: amqp.ChannelModel;
let channel: amqp.Channel;

const RABBITMQ_URL = "amqp://admin:admin@localhost:5672";
const QUEUE_NAME = "order_events";

async function setupRabbitMQ() {
  try {
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();

    // Ensure queue exists
    await channel.assertQueue(QUEUE_NAME, { durable: true });

    logger.info("RabbitMQ connection established");
  } catch (error) {
    logger.error("Failed to connect to RabbitMQ", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    // Retry after 5 seconds
    setTimeout(setupRabbitMQ, 5000);
  }
}

// Initialize RabbitMQ connection
setupRabbitMQ();

const app = new Hono()
.use(otel());

// Get tracer
const tracer = trace.getTracer("hono-lgtm-publisher");

app.get("/", (c) => {
  // Create a span for this request
  return tracer.startActiveSpan(
    "handle-root-request",
    { kind: SpanKind.SERVER },
    (span) => {
      try {
        const userAgent = c.req.header("user-agent") || "unknown";

        span.setAttributes({
          "service.name": "hono-lgtm-publisher",
          "http.method": "GET",
          "http.route": "/",
          "http.scheme": "http",
          "http.target": "/",
          "user_agent.original": userAgent,
        });

        // Log with Winston - trace context will be automatically added
        logger.info("Processing root request", {
          method: "GET",
          route: "/",
          userAgent: userAgent,
        });

        span.setStatus({ code: 1 }); // OK status

        logger.info("Request processed successfully");

        return c.text("Hello Hono with Winston + OpenTelemetry + RabbitMQ!");
      } catch (error) {
        logger.error("Error processing request", {
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        });

        span.recordException(error as Error);
        span.setStatus({ code: 2, message: (error as Error).message }); // ERROR status
        throw error;
      } finally {
        span.end();
      }
    }
  );
});

// Add a test route for different log levels
app.get("/test-logs", (c) => {
  return tracer.startActiveSpan(
    "test-logs",
    { kind: SpanKind.SERVER },
    (span) => {
      try {
        span.setAttributes({
          "service.name": "hono-lgtm-publisher",
          "http.method": "GET",
          "http.route": "/test-logs",
          "http.scheme": "http",
          "http.target": "/test-logs",
        });

        logger.debug("Debug message from test route");
        logger.info("Info message from test route");
        logger.warn("Warning message from test route");
        logger.error("Error message from test route");

        span.setStatus({ code: 1 });
        return c.json({
          message: "Logs sent with different levels",
          traceId: span.spanContext().traceId,
        });
      } finally {
        span.end();
      }
    }
  );
});

// New route to publish messages to RabbitMQ
app.post("/order", async (c) => {
  return tracer.startActiveSpan(
    "create-order",
    { kind: SpanKind.SERVER },
    async (span) => {
      try {
        const body = await c.req.json();
        const orderId = body.orderId || `order-${Date.now()}`;
        const customerId = body.customerId || "anonymous";

        span.setAttributes({
          "service.name": "hono-lgtm-publisher",
          "http.method": "POST",
          "http.route": "/order",
          "http.scheme": "http",
          "http.target": "/order",
          "order.id": orderId,
          "customer.id": customerId,
        });

        // Create order event to publish
        const orderEvent = {
          orderId,
          customerId,
          timestamp: new Date().toISOString(),
          status: "created",
          items: body.items || [],
          total: body.total || 0,
          traceId: span.spanContext().traceId,
          spanId: span.spanContext().spanId,
        };

        logger.info("Creating new order", { orderId, customerId });

        // Publish message to RabbitMQ with distributed tracing
        if (channel) {
          // Create producer span for message publishing
          await tracer.startActiveSpan(
            "publish-order-event",
            { kind: SpanKind.PRODUCER },
            async (publishSpan) => {
              try {
                publishSpan.setAttributes({
                  "service.name": "hono-lgtm-publisher",
                  "messaging.system": "rabbitmq",
                  "messaging.destination.name": QUEUE_NAME,
                  "messaging.operation": "publish",
                  "messaging.destination.kind": "queue",
                  "order.id": orderId,
                });

                const message = Buffer.from(JSON.stringify(orderEvent));

                // Inject trace context into message headers for distributed tracing
                const headers: Record<string, any> = {
                  service: "hono-lgtm-publisher",
                  operation: "order-created",
                };

                // Inject current trace context into headers
                propagation.inject(context.active(), headers);

                await channel.sendToQueue(QUEUE_NAME, message, {
                  persistent: true,
                  headers,
                });

                publishSpan.setStatus({ code: 1 });
              } catch (error) {
                publishSpan.recordException(error as Error);
                publishSpan.setStatus({
                  code: 2,
                  message: (error as Error).message,
                });
                throw error;
              } finally {
                publishSpan.end();
              }
            }
          );

          logger.info("Order event published to queue", {
            orderId,
            queue: QUEUE_NAME,
            traceId: span.spanContext().traceId,
          });

          span.setStatus({ code: 1 });
          return c.json({
            success: true,
            orderId,
            message: "Order created and event published",
            traceId: span.spanContext().traceId,
          });
        } else {
          throw new Error("RabbitMQ channel not available");
        }
      } catch (error) {
        logger.error("Error creating order", {
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        });

        span.recordException(error as Error);
        span.setStatus({ code: 2, message: (error as Error).message });

        return c.json(
          {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          },
          500
        );
      } finally {
        span.end();
      }
    }
  );
});

// Health check endpoint
app.get("/health", (c) => {
  return tracer.startActiveSpan(
    "health-check",
    { kind: SpanKind.SERVER },
    (span) => {
      try {
        span.setAttributes({
          "service.name": "hono-lgtm-publisher",
          "http.method": "GET",
          "http.route": "/health",
          "http.scheme": "http",
          "http.target": "/health",
        });

        const isRabbitMQHealthy = !!channel && !!channel.connection;

        span.setAttributes({
          "health.rabbitmq": isRabbitMQHealthy,
          "health.status": isRabbitMQHealthy ? "healthy" : "unhealthy",
        });

        if (isRabbitMQHealthy) {
          span.setStatus({ code: 1 });
          return c.json({
            status: "healthy",
            services: {
              rabbitmq: "connected",
            },
          });
        } else {
          span.setStatus({ code: 2, message: "RabbitMQ not connected" });
          return c.json(
            {
              status: "unhealthy",
              services: {
                rabbitmq: "disconnected",
              },
            },
            503
          );
        }
      } finally {
        span.end();
      }
    }
  );
});

export default app;
