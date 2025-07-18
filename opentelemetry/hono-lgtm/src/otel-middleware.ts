// IMPORTANT: Import tracing setup FIRST before any other imports
import "./tracing";

import { Hono } from "hono";
import { otel } from "@hono/otel";
import { propagation, context } from "@opentelemetry/api";
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

app.get("/", (c) => {
  try {
    const userAgent = c.req.header("user-agent") || "unknown";

    // Log with Winston - trace context will be automatically added
    logger.info("Processing root request", {
      method: "GET",
      route: "/",
      userAgent: userAgent,
    });

    logger.info("Request processed successfully");

    return c.text("Hello Hono with Winston + OpenTelemetry + RabbitMQ!");
  } catch (error) {
    logger.error("Error processing request", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
});

// Add a test route for different log levels
app.get("/test-logs", (c) => {
  logger.debug("Debug message from test route");
  logger.info("Info message from test route");
  logger.warn("Warning message from test route");
  logger.error("Error message from test route");

  return c.json({
    message: "Logs sent with different levels",
  });
});

// New route to publish messages to RabbitMQ
app.post("/order", async (c) => {
  try {
    const body = await c.req.json();
    const orderId = body.orderId || `order-${Date.now()}`;
    const customerId = body.customerId || "anonymous";

    // Create order event to publish
    const orderEvent = {
      orderId,
      customerId,
      timestamp: new Date().toISOString(),
      status: "created",
      items: body.items || [],
      total: body.total || 0,
    };

    logger.info("Creating new order", { orderId, customerId });

    // Publish message to RabbitMQ with distributed tracing
    if (channel) {
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

      logger.info("Order event published to queue", {
        orderId,
        queue: QUEUE_NAME,
      });

      return c.json({
        success: true,
        orderId,
        message: "Order created and event published",
      });
    } else {
      throw new Error("RabbitMQ channel not available");
    }
  } catch (error) {
    logger.error("Error creating order", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Health check endpoint
app.get("/health", (c) => {
  const isRabbitMQHealthy = !!channel && !!channel.connection;

  if (isRabbitMQHealthy) {
    return c.json({
      status: "healthy",
      services: {
        rabbitmq: "connected",
      },
    });
  } else {
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
});

export default app;
