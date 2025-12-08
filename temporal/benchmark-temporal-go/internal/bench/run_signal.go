package bench

import (
	"context"
	"fmt"
	"math"
	"time"

	"go.temporal.io/sdk/client"
	"golang.org/x/sync/errgroup"

	"benchmark-temporal-go/app/internal/workflows"
)

type SignalScenarioConfig struct {
	WorkflowID  string
	TotalEvents int
	Concurrency int
	PerWorkflow int
	BatchLogger func(SignalWorkflowResult)
}

type SignalScenarioResult struct {
	Workflows            []SignalWorkflowResult
	TotalEvents          int
	TotalSendDuration    time.Duration
	TotalWorkflowRuntime time.Duration
	ProcessedEvents      int64
	TotalLatencyNanos    int64
	MaxLatencyNanos      int64
	MinLatencyNanos      int64
}

type SignalWorkflowResult struct {
	WorkflowID     string
	EventsSent     int
	SendDuration   time.Duration
	WorkflowResult workflows.SignalBenchmarkResult
}

func (r SignalScenarioResult) EmissionRate() float64 {
	if r.TotalSendDuration <= 0 {
		return 0
	}
	return float64(r.TotalEvents) / r.TotalSendDuration.Seconds()
}

func (r SignalScenarioResult) WorkflowRate() float64 {
	dur := r.TotalWorkflowRuntime
	if dur <= 0 {
		return 0
	}
	return float64(r.ProcessedEvents) / dur.Seconds()
}

func (r SignalScenarioResult) AvgLatency() time.Duration {
	if r.ProcessedEvents == 0 {
		return 0
	}
	return time.Duration(r.TotalLatencyNanos / r.ProcessedEvents)
}

func RunSignalBenchmark(ctx context.Context, c client.Client, cfg SignalScenarioConfig) (*SignalScenarioResult, error) {
	if cfg.TotalEvents <= 0 {
		return nil, fmt.Errorf("total events must be positive")
	}
	if cfg.Concurrency <= 0 {
		cfg.Concurrency = 64
	}
	if cfg.PerWorkflow <= 0 || cfg.PerWorkflow > cfg.TotalEvents {
		cfg.PerWorkflow = cfg.TotalEvents
	}
	prefix := cfg.WorkflowID
	if prefix == "" {
		prefix = fmt.Sprintf("signal-bench-%d", time.Now().UnixNano())
	}

	result := &SignalScenarioResult{
		MinLatencyNanos: math.MaxInt64,
	}

	remaining := cfg.TotalEvents
	batch := 0
	for remaining > 0 {
		batchSize := cfg.PerWorkflow
		if batchSize > remaining {
			batchSize = remaining
		}
		workflowID := prefix
		if cfg.PerWorkflow != cfg.TotalEvents {
			workflowID = fmt.Sprintf("%s-%d", prefix, batch)
		}

		workflowRes, err := runSignalBatch(ctx, c, workflowID, batchSize, cfg.Concurrency)
		if err != nil {
			return nil, err
		}

		result.Workflows = append(result.Workflows, *workflowRes)
		result.TotalEvents += workflowRes.EventsSent
		result.TotalSendDuration += workflowRes.SendDuration
		result.TotalWorkflowRuntime += time.Duration(workflowRes.WorkflowResult.RuntimeNanos)
		result.ProcessedEvents += workflowRes.WorkflowResult.ProcessedEvents
		result.TotalLatencyNanos += workflowRes.WorkflowResult.TotalLatencyNanos
		if workflowRes.WorkflowResult.MaxLatencyNanos > result.MaxLatencyNanos {
			result.MaxLatencyNanos = workflowRes.WorkflowResult.MaxLatencyNanos
		}
		if workflowRes.WorkflowResult.MinLatencyNanos > 0 && workflowRes.WorkflowResult.MinLatencyNanos < result.MinLatencyNanos {
			result.MinLatencyNanos = workflowRes.WorkflowResult.MinLatencyNanos
		}
		if cfg.BatchLogger != nil {
			cfg.BatchLogger(*workflowRes)
		}

		remaining -= batchSize
		batch++
	}

	if result.MinLatencyNanos == math.MaxInt64 {
		result.MinLatencyNanos = 0
	}

	return result, nil
}

func runSignalBatch(ctx context.Context, c client.Client, workflowID string, totalEvents, concurrency int) (*SignalWorkflowResult, error) {
	options := client.StartWorkflowOptions{
		ID:        workflowID,
		TaskQueue: workflows.TaskQueueName,
	}

	we, err := c.ExecuteWorkflow(ctx, options, workflows.SignalHotWorkflow)
	if err != nil {
		return nil, fmt.Errorf("start signal workflow %s: %w", workflowID, err)
	}

	eventCh := make(chan workflows.SignalPayload, concurrency*2)
	group, sendCtx := errgroup.WithContext(ctx)
	for i := 0; i < concurrency; i++ {
		group.Go(func() error {
			for payload := range eventCh {
				if err := c.SignalWorkflow(sendCtx, workflowID, "", workflows.EventSignalName, payload); err != nil {
					return err
				}
			}
			return nil
		})
	}

	sendStart := time.Now()
	go func() {
		for i := 0; i < totalEvents; i++ {
			payload := workflows.SignalPayload{Sequence: i, SentAt: time.Now().UTC()}
			select {
			case <-sendCtx.Done():
				close(eventCh)
				return
			case eventCh <- payload:
			}
		}
		close(eventCh)
	}()

	if err := group.Wait(); err != nil {
		return nil, fmt.Errorf("send signals (workflow %s): %w", workflowID, err)
	}
	sendDuration := time.Since(sendStart)

	if err := c.SignalWorkflow(ctx, workflowID, "", workflows.StopSignalName, struct{}{}); err != nil {
		return nil, fmt.Errorf("stop signal workflow %s: %w", workflowID, err)
	}

	var wfResult workflows.SignalBenchmarkResult
	if err := we.Get(ctx, &wfResult); err != nil {
		return nil, fmt.Errorf("wait for signal workflow %s: %w", workflowID, err)
	}

	return &SignalWorkflowResult{
		WorkflowID:     workflowID,
		EventsSent:     totalEvents,
		SendDuration:   sendDuration,
		WorkflowResult: wfResult,
	}, nil
}
