import { proxyActivities } from '@temporalio/workflow';
import { ApplicationFailure } from '@temporalio/common';
import type { PaymentDetails, ActivityResult } from './shared';
import { TaskQueues } from './shared';

// Define the cross-language activity interfaces
interface WithdrawalActivities {
  withdraw(input: PaymentDetails): Promise<ActivityResult>;
}

interface DepositActivities {
  deposit(input: PaymentDetails): Promise<ActivityResult>;
}

interface RefundActivities {
  refund(input: PaymentDetails): Promise<ActivityResult>;
}

export async function multiLanguageMoneyTransfer(paymentDetails: PaymentDetails): Promise<string> {
  // Setup cross-language activity proxies with their respective task queues
  const withdrawalActivities = proxyActivities<WithdrawalActivities>({
    taskQueue: TaskQueues.WITHDRAWAL,
    startToCloseTimeout: '30 seconds',
    retry: {
      maximumAttempts: 3,
      initialInterval: '1 second',
      backoffCoefficient: 2,
    },
  });

  const depositActivities = proxyActivities<DepositActivities>({
    taskQueue: TaskQueues.DEPOSIT,
    startToCloseTimeout: '30 seconds',
    retry: {
      maximumAttempts: 3,
      initialInterval: '1 second',
      backoffCoefficient: 2,
    },
  });

  const refundActivities = proxyActivities<RefundActivities>({
    taskQueue: TaskQueues.MAIN_WORKFLOW,
    startToCloseTimeout: '30 seconds',
    retry: {
      maximumAttempts: 3,
      initialInterval: '1 second',
      backoffCoefficient: 2,
    },
  });

  console.log(`Starting multi-language money transfer: $${paymentDetails.amount} from ${paymentDetails.sourceAccount} to ${paymentDetails.targetAccount}`);

  // Step 1: Withdrawal (Go)
  let withdrawResult: ActivityResult;
  try {
    withdrawResult = await withdrawalActivities.withdraw(paymentDetails);
    console.log(`Withdrawal successful: ${withdrawResult.transactionId}`);
  } catch (error) {
    throw ApplicationFailure.create({
      message: `Withdrawal failed: ${error}`,
      type: 'WithdrawalError',
    });
  }

  // Step 2: Deposit (Python)
  let depositResult: ActivityResult;
  try {
    depositResult = await depositActivities.deposit(paymentDetails);
    console.log(`Deposit successful: ${depositResult.transactionId}`);
  } catch (depositError) {
    console.log(`Deposit failed, initiating refund: ${depositError}`);

    // Step 3: Refund (TypeScript)
    try {
      const refundResult = await refundActivities.refund(paymentDetails);
      console.log(`Refund successful: ${refundResult.transactionId}`);

      throw ApplicationFailure.create({
        message: `Deposit failed, but refund succeeded: ${depositError}`,
        type: 'DepositFailedWithRefund',
      });
    } catch (refundError) {
      throw ApplicationFailure.create({
        message: `Critical failure: Deposit failed and refund also failed: ${refundError}`,
        type: 'CriticalFailure',
      });
    }
  }

  return `Multi-language transfer complete! Withdrawal: ${withdrawResult.transactionId}, Deposit: ${depositResult.transactionId}`;
}