import { Cause, Effect, Layer, Logger, Metric, Schedule } from "effect";
import { NodeRuntime } from "@effect/platform-node";
import { DevTools } from "@effect/experimental";
import { NodeSdk } from "@effect/opentelemetry";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";

// Define metrics
const requestCount = Metric.counter("request_count", {
  description: "Total number of requests processed per endpoint",
}).pipe(Metric.tagged("service", "example"));

const taskDuration = Metric.summary({
  name: "task_duration_ms",
  maxAge: "1 minute",
  maxSize: 1000,
  error: 0.05,
  quantiles: [0.5, 0.9, 0.95, 0.99],
}).pipe(Metric.tagged("service", "example"));

const activeTasks = Metric.gauge("active_tasks", {
  description: "Number of currently active tasks",
}).pipe(Metric.tagged("service", "example"));

// Function to simulate a task with possible subtasks
const task = (
  name: string,
  delay: number,
  children: ReadonlyArray<Effect.Effect<void>> = []
) =>
  Effect.gen(function* () {
    const startTime = Date.now();
    
    // Increment active tasks gauge
    yield* activeTasks(Effect.succeed(1));
    
    // Increment request counter
    yield* requestCount(Effect.succeed(1)).pipe(
      Effect.tagMetrics("endpoint", name)
    );
    
    yield* Effect.log(name);
    yield* Effect.sleep(`${delay} millis`);
    
    for (const child of children) {
      yield* child;
    }
    
    yield* Effect.sleep(`${delay} millis`);
    
    // Calculate duration and record it
    const duration = Date.now() - startTime;
    yield* taskDuration(Effect.succeed(duration)).pipe(
      Effect.tagMetrics("endpoint", name)
    );
    
    // Decrement active tasks gauge
    yield* activeTasks(Effect.succeed(-1));
  }).pipe(
    Effect.withSpan(name, {
      attributes: {
        "http.route": name,
        "service.name": "example",
        "task.delay_ms": delay,
        "task.children_count": children.length,
      },
    })
  );

const poll = task("/poll", 1);

// Create a program with tasks and subtasks
const singleRequest = task("client", 2, [
  task("/api", 3, [
    task("/authN", 4, [task("/authZ", 5)]),
    task("/payment Gateway", 6, [task("DB", 7), task("Ext. Merchant", 8)]),
    task("/dispatch", 9, [
      task("/dispatch/search", 10),
      Effect.all([poll, poll, poll], { concurrency: "inherit" }),
      task("/pollDriver/{id}", 11),
    ]),
  ]),
]);

// Long-running program that runs for 20 seconds
const program = Effect.gen(function* () {
  let requestCount = 0;
  
  yield* Effect.log("Starting long-running task (20 seconds)...");
  
  yield* Effect.withSpan("long_running_session", {
    attributes: {
      "session.duration_seconds": 20,
      "session.start_time": new Date().toISOString(),
    },
  })(
    Effect.gen(function* () {
      // Run a single request
      const runRequest = Effect.gen(function* () {
        const requestId = ++requestCount;
        
        yield* Effect.withSpan(`request_${requestId}`, {
          attributes: {
            "request.id": requestId,
            "request.timestamp": new Date().toISOString(),
          },
        })(singleRequest);
        
        // Small delay between requests to avoid overwhelming
        yield* Effect.sleep("100 millis");
      });
      
      // Repeat with a schedule that runs for up to 20 seconds
      yield* runRequest.pipe(
        Effect.repeat(
          Schedule.spaced("100 millis").pipe(
            Schedule.upTo("20 seconds")
          )
        )
      );
      
      yield* Effect.log(`Completed ${requestCount} requests in 20 seconds`);
    })
  );
});

const NodeSdkLive = NodeSdk.layer(() => ({
  resource: { serviceName: "example" },
  spanProcessor: new BatchSpanProcessor(new OTLPTraceExporter()),
  logRecordProcessor: new BatchLogRecordProcessor(new OTLPLogExporter()),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter(),
    exportIntervalMillis: 5000,
  }),
}));

Effect.runPromise(
  program.pipe(
    Effect.provide(NodeSdkLive),
    Effect.provide(Logger.pretty),
    Effect.catchAllCause(Effect.logError),
    Effect.ensuring(
      Effect.gen(function* () {
        // Print metrics summary at the end
        const requestState = yield* Metric.value(requestCount);
        const durationState = yield* Metric.value(taskDuration);
        const activeState = yield* Metric.value(activeTasks);

        yield* Effect.log("\n=== Metrics Summary ===");
        yield* Effect.log(`Request Count: ${requestState.count}`);

        // Display summary quantiles
        const quantilesStr = durationState.quantiles
          .map(([quantile, value]) => {
            const valueStr =
              value._tag === "Some" ? value.value.toFixed(2) : "N/A";
            return `p${(quantile * 100).toFixed(0)}=${valueStr}ms`;
          })
          .join(", ");
        yield* Effect.log(
          `Task Duration - Count: ${
            durationState.count
          }, Sum: ${durationState.sum.toFixed(
            2
          )}ms, Min: ${durationState.min.toFixed(
            2
          )}ms, Max: ${durationState.max.toFixed(2)}ms`
        );
        yield* Effect.log(`Task Duration Quantiles: ${quantilesStr}`);
        yield* Effect.log(`Active Tasks: ${activeState.value}`);
      })
    )
  )
);
