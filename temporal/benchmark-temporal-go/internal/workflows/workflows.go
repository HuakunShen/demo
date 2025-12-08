package workflows

import (
	"context"
	"math"
	"time"

	"go.temporal.io/sdk/worker"
	"go.temporal.io/sdk/workflow"
)

const (
	TaskQueueName      = "PERF_BENCH_TASK_QUEUE"
	SignalWorkflowName = "SignalHotWorkflow"
	MarketWorkflowName = "MarketEventWorkflow"
	EventSignalName    = "MARKET_EVENT_SIGNAL"
	StopSignalName     = "BENCHMARK_STOP_SIGNAL"
	SignalMetricsQuery = "signal_metrics"
)

type SignalPayload struct {
	Sequence int       `json:"sequence"`
	SentAt   time.Time `json:"sentAt"`
}

type SignalBenchmarkResult struct {
	ProcessedEvents   int64     `json:"processedEvents"`
	RuntimeNanos      int64     `json:"runtimeNanos"`
	TotalLatencyNanos int64     `json:"totalLatencyNanos"`
	MaxLatencyNanos   int64     `json:"maxLatencyNanos"`
	MinLatencyNanos   int64     `json:"minLatencyNanos"`
	StartedAt         time.Time `json:"startedAt"`
	CompletedAt       time.Time `json:"completedAt"`
	StoppedBySignal   bool      `json:"stoppedBySignal"`
}

type MarketEventWorkflowInput struct {
	EventID             int       `json:"eventId"`
	SentAt              time.Time `json:"sentAt"`
	SimulatedWorkMicros int       `json:"simulatedWorkMicros"`
}

type MarketEventWorkflowResult struct {
	EventID              int   `json:"eventId"`
	RuntimeNanos         int64 `json:"runtimeNanos"`
	EndToEndLatencyNanos int64 `json:"endToEndLatencyNanos"`
}

func SignalHotWorkflow(ctx workflow.Context) (*SignalBenchmarkResult, error) {
	logger := workflow.GetLogger(ctx)
	state := &SignalBenchmarkResult{
		MinLatencyNanos: math.MaxInt64,
		StartedAt:       workflow.Now(ctx),
	}

	err := workflow.SetQueryHandler(ctx, SignalMetricsQuery, func() (SignalBenchmarkResult, error) {
		snapshot := *state
		snapshot.RuntimeNanos = workflow.Now(ctx).Sub(state.StartedAt).Nanoseconds()
		return snapshot, nil
	})
	if err != nil {
		return nil, err
	}

	signalChan := workflow.GetSignalChannel(ctx, EventSignalName)
	stopChan := workflow.GetSignalChannel(ctx, StopSignalName)
	selector := workflow.NewSelector(ctx)
	running := true

	selector.AddReceive(signalChan, func(c workflow.ReceiveChannel, more bool) {
		var payload SignalPayload
		c.Receive(ctx, &payload)
		latency := workflow.Now(ctx).Sub(payload.SentAt)
		state.ProcessedEvents++
		state.TotalLatencyNanos += latency.Nanoseconds()
		if latency.Nanoseconds() > state.MaxLatencyNanos {
			state.MaxLatencyNanos = latency.Nanoseconds()
		}
		if latency.Nanoseconds() < state.MinLatencyNanos {
			state.MinLatencyNanos = latency.Nanoseconds()
		}
	})

	selector.AddReceive(stopChan, func(c workflow.ReceiveChannel, more bool) {
		state.StoppedBySignal = true
		running = false
	})

	for running {
		selector.Select(ctx)
	}

	state.CompletedAt = workflow.Now(ctx)
	state.RuntimeNanos = state.CompletedAt.Sub(state.StartedAt).Nanoseconds()
	if state.MinLatencyNanos == math.MaxInt64 {
		state.MinLatencyNanos = 0
	}

	logger.Info("Signal benchmark workflow completed", "processed", state.ProcessedEvents)

	return state, nil
}

func MarketEventWorkflow(ctx workflow.Context, input MarketEventWorkflowInput) (*MarketEventWorkflowResult, error) {
	start := workflow.Now(ctx)
	if input.SimulatedWorkMicros > 0 {
		activityCtx := workflow.WithActivityOptions(ctx, workflow.ActivityOptions{
			StartToCloseTimeout: 5 * time.Second,
			HeartbeatTimeout:    0,
		})
		if err := workflow.ExecuteActivity(activityCtx, ProcessMarketEventActivity, input.SimulatedWorkMicros).Get(ctx, nil); err != nil {
			return nil, err
		}
	}
	finish := workflow.Now(ctx)
	return &MarketEventWorkflowResult{
		EventID:              input.EventID,
		RuntimeNanos:         finish.Sub(start).Nanoseconds(),
		EndToEndLatencyNanos: finish.Sub(input.SentAt).Nanoseconds(),
	}, nil
}

func ProcessMarketEventActivity(ctx context.Context, simulatedWorkMicros int) (int, error) {
	if simulatedWorkMicros <= 0 {
		return 0, nil
	}
	time.Sleep(time.Duration(simulatedWorkMicros) * time.Microsecond)
	return simulatedWorkMicros, nil
}

func Register(w worker.Worker) {
	w.RegisterWorkflow(SignalHotWorkflow)
	w.RegisterWorkflow(MarketEventWorkflow)
	w.RegisterActivity(ProcessMarketEventActivity)
}
