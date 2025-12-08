package bench

import (
	"fmt"

	"go.temporal.io/sdk/client"
	"go.temporal.io/sdk/worker"

	"benchmark-temporal-go/app/internal/workflows"
)

type WorkerGroupConfig struct {
	Count          int
	IdentityPrefix string
}

type WorkerGroup struct {
	workers []worker.Worker
}

func StartWorkerGroup(c client.Client, cfg WorkerGroupConfig) (*WorkerGroup, error) {
	if cfg.Count <= 0 {
		cfg.Count = 1
	}
	if cfg.IdentityPrefix == "" {
		cfg.IdentityPrefix = "perf-bench"
	}
	group := &WorkerGroup{}
	for i := 0; i < cfg.Count; i++ {
		identity := fmt.Sprintf("%s-%d", cfg.IdentityPrefix, i)
		w := worker.New(c, workflows.TaskQueueName, worker.Options{Identity: identity})
		workflows.Register(w)
		if err := w.Start(); err != nil {
			group.Stop()
			return nil, err
		}
		group.workers = append(group.workers, w)
	}
	return group, nil
}

func (g *WorkerGroup) Stop() {
	for _, w := range g.workers {
		w.Stop()
	}
}
