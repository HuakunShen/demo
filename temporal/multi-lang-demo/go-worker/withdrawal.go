package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.temporal.io/sdk/activity"
)

// WithdrawalActivity handles money withdrawal from source account
func WithdrawalActivity(ctx context.Context, input PaymentDetails) (ActivityResult, error) {
	log.Printf("Go: Starting withdrawal of $%.2f from account %s (Ref: %s)",
		input.Amount, input.SourceAccount, input.ReferenceID)

	// Simulate processing time
	activity.GetHeartbeatDetails(ctx)

	// Simulate some processing
	// time.Sleep(time.Duration(200+rand.Intn(800)) * time.Millisecond)

	// Generate transaction ID
	transactionID := fmt.Sprintf("W-%d-%s", time.Now().Unix(), input.ReferenceID)

	result := ActivityResult{
		Success:       true,
		TransactionId: transactionID,
		Message:       fmt.Sprintf("Successfully withdrew $%.2f from account %s", input.Amount, input.SourceAccount),
	}

	log.Printf("Go: Withdrawal completed. Transaction ID: %s", transactionID)
	return result, nil
}
