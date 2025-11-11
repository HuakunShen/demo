package shared

import "time"

type PaymentDetails struct {
	Amount        float64 `json:"amount"`
	SourceAccount string  `json:"sourceAccount"`
	TargetAccount string  `json:"targetAccount"`
	ReferenceID   string  `json:"referenceId"`
}

type ActivityResult struct {
	Success      bool   `json:"success"`
	TransactionID string `json:"transactionId"`
	Message      string `json:"message"`
}

const (
	TaskQueueMainWorkflow = "MULTI_LANG_TRANSFER_QUEUE"
	TaskQueueWithdrawal   = "WITHDRAWAL_QUEUE"
	TaskQueueDeposit      = "DEPOSIT_QUEUE"
	TaskQueueRefund       = "REFUND_QUEUE"
)