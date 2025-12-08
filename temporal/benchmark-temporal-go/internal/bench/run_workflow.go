package bench

import (
	"context"
	"fmt"
	"sync"
	"sync/atomic"
	"time"

	"go.temporal.io/sdk/client"

	"benchmark-temporal-go/app/internal/workflows"
)

type WorkflowScenarioConfig struct {
	RunID          string
	TotalWorkflows int
	Concurrency    int
	ActivityMicros int
}

type WorkflowScenarioResult struct {
	RunID      string
	Started    int
	Completed  int64
	Failed     int64
	Duration   time.Duration
	Processing DurationSummary
	EndToEnd   DurationSummary
}

func (r WorkflowScenarioResult) Throughput() float64 {
	if r.Duration <= 0 {
		return 0
	}
	return float64(r.Completed) / r.Duration.Seconds()
}

func RunWorkflowBenchmark(ctx context.Context, c client.Client, cfg WorkflowScenarioConfig) (*WorkflowScenarioResult, error) {
	if cfg.TotalWorkflows <= 0 {
		return nil, fmt.Errorf("total workflows must be positive")
	}
	if cfg.Concurrency <= 0 {
		cfg.Concurrency = 64
	}
	runID := cfg.RunID
	if runID == "" {
		runID = fmt.Sprintf("wf-bench-%d", time.Now().UnixNano())
	}

	var procStats durationStats
	var endToEndStats durationStats
	var mu sync.Mutex
	var failed atomic.Int64

	sem := make(chan struct{}, cfg.Concurrency)
	var wg sync.WaitGroup
	start := time.Now()

	for i := 0; i < cfg.TotalWorkflows; i++ {
		sem <- struct{}{}
		wg.Add(1)
		go func(seq int) {
			defer func() {
				<-sem
				wg.Done()
			}()

			options := client.StartWorkflowOptions{
				ID:        fmt.Sprintf("%s-%d", runID, seq),
				TaskQueue: workflows.TaskQueueName,
			}

			input := workflows.MarketEventWorkflowInput{
				EventID:             seq,
				SentAt:              time.Now().UTC(),
				SimulatedWorkMicros: cfg.ActivityMicros,
			}

			we, err := c.ExecuteWorkflow(ctx, options, workflows.MarketEventWorkflow, input)
			if err != nil {
				failed.Add(1)
				return
			}

			var result workflows.MarketEventWorkflowResult
			if err := we.Get(ctx, &result); err != nil {
				failed.Add(1)
				return
			}

			mu.Lock()
			procStats.add(time.Duration(result.RuntimeNanos))
			endToEndStats.add(time.Duration(result.EndToEndLatencyNanos))
			mu.Unlock()
		}(i)
	}

	wg.Wait()
	totalDuration := time.Since(start)

	return &WorkflowScenarioResult{
		RunID:      runID,
		Started:    cfg.TotalWorkflows,
		Completed:  procStats.count,
		Failed:     failed.Load(),
		Duration:   totalDuration,
		Processing: procStats.summary(),
		EndToEnd:   endToEndStats.summary(),
	}, nil
}
