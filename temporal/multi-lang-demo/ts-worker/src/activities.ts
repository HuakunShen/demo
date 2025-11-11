import { log } from "@temporalio/activity";
import type { PaymentDetails, ActivityResult } from "./shared";

export async function refund(
  paymentDetails: PaymentDetails
): Promise<ActivityResult> {
  log.info(
    `TypeScript: Starting refund of $${paymentDetails.amount} to account ${paymentDetails.sourceAccount} (Ref: ${paymentDetails.referenceId})`
  );

  // Simulate processing time
  // await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));

  const transactionId = `R-${Date.now()}-${paymentDetails.referenceId}`;

  const result: ActivityResult = {
    success: true,
    transactionId,
    message: `Successfully refunded $${paymentDetails.amount} to account ${paymentDetails.sourceAccount}`,
  };

  log.info(`TypeScript: Refund completed. Transaction ID: ${transactionId}`);
  return result;
}

// Export activities for registration
export const activities = { refund };
