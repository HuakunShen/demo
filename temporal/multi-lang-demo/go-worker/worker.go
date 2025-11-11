package main

import (
	"log"
	"go.temporal.io/sdk/activity"
	"go.temporal.io/sdk/client"
	"go.temporal.io/sdk/worker"
)

func main() {
	// Create the client
	c, err := client.Dial(client.Options{
		HostPort: "localhost:7233",
	})
	if err != nil {
		log.Fatalf("Unable to create client: %v", err)
	}
	defer c.Close()

	// Create a new worker
	w := worker.New(c, TaskQueueWithdrawal, worker.Options{})

	// Register activities with explicit name to match TypeScript workflow
	w.RegisterActivityWithOptions(WithdrawalActivity, activity.RegisterOptions{
		Name: "withdraw",
	})

	log.Printf("Go Worker started for withdrawal activities on queue: %s", TaskQueueWithdrawal)

	// Run the worker
	err = w.Run(worker.InterruptCh())
	if err != nil {
		log.Fatalf("Unable to start worker: %v", err)
	}
}