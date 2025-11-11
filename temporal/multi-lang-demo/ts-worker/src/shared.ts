export interface PaymentDetails {
  amount: number;
  sourceAccount: string;
  targetAccount: string;
  referenceId: string;
}

export interface ActivityResult {
  success: boolean;
  transactionId: string;
  message: string;
}

export const TaskQueues = {
  MAIN_WORKFLOW: 'MULTI_LANG_TRANSFER_QUEUE',
  WITHDRAWAL: 'WITHDRAWAL_QUEUE',
  DEPOSIT: 'DEPOSIT_QUEUE',
  REFUND: 'REFUND_QUEUE',
} as const;