package main

type PaymentDetails struct {
	Amount        float64 `json:"amount"`
	SourceAccount string  `json:"sourceAccount"`
	TargetAccount string  `json:"targetAccount"`
	ReferenceID   string  `json:"referenceId"`
}

type ActivityResult struct {
	Success       bool   `json:"success"`
	TransactionId string `json:"transactionId"`
	Message       string `json:"message"`
}

const TaskQueueWithdrawal = "WITHDRAWAL_QUEUE"