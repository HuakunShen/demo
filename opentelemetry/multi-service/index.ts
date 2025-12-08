import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import type { Resource } from "@opentelemetry/resources";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import {
  BatchLogRecordProcessor,
  LoggerProvider,
} from "@opentelemetry/sdk-logs";
import { logs, SeverityNumber } from "@opentelemetry/api-logs";
import type { Logger as OtelLogger } from "@opentelemetry/api-logs";
import { trace, context } from "@opentelemetry/api";
import type { Tracer } from "@opentelemetry/api";

// LGTM/Grafana OTLP endpoint configuration
const OTLP_ENDPOINT = process.env.OTLP_ENDPOINT || "http://localhost:4318";

// Global OpenTelemetry SDK instance (singleton for traces and metrics)
let otelSDK: NodeSDK | null = null;

/**
 * Initialize OpenTelemetry SDK once for traces and metrics
 * Logs are handled separately per service
 */
function initializeOTel() {
  if (otelSDK) {
    console.log("⚠️  OpenTelemetry SDK already initialized");
    return otelSDK;
  }

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: "multi-service-app",
    [ATTR_SERVICE_VERSION]: "1.0.0",
  });

  otelSDK = new NodeSDK({
    resource,
    traceExporter: new OTLPTraceExporter({
      url: `${OTLP_ENDPOINT}/v1/traces`,
    }),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: `${OTLP_ENDPOINT}/v1/metrics`,
      }),
      exportIntervalMillis: 5000,
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-fs": { enabled: false },
      }),
    ],
  });

  otelSDK.start();

  console.log("✅ OpenTelemetry SDK initialized");

  return otelSDK;
}

/**
 * Create a dedicated LoggerProvider for a specific service
 * This ensures each service has its own Resource with unique service.name
 */
function createServiceLoggerProvider(serviceName: string): LoggerProvider {
  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: serviceName,
    [ATTR_SERVICE_VERSION]: "1.0.0",
  });

  const logExporter = new OTLPLogExporter({
    url: `${OTLP_ENDPOINT}/v1/logs`,
  });

  const logProcessor = new BatchLogRecordProcessor(logExporter);

  const loggerProvider = new LoggerProvider({
    resource,
    processors: [logProcessor],
  });

  return loggerProvider;
}

/**
 * Simple logger wrapper that uses OpenTelemetry Logs API
 */
class ServiceLogger {
  private otelLogger: OtelLogger;
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
    const loggerProvider = createServiceLoggerProvider(serviceName);
    this.otelLogger = loggerProvider.getLogger(serviceName, "1.0.0");
  }

  private log(
    level: SeverityNumber,
    message: string,
    attributes: Record<string, any> = {}
  ) {
    // Log to console for visibility
    const levelName = SeverityNumber[level].replace("SEVERITY_NUMBER_", "");
    const timestamp = new Date().toISOString();
    console.log(
      `[${timestamp}] [${this.serviceName}] ${levelName}: ${message}`,
      Object.keys(attributes).length > 0 ? attributes : ""
    );

    // Emit to OpenTelemetry
    this.otelLogger.emit({
      severityNumber: level,
      severityText: levelName,
      body: message,
      attributes: {
        ...attributes,
        service: this.serviceName,
      },
    });
  }

  info(message: string, attributes: Record<string, any> = {}) {
    this.log(SeverityNumber.INFO, message, attributes);
  }

  warn(message: string, attributes: Record<string, any> = {}) {
    this.log(SeverityNumber.WARN, message, attributes);
  }

  error(message: string, attributes: Record<string, any> = {}) {
    this.log(SeverityNumber.ERROR, message, attributes);
  }
}

/**
 * Service 1: User Service
 * Handles user-related operations
 */
class UserService {
  private logger: ServiceLogger;
  private tracer: Tracer;
  private serviceName = "user-service";

  constructor() {
    // Create logger for this service
    this.logger = new ServiceLogger(this.serviceName);
    this.tracer = trace.getTracer(this.serviceName);

    this.logger.info("UserService initialized");
  }

  async createUser(username: string) {
    return this.tracer.startActiveSpan("createUser", async (span) => {
      span.setAttribute("app.username", username);
      this.logger.info("Creating new user", {
        username,
        action: "create_user",
      });

      // Simulate some work
      await new Promise((resolve) => setTimeout(resolve, 100));

      const userId = Math.random().toString(36).substring(7);
      span.setAttribute("app.userId", userId);

      this.logger.info("User created successfully", {
        username,
        userId,
        action: "create_user_success",
      });

      span.end();
      return userId;
    });
  }

  async getUser(userId: string) {
    return this.tracer.startActiveSpan("getUser", async (span) => {
      span.setAttribute("app.userId", userId);
      this.logger.info("Fetching user", { userId, action: "get_user" });

      // Simulate some work
      await new Promise((resolve) => setTimeout(resolve, 50));

      if (Math.random() > 0.8) {
        this.logger.warn("User not found", {
          userId,
          action: "get_user_not_found",
        });
        span.addEvent("User not found");
        span.end();
        return null;
      }

      this.logger.info("User fetched successfully", {
        userId,
        action: "get_user_success",
      });

      span.end();
      return { id: userId, name: "John Doe" };
    });
  }

  async deleteUser(userId: string) {
    return this.tracer.startActiveSpan("deleteUser", async (span) => {
      span.setAttribute("app.userId", userId);
      this.logger.warn("Deleting user", { userId, action: "delete_user" });

      // Simulate some work
      await new Promise((resolve) => setTimeout(resolve, 80));

      this.logger.info("User deleted", {
        userId,
        action: "delete_user_success",
      });
      span.end();
    });
  }
}

/**
 * Service 2: Order Service
 * Handles order processing
 */
class OrderService {
  private logger: ServiceLogger;
  private tracer: Tracer;
  private serviceName = "order-service";

  constructor() {
    // Create logger for this service
    this.logger = new ServiceLogger(this.serviceName);
    this.tracer = trace.getTracer(this.serviceName);
    this.logger.info("OrderService initialized");
  }

  async createOrder(userId: string, items: string[]) {
    return this.tracer.startActiveSpan("createOrder", async (span) => {
      span.setAttribute("app.userId", userId);
      span.setAttribute("app.itemCount", items.length);

      this.logger.info("Creating new order", {
        userId,
        itemCount: items.length,
        items,
        action: "create_order",
      });

      // Simulate some work
      await new Promise((resolve) => setTimeout(resolve, 150));

      const orderId = `ORD-${Math.random()
        .toString(36)
        .substring(7)
        .toUpperCase()}`;

      span.setAttribute("app.orderId", orderId);

      this.logger.info("Order created successfully", {
        userId,
        orderId,
        totalItems: items.length,
        action: "create_order_success",
      });

      span.end();
      return orderId;
    });
  }

  async processOrder(orderId: string) {
    return this.tracer.startActiveSpan("processOrder", async (span) => {
      span.setAttribute("app.orderId", orderId);
      this.logger.info("Processing order", {
        orderId,
        action: "process_order",
      });

      try {
        // Simulate processing steps
        await this.tracer.startActiveSpan(
          "verifyPayment",
          async (childSpan) => {
            await new Promise((resolve) => setTimeout(resolve, 100));
            this.logger.info("Payment verified", {
              orderId,
              action: "payment_verified",
            });
            childSpan.end();
          }
        );

        await this.tracer.startActiveSpan(
          "reserveInventory",
          async (childSpan) => {
            await new Promise((resolve) => setTimeout(resolve, 100));
            this.logger.info("Inventory reserved", {
              orderId,
              action: "inventory_reserved",
            });
            childSpan.end();
          }
        );

        // Simulate occasional errors
        if (Math.random() > 0.9) {
          const error = new Error("Insufficient inventory");
          span.recordException(error);
          this.logger.error("Order processing failed", {
            orderId,
            error: "Insufficient inventory",
            action: "process_order_failed",
          });
          throw error;
        }

        this.logger.info("Order processed successfully", {
          orderId,
          action: "process_order_success",
        });
      } catch (e) {
        span.setStatus({ code: 2, message: String(e) }); // 2 = ERROR
        throw e;
      } finally {
        span.end();
      }
    });
  }

  async cancelOrder(orderId: string) {
    return this.tracer.startActiveSpan("cancelOrder", async (span) => {
      span.setAttribute("app.orderId", orderId);
      this.logger.warn("Cancelling order", { orderId, action: "cancel_order" });

      await new Promise((resolve) => setTimeout(resolve, 60));

      this.logger.info("Order cancelled", {
        orderId,
        action: "cancel_order_success",
      });
      span.end();
    });
  }
}

/**
 * Service 3: Notification Service
 * Handles sending notifications
 */
class NotificationService {
  private logger: ServiceLogger;
  private tracer: Tracer;
  private serviceName = "notification-service";

  constructor() {
    // Create logger for this service
    this.logger = new ServiceLogger(this.serviceName);
    this.tracer = trace.getTracer(this.serviceName);
    this.logger.info("NotificationService initialized");
  }

  async sendEmail(to: string, subject: string, body: string) {
    return this.tracer.startActiveSpan("sendEmail", async (span) => {
      span.setAttribute("app.to", to);
      this.logger.info("Sending email notification", {
        to,
        subject,
        action: "send_email",
      });

      // Simulate sending email
      await new Promise((resolve) => setTimeout(resolve, 120));

      // Simulate occasional failures
      if (Math.random() > 0.95) {
        this.logger.error("Failed to send email", {
          to,
          subject,
          error: "SMTP connection timeout",
          action: "send_email_failed",
        });
        span.setStatus({ code: 2, message: "SMTP connection timeout" });
        span.end();
        return false;
      }

      this.logger.info("Email sent successfully", {
        to,
        subject,
        action: "send_email_success",
      });

      span.end();
      return true;
    });
  }

  async sendSMS(to: string, message: string) {
    return this.tracer.startActiveSpan("sendSMS", async (span) => {
      span.setAttribute("app.to", to);
      this.logger.info("Sending SMS notification", {
        to,
        messageLength: message.length,
        action: "send_sms",
      });

      // Simulate sending SMS
      await new Promise((resolve) => setTimeout(resolve, 80));

      this.logger.info("SMS sent successfully", {
        to,
        action: "send_sms_success",
      });

      span.end();
      return true;
    });
  }

  async sendPushNotification(userId: string, title: string, body: string) {
    return this.tracer.startActiveSpan("sendPushNotification", async (span) => {
      span.setAttribute("app.userId", userId);
      this.logger.info("Sending push notification", {
        userId,
        title,
        action: "send_push",
      });

      // Simulate sending push notification
      await new Promise((resolve) => setTimeout(resolve, 50));

      this.logger.info("Push notification sent", {
        userId,
        title,
        action: "send_push_success",
      });

      span.end();
      return true;
    });
  }
}

/**
 * Main application orchestrator
 */
async function main() {
  console.log("🚀 Starting multi-service application...\n");
  console.log(`📡 OTLP Endpoint: ${OTLP_ENDPOINT}\n`);

  // Initialize OpenTelemetry SDK once for the entire application
  initializeOTel();

  // Initialize all services
  const userService = new UserService();
  const orderService = new OrderService();
  const notificationService = new NotificationService();

  console.log(
    "\n📊 All services initialized. Starting operations loop (every 10s)...\n"
  );

  // Function to run a single simulation cycle
  const runSimulation = async () => {
    const tracer = trace.getTracer("main-orchestrator");

    await tracer.startActiveSpan("simulation-cycle", async (rootSpan) => {
      console.log(
        `\n--- Starting simulation cycle at ${new Date().toISOString()} ---`
      );

      try {
        // User operations
        await userService.createUser("alice");
        await userService.createUser("bob");
        const user = await userService.getUser("user-123");

        // Order operations
        const orderId1 = await orderService.createOrder("user-123", [
          "item1",
          "item2",
          "item3",
        ]);
        await orderService.processOrder(orderId1);

        const orderId2 = await orderService.createOrder("user-456", [
          "item4",
          "item5",
        ]);

        // Notification operations
        await notificationService.sendEmail(
          "alice@example.com",
          "Order Confirmation",
          "Your order has been confirmed"
        );
        await notificationService.sendSMS(
          "+1234567890",
          "Your order is being processed"
        );
        await notificationService.sendPushNotification(
          "user-123",
          "Order Update",
          "Your order is ready for shipping"
        );

        // More operations
        await orderService.processOrder(orderId2);
        await userService.getUser("user-456");
        await notificationService.sendEmail(
          "bob@example.com",
          "Welcome!",
          "Welcome to our platform"
        );

        // Simulate some errors
        try {
          await orderService.processOrder("ORD-FAIL");
        } catch (error) {
          // Error already logged by the service
        }

        await userService.deleteUser("user-789");
        await orderService.cancelOrder("ORD-CANCEL");

        console.log("--- Simulation cycle completed ---");
      } catch (error) {
        console.error("❌ Application error:", error);
        rootSpan.recordException(error as Error);
        rootSpan.setStatus({ code: 2, message: String(error) });
      } finally {
        rootSpan.end();
      }
    });
  };

  // Run immediately
  await runSimulation();

  // Then run every 10 seconds
  setInterval(runSimulation, 10000);

  // Keep the process running
  console.log("🔄 Loop started. Press Ctrl+C to stop.");

  process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down gracefully...");
    process.exit(0);
  });

  process.on("SIGINT", () => {
    console.log("SIGINT received, shutting down gracefully...");
    process.exit(0);
  });
}

// Run the application
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
