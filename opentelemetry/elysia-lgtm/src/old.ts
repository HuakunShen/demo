import { Elysia, t } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { opentelemetry } from "@elysiajs/opentelemetry";

// OpenTelemetry SDK imports
import { NodeSDK } from "@opentelemetry/sdk-node";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { OTLPTraceExporter as OTLPTraceExporterHTTP } from "@opentelemetry/exporter-trace-otlp-http";
import { SimpleLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-proto";
import { OTLPLogExporter as OTLPLogExporterHTTP } from "@opentelemetry/exporter-logs-otlp-http";
import { trace, SpanStatusCode } from "@opentelemetry/api";
import { logs } from "@opentelemetry/api-logs";

const OTLP_HOST = process.env.OTLP_HOST || "localhost";
const serviceName = "Elysia Otel";

// Create multiple exporters for different endpoints
const lgtmTraceExporter = new OTLPTraceExporter({
    url: `http://${OTLP_HOST}:4318/v1/traces`,
});

const lgtmLogExporter = new OTLPLogExporter({
    url: `http://${OTLP_HOST}:4318/v1/logs`,
});

const jaegerTraceExporter = new OTLPTraceExporterHTTP({
    url: `http://${OTLP_HOST}:4319/v1/traces`,
});

// Create span processors for multiple exporters
const spanProcessors = [
    new BatchSpanProcessor(lgtmTraceExporter),
    new BatchSpanProcessor(jaegerTraceExporter),
];

// Initialize OpenTelemetry SDK
const sdk = new NodeSDK({
    serviceName,
    spanProcessors,
    logRecordProcessor: new SimpleLogRecordProcessor(lgtmLogExporter),
});

// Start the SDK
sdk.start();

// Get loggers
const logger = logs.getLogger("elysia-app");

const appTracer = trace.getTracer(serviceName, "1.0.0");

// Function to simulate database query
function simulateDatabaseQuery() {
    const span = appTracer.startSpan("database-query");
    span.setAttributes({
        "db.system": "postgresql",
        "db.operation": "SELECT",
        "db.table": "users"
    });

    try {
        logger.emit({
            severityText: "INFO",
            severityNumber: 9,
            body: "Starting database query for users"
        });

        // Simulate some work
        const startTime = Date.now();
        while (Date.now() - startTime < 50) {
            // Busy wait to simulate processing
        }

        span.addEvent("query_executed", {
            "db.rows_returned": 5,
            "db.query_time_ms": Date.now() - startTime
        });

        logger.emit({
            severityText: "INFO",
            severityNumber: 9,
            body: `Database query completed in ${Date.now() - startTime}ms, returned 5 users`
        });

        span.setStatus({ code: SpanStatusCode.OK });
        return { users: ["user1", "user2", "user3", "user4", "user5"] };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: errorMessage });
        logger.emit({
            severityText: "ERROR",
            severityNumber: 17,
            body: `Database query failed: ${errorMessage}`
        });
        throw error;
    } finally {
        span.end();
    }
}

// Function to simulate external API call
function simulateExternalApiCall() {
    const span = appTracer.startSpan("external-api-call");
    span.setAttributes({
        "http.method": "GET",
        "http.url": "https://api.external.com/data",
        "http.target": "/data"
    });

    try {
        logger.emit({
            severityText: "INFO",
            severityNumber: 9,
            body: "Making external API call to https://api.external.com/data"
        });

        // Simulate network delay
        const startTime = Date.now();
        while (Date.now() - startTime < 100) {
            // Busy wait to simulate network delay
        }

        span.addEvent("api_response_received", {
            "http.status_code": 200,
            "response_time_ms": Date.now() - startTime
        });

        logger.emit({
            severityText: "INFO",
            severityNumber: 9,
            body: `External API call completed in ${Date.now() - startTime}ms with status 200`
        });

        span.setStatus({ code: SpanStatusCode.OK });
        return { data: "external data", timestamp: new Date().toISOString() };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: errorMessage });
        logger.emit({
            severityText: "ERROR",
            severityNumber: 17,
            body: `External API call failed: ${errorMessage}`
        });
        throw error;
    } finally {
        span.end();
    }
}

// Function to process business logic
function processBusinessLogic(dbData: { users: string[] }, apiData: { data: string; timestamp: string }) {
    const span = appTracer.startSpan("business-logic-processing");
    span.setAttributes({
        "business.operation": "data_aggregation",
        "business.domain": "user_management"
    });

    try {
        logger.emit({
            severityText: "INFO",
            severityNumber: 9,
            body: "Starting business logic processing"
        });

        span.addEvent("processing_started");

        // Simulate processing time
        const startTime = Date.now();
        while (Date.now() - startTime < 30) {
            // Busy wait to simulate processing
        }

        const result = {
            userCount: dbData.users.length,
            externalDataTimestamp: apiData.timestamp,
            processedAt: new Date().toISOString()
        };

        span.addEvent("processing_completed", {
            "processed_items": result.userCount,
            "processing_time_ms": Date.now() - startTime
        });

        logger.emit({
            severityText: "INFO",
            severityNumber: 9,
            body: `Business logic processing completed in ${Date.now() - startTime}ms, processed ${result.userCount} items`
        });

        span.setStatus({ code: SpanStatusCode.OK });
        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: errorMessage });
        logger.emit({
            severityText: "ERROR",
            severityNumber: 17,
            body: `Business logic processing failed: ${errorMessage}`
        });
        throw error;
    } finally {
        span.end();
    }
}

const app = new Elysia()
    .use(
        swagger({
            documentation: {
                info: {
                    title: "Elysia Documentation",
                    version: "1.0.0",
                },
            },
        })
    )
    .use(swagger())
    .use(
        opentelemetry({
            spanProcessors: spanProcessors,
            // logRecordProcessors: [
            //   new SimpleLogRecordProcessor(lgtmLogExporter),
            // ],
        })
    )
    .get(
        "/",
        () => {
            const span = appTracer.startSpan("root-request-handler");
            span.setAttributes({
                "http.route": "/",
                "http.method": "GET"
            });

            try {
                logger.emit({
                    severityText: "INFO",
                    severityNumber: 9,
                    body: "Root request handler started"
                });

                span.addEvent("request_started");
                console.log("hi");

                // Call nested functions to create trace hierarchy
                const dbData = simulateDatabaseQuery();
                const apiData = simulateExternalApiCall();
                const processedData = processBusinessLogic(dbData, apiData);

                span.addEvent("request_completed", {
                    "response_size": JSON.stringify(processedData).length
                });

                logger.emit({
                    severityText: "INFO",
                    severityNumber: 9,
                    body: `Root request completed successfully, response size: ${JSON.stringify(processedData).length} bytes`
                });

                span.setStatus({ code: SpanStatusCode.OK });
                return {
                    message: "hi",
                    data: processedData
                };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                span.setStatus({ code: SpanStatusCode.ERROR, message: errorMessage });
                logger.emit({
                    severityText: "ERROR",
                    severityNumber: 17,
                    body: `Root request failed: ${errorMessage}`
                });
                throw error;
            } finally {
                span.end();
            }
        },
        {
            response: t.Object({
                message: t.String({ description: "Greeting message" }),
                data: t.Object({
                    userCount: t.Number({ description: "Number of users" }),
                    externalDataTimestamp: t.String({ description: "External API timestamp" }),
                    processedAt: t.String({ description: "Processing timestamp" })
                }, { description: "Processed data" })
            }, { description: "Root endpoint response with nested trace data" }),
        }
    )
    .post(
        "/json/:id",
        ({ body, params: { id }, query: { name } }) => ({
            ...body,
            id,
            name,
        }),
        {
            params: t.Object({
                id: t.String(),
            }),
            query: t.Object({
                name: t.String(),
            }),
            body: t.Object({
                username: t.String(),
                password: t.String(),
            }),
            response: t.Object(
                {
                    username: t.String(),
                    password: t.String(),
                    id: t.String(),
                    name: t.String(),
                },
                { description: "sample description" }
            ),
        }
    )
    .listen(3000);

console.log(
    `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    sdk.shutdown().then(() => {
        console.log('OpenTelemetry SDK shut down successfully');
        process.exit(0);
    }).catch((error) => {
        console.error('Error shutting down OpenTelemetry SDK:', error);
        process.exit(1);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    sdk.shutdown().then(() => {
        console.log('OpenTelemetry SDK shut down successfully');
        process.exit(0);
    }).catch((error) => {
        console.error('Error shutting down OpenTelemetry SDK:', error);
        process.exit(1);
    });
});
