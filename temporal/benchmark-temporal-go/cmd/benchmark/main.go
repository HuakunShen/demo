package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"strings"
	"time"

	"go.temporal.io/sdk/client"

	"benchmark-temporal-go/app/internal/bench"
)

type cliConfig struct {
	hostPort            string
	namespace           string
	scenario            string
	workerCount         int
	workerIdentity      string
	timeout             time.Duration
	signalEvents        int
	signalConcurrency   int
	signalPerWorkflow   int
	workflowEvents      int
	workflowConcurrency int
	activityMicros      int
	runSignal           bool
	runWorkflow         bool
}

func main() {
	cfg := parseFlags()
	log.SetFlags(0)

	ctx, cancel := context.WithTimeout(context.Background(), cfg.timeout)
	defer cancel()

	c, err := client.Dial(client.Options{
		HostPort:  cfg.hostPort,
		Namespace: cfg.namespace,
	})
	if err != nil {
		log.Fatalf("create Temporal client: %v", err)
	}
	defer c.Close()

	workerGroup, err := bench.StartWorkerGroup(c, bench.WorkerGroupConfig{
		Count:          cfg.workerCount,
		IdentityPrefix: cfg.workerIdentity,
	})
	if err != nil {
		log.Fatalf("start workers: %v", err)
	}
	defer workerGroup.Stop()

	if cfg.runSignal {
		fmt.Printf("\n== Signal-driven workflow (events=%d concurrency=%d) ==\n", cfg.signalEvents, cfg.signalConcurrency)
		res, err := bench.RunSignalBenchmark(ctx, c, bench.SignalScenarioConfig{
			TotalEvents: cfg.signalEvents,
			Concurrency: cfg.signalConcurrency,
			PerWorkflow: cfg.signalPerWorkflow,
			BatchLogger: func(batch bench.SignalWorkflowResult) {
				logSignalBatch(batch)
			},
		})
		if err != nil {
			log.Fatalf("signal benchmark failed: %v", err)
		}
		dumpSignalReport(res)
	}

	if cfg.runWorkflow {
		fmt.Printf("\n== Workflow-per-event (workflows=%d concurrency=%d workers=%d) ==\n", cfg.workflowEvents, cfg.workflowConcurrency, cfg.workerCount)
		res, err := bench.RunWorkflowBenchmark(ctx, c, bench.WorkflowScenarioConfig{
			TotalWorkflows: cfg.workflowEvents,
			Concurrency:    cfg.workflowConcurrency,
			ActivityMicros: cfg.activityMicros,
		})
		if err != nil {
			log.Fatalf("workflow benchmark failed: %v", err)
		}
		dumpWorkflowReport(res)
	}
}

func parseFlags() cliConfig {
	var cfg cliConfig

	flag.StringVar(&cfg.hostPort, "host-port", client.DefaultHostPort, "Temporal frontend host:port")
	flag.StringVar(&cfg.namespace, "namespace", "default", "Temporal namespace")
	flag.StringVar(&cfg.scenario, "scenario", "all", "Scenario to run: signal, workflow, all")
	flag.IntVar(&cfg.workerCount, "workers", 1, "Number of Temporal workers to start")
	flag.StringVar(&cfg.workerIdentity, "worker-identity", "perf-bench", "Worker identity prefix")
	flag.DurationVar(&cfg.timeout, "timeout", 5*time.Minute, "Overall benchmark timeout")
	flag.IntVar(&cfg.signalEvents, "signal-events", 20000, "Number of signals to emit in the signal benchmark")
	flag.IntVar(&cfg.signalConcurrency, "signal-concurrency", 256, "Concurrent signal senders")
	flag.IntVar(&cfg.workflowEvents, "workflow-events", 2000, "Number of workflows to start in the workflow benchmark")
	flag.IntVar(&cfg.workflowConcurrency, "workflow-concurrency", 256, "Concurrent workflow starters")
	flag.IntVar(&cfg.activityMicros, "activity-micros", 0, "Simulated activity duration per workflow in microseconds")
	flag.IntVar(&cfg.signalPerWorkflow, "signal-events-per-workflow", 8000, "Maximum signals to send to a single workflow before starting another (avoid server history limits)")

	flag.Parse()

	scenario := strings.ToLower(cfg.scenario)
	switch scenario {
	case "signal":
		cfg.runSignal = true
	case "workflow":
		cfg.runWorkflow = true
	case "all":
		cfg.runSignal = true
		cfg.runWorkflow = true
	default:
		log.Fatalf("unknown scenario %q", cfg.scenario)
	}

	return cfg
}

func dumpSignalReport(res *bench.SignalScenarioResult) {
	fmt.Printf("Signal workflows executed: %d\n", len(res.Workflows))
	fmt.Printf("Signal emission: %d signals in %s (%.0f signals/s)\n",
		res.TotalEvents,
		res.TotalSendDuration.Truncate(time.Millisecond),
		res.EmissionRate())
	fmt.Printf("Workflow processing: %d signals in %s (%.0f signals/s)\n",
		res.ProcessedEvents,
		res.TotalWorkflowRuntime.Truncate(time.Millisecond),
		res.WorkflowRate())
	fmt.Printf("Signal latency avg=%s min=%s max=%s\n",
		res.AvgLatency().Truncate(time.Microsecond),
		time.Duration(res.MinLatencyNanos).Truncate(time.Microsecond),
		time.Duration(res.MaxLatencyNanos).Truncate(time.Microsecond))
	if len(res.Workflows) > 1 {
		fmt.Println("Per-workflow breakdown:")
	}
	for _, wf := range res.Workflows {
		logSignalBatch(wf)
	}
}

func logSignalBatch(wf bench.SignalWorkflowResult) {
	workflowRuntime := time.Duration(wf.WorkflowResult.RuntimeNanos)
	wfRate := 0.0
	if workflowRuntime > 0 {
		wfRate = float64(wf.WorkflowResult.ProcessedEvents) / workflowRuntime.Seconds()
	}
	avgLatency := time.Duration(0)
	if wf.WorkflowResult.ProcessedEvents > 0 {
		avgLatency = time.Duration(wf.WorkflowResult.TotalLatencyNanos / wf.WorkflowResult.ProcessedEvents)
	}
	fmt.Printf("  %s: %d signals in %s (%.0f signals/s) latency avg=%s max=%s\n",
		wf.WorkflowID,
		wf.EventsSent,
		workflowRuntime.Truncate(time.Millisecond),
		wfRate,
		avgLatency.Truncate(time.Microsecond),
		time.Duration(wf.WorkflowResult.MaxLatencyNanos).Truncate(time.Microsecond))
}

func dumpWorkflowReport(res *bench.WorkflowScenarioResult) {
	fmt.Printf("RunID: %s\n", res.RunID)
	fmt.Printf("Completed %d / %d workflows (failed %d) in %s (%.0f workflows/s)\n",
		res.Completed, res.Started, res.Failed, res.Duration.Truncate(time.Millisecond), res.Throughput())
	fmt.Printf("Workflow runtime avg=%s min=%s max=%s\n",
		res.Processing.Avg.Truncate(time.Microsecond),
		res.Processing.Min.Truncate(time.Microsecond),
		res.Processing.Max.Truncate(time.Microsecond))
	fmt.Printf("End-to-end latency avg=%s min=%s max=%s\n",
		res.EndToEnd.Avg.Truncate(time.Microsecond),
		res.EndToEnd.Min.Truncate(time.Microsecond),
		res.EndToEnd.Max.Truncate(time.Microsecond))
}
