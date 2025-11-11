import asyncio
import logging
import time
import uuid
from datetime import datetime

from temporalio import activity

from shared import PaymentDetails, ActivityResult

logging.basicConfig(level=logging.INFO)

logger = logging.getLogger("deposit-activity")

@activity.defn
async def deposit(payment_details: PaymentDetails) -> ActivityResult:
    """Deposit money into target account"""
    logger.info(f"Python: Starting deposit of ${payment_details.amount:.2f} to account {payment_details.targetAccount} (Ref: {payment_details.referenceId})")

    # Simulate processing time
    # await asyncio.sleep(0.2 + (hash(payment_details.referenceId) % 8) / 10)

    # Generate transaction ID
    transaction_id = f"D-{int(time.time())}-{payment_details.referenceId}"

    result = ActivityResult(
        success=True,
        transactionId=transaction_id,
        message=f"Successfully deposited ${payment_details.amount:.2f} to account {payment_details.targetAccount}"
    )

    logger.info(f"Python: Deposit completed. Transaction ID: {transaction_id}")
    return result