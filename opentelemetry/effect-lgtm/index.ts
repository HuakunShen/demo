import { Cause, Effect, Layer, Logger } from "effect";
import { NodeRuntime } from "@effect/platform-node";
import { DevTools } from "@effect/experimental";
import { NodeSdk } from "@effect/opentelemetry";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";

// Function to simulate a task with possible subtasks
const task = (
  name: string,
  delay: number,
  children: ReadonlyArray<Effect.Effect<void>> = []
) =>
  Effect.gen(function* () {
    yield* Effect.log(name);
    yield* Effect.sleep(`${delay} millis`);
    for (const child of children) {
      yield* child;
    }
    yield* Effect.sleep(`${delay} millis`);
  }).pipe(Effect.withSpan(name));

const poll = task("/poll", 1);

// Create a program with tasks and subtasks
const program = task("client", 2, [
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

const NodeSdkLive = NodeSdk.layer(() => ({
  resource: { serviceName: "example" },
  spanProcessor: new BatchSpanProcessor(new OTLPTraceExporter()),
  logRecordProcessor: new BatchLogRecordProcessor(new OTLPLogExporter()),
}));

Effect.runPromise(
  program.pipe(
    Effect.provide(NodeSdkLive),
    Effect.provide(Logger.pretty),
    Effect.catchAllCause(Effect.logError)
  )
);
