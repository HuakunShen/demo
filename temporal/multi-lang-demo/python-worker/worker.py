import asyncio
import logging

from temporalio.client import Client
from temporalio.worker import Worker

from deposit_activities import deposit
from shared import TaskQueues

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("python-worker")

async def main():
    logger.info("Python Worker starting for deposit activities")

    # Connect to Temporal server
    client = await Client.connect("localhost:7233")

    # Create worker
    worker = Worker(
        client,
        task_queue=TaskQueues.DEPOSIT,
        activities=[deposit],
    )

    logger.info(f"Python Worker started on queue: {TaskQueues.DEPOSIT}")

    # Run the worker
    await worker.run()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Python Worker stopped")