import { Connection, Client, WorkflowHandle } from '@temporalio/client';
import { multiLanguageMoneyTransfer } from './workflows';
import type { PaymentDetails } from './shared';
import { TaskQueues } from './shared';

interface TestConfig {
  totalRequests: number;
  concurrentBatches: number;
  batchSize: number;
}

interface RequestMetrics {
  workflowId: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  error?: string;
}

interface TestResults {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalDuration: number;
  metrics: RequestMetrics[];
  statistics: {
    min: number;
    max: number;
    mean: number;
    median: number;
    p50: number;
    p90: number;
    p95: number;
    p99: number;
    throughput: number; // requests per second
  };
}

async function runSingleWorkflow(
  client: Client,
  paymentDetails: PaymentDetails,
  workflowId: string
): Promise<RequestMetrics> {
  const startTime = Date.now();
  
  try {
    const handle = await client.workflow.start(multiLanguageMoneyTransfer, {
      taskQueue: TaskQueues.MAIN_WORKFLOW,
      workflowId,
      args: [paymentDetails],
    });

    await handle.result();
    
    const endTime = Date.now();
    return {
      workflowId,
      startTime,
      endTime,
      duration: endTime - startTime,
      success: true,
    };
  } catch (error) {
    const endTime = Date.now();
    return {
      workflowId,
      startTime,
      endTime,
      duration: endTime - startTime,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function runBatch(
  client: Client,
  batchNumber: number,
  batchSize: number
): Promise<RequestMetrics[]> {
  const promises: Promise<RequestMetrics>[] = [];

  for (let i = 0; i < batchSize; i++) {
    const requestNumber = batchNumber * batchSize + i + 1;
    const paymentDetails: PaymentDetails = {
      amount: 100.00 + Math.random() * 900, // Random amount between $100-$1000
      sourceAccount: `ACC-SRC-${String(requestNumber).padStart(5, '0')}`,
      targetAccount: `ACC-TGT-${String(requestNumber).padStart(5, '0')}`,
      referenceId: `STRESS-TEST-${String(requestNumber).padStart(5, '0')}`,
    };

    const workflowId = `stress-test-${Date.now()}-${requestNumber}`;
    promises.push(runSingleWorkflow(client, paymentDetails, workflowId));
  }

  return Promise.all(promises);
}

function calculateStatistics(metrics: RequestMetrics[]): TestResults['statistics'] {
  const successfulMetrics = metrics.filter(m => m.success);
  const durations = successfulMetrics.map(m => m.duration).sort((a, b) => a - b);
  
  if (durations.length === 0) {
    return {
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      p50: 0,
      p90: 0,
      p95: 0,
      p99: 0,
      throughput: 0,
    };
  }

  const sum = durations.reduce((acc, val) => acc + val, 0);
  const mean = sum / durations.length;
  
  const getPercentile = (p: number) => {
    const index = Math.ceil((p / 100) * durations.length) - 1;
    return durations[Math.max(0, index)];
  };

  const totalDurationSeconds = (Math.max(...metrics.map(m => m.endTime)) - 
                                Math.min(...metrics.map(m => m.startTime))) / 1000;
  const throughput = successfulMetrics.length / totalDurationSeconds;

  return {
    min: durations[0],
    max: durations[durations.length - 1],
    mean,
    median: getPercentile(50),
    p50: getPercentile(50),
    p90: getPercentile(90),
    p95: getPercentile(95),
    p99: getPercentile(99),
    throughput,
  };
}

function printResults(results: TestResults): void {
  console.log('\n' + '='.repeat(80));
  console.log('📊 STRESS TEST RESULTS');
  console.log('='.repeat(80));
  
  console.log('\n📈 Overview:');
  console.log(`  Total Requests:      ${results.totalRequests}`);
  console.log(`  Successful:          ${results.successfulRequests} (${(results.successfulRequests / results.totalRequests * 100).toFixed(1)}%)`);
  console.log(`  Failed:              ${results.failedRequests} (${(results.failedRequests / results.totalRequests * 100).toFixed(1)}%)`);
  console.log(`  Total Test Duration: ${(results.totalDuration / 1000).toFixed(2)}s`);
  
  console.log('\n⏱️  Latency Statistics (ms):');
  console.log(`  Minimum:             ${results.statistics.min.toFixed(2)} ms`);
  console.log(`  Maximum:             ${results.statistics.max.toFixed(2)} ms`);
  console.log(`  Mean (Average):      ${results.statistics.mean.toFixed(2)} ms`);
  console.log(`  Median (P50):        ${results.statistics.median.toFixed(2)} ms`);
  console.log(`  P90:                 ${results.statistics.p90.toFixed(2)} ms`);
  console.log(`  P95:                 ${results.statistics.p95.toFixed(2)} ms`);
  console.log(`  P99:                 ${results.statistics.p99.toFixed(2)} ms`);
  
  console.log('\n🚀 Throughput:');
  console.log(`  Requests/Second:     ${results.statistics.throughput.toFixed(2)} req/s`);
  
  if (results.failedRequests > 0) {
    console.log('\n❌ Failed Requests:');
    const failedMetrics = results.metrics.filter(m => !m.success);
    failedMetrics.slice(0, 5).forEach(metric => {
      console.log(`  - ${metric.workflowId}: ${metric.error}`);
    });
    if (failedMetrics.length > 5) {
      console.log(`  ... and ${failedMetrics.length - 5} more`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
}

async function runStressTest(config: TestConfig): Promise<TestResults> {
  console.log('🔌 Connecting to Temporal server...');
  const connection = await Connection.connect({ address: 'localhost:7233' });
  const client = new Client({ connection, namespace: 'default' });
  
  console.log('\n🚀 Starting Stress Test');
  console.log('─'.repeat(80));
  console.log(`Configuration:`);
  console.log(`  Total Requests:      ${config.totalRequests}`);
  console.log(`  Concurrent Batches:  ${config.concurrentBatches}`);
  console.log(`  Batch Size:          ${config.batchSize}`);
  console.log(`  Requests per Batch:  ${config.concurrentBatches * config.batchSize}`);
  console.log('─'.repeat(80));
  
  const testStartTime = Date.now();
  const allMetrics: RequestMetrics[] = [];
  
  const totalBatches = Math.ceil(config.totalRequests / (config.concurrentBatches * config.batchSize));
  
  for (let batchSet = 0; batchSet < totalBatches; batchSet++) {
    const remainingRequests = config.totalRequests - allMetrics.length;
    const batchesInThisSet = Math.min(config.concurrentBatches, Math.ceil(remainingRequests / config.batchSize));
    
    console.log(`\n📦 Running batch set ${batchSet + 1}/${totalBatches} (${batchesInThisSet} concurrent batches)...`);
    
    const batchPromises: Promise<RequestMetrics[]>[] = [];
    for (let i = 0; i < batchesInThisSet; i++) {
      const batchNumber = batchSet * config.concurrentBatches + i;
      const batchSize = Math.min(
        config.batchSize,
        remainingRequests - (i * config.batchSize)
      );
      
      if (batchSize > 0) {
        batchPromises.push(runBatch(client, batchNumber, batchSize));
      }
    }
    
    const batchResults = await Promise.all(batchPromises);
    const batchMetrics = batchResults.flat();
    allMetrics.push(...batchMetrics);
    
    const successCount = batchMetrics.filter(m => m.success).length;
    const avgDuration = batchMetrics.reduce((sum, m) => sum + m.duration, 0) / batchMetrics.length;
    
    console.log(`   ✓ Completed: ${successCount}/${batchMetrics.length} successful (avg: ${avgDuration.toFixed(2)}ms)`);
    console.log(`   Progress: ${allMetrics.length}/${config.totalRequests} total requests`);
  }
  
  const testEndTime = Date.now();
  const totalDuration = testEndTime - testStartTime;
  
  const successfulRequests = allMetrics.filter(m => m.success).length;
  const failedRequests = allMetrics.filter(m => !m.success).length;
  
  const results: TestResults = {
    totalRequests: config.totalRequests,
    successfulRequests,
    failedRequests,
    totalDuration,
    metrics: allMetrics,
    statistics: calculateStatistics(allMetrics),
  };
  
  return results;
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   Multi-Language Temporal Workflow - Stress Test Client       ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const totalRequests = parseInt(args[0]) || 20;
  const concurrentBatches = parseInt(args[1]) || 2;
  const batchSize = parseInt(args[2]) || 5;
  
  const config: TestConfig = {
    totalRequests,
    concurrentBatches,
    batchSize,
  };
  
  try {
    const results = await runStressTest(config);
    printResults(results);
    
    // Export results to JSON file
    const resultsJson = JSON.stringify(results, null, 2);
    const fs = require('fs');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `stress-test-results-${timestamp}.json`;
    fs.writeFileSync(filename, resultsJson);
    console.log(`\n💾 Results saved to: ${filename}`);
    
    process.exit(results.failedRequests > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Stress test failed:', error);
    process.exit(1);
  }
}

main();

