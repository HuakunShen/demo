import { Connection, Client } from '@temporalio/client';
import { multiLanguageMoneyTransfer } from './workflows';
import type { PaymentDetails } from './shared';
import { TaskQueues } from './shared';

async function run() {
  console.log('Connecting to Temporal server...');
  const connection = await Connection.connect({ address: 'localhost:7233' });

  const client = new Client({
    connection,
    namespace: 'default',
  });

  // Sample payment details
  const paymentDetails: PaymentDetails = {
    amount: 100.00,
    sourceAccount: 'ACC-12345',
    targetAccount: 'ACC-67890',
    referenceId: 'DEMO-001',
  };

  console.log('Starting multi-language money transfer workflow...');
  console.log(`Transfer Details:`);
  console.log(`  Amount: $${paymentDetails.amount}`);
  console.log(`  From: ${paymentDetails.sourceAccount}`);
  console.log(`  To: ${paymentDetails.targetAccount}`);
  console.log(`  Reference: ${paymentDetails.referenceId}`);
  console.log('\nArchitecture:');
  console.log('  TypeScript: Workflow Orchestrator + Refund Activity');
  console.log('  Go: Withdrawal Activity');
  console.log('  Python: Deposit Activity');
  console.log('');

  const handle = await client.workflow.start(multiLanguageMoneyTransfer, {
    taskQueue: TaskQueues.MAIN_WORKFLOW,
    workflowId: `multi-lang-transfer-${paymentDetails.referenceId}-${Date.now()}`,
    args: [paymentDetails],
  });

  console.log(`Started workflow: ${handle.workflowId}`);

  console.log('Waiting for workflow completion...');
  try {
    const result = await handle.result();
    console.log('\n✅ Workflow completed successfully!');
    console.log(`Result: ${result}`);
  } catch (error) {
    console.log('\n❌ Workflow failed!');
    console.error(`Error: ${error}`);
  }

  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});