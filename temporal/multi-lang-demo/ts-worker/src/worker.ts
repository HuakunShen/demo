import { Worker } from '@temporalio/worker';
import { TaskQueues } from './shared';
import * as activities from './activities';

async function run() {
  console.log('TypeScript Worker starting for refund activities and workflows');

  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: TaskQueues.MAIN_WORKFLOW,
  });

  console.log(`TypeScript Worker started on queue: ${TaskQueues.MAIN_WORKFLOW}`);

  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});