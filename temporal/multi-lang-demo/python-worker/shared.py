from dataclasses import dataclass
from typing import NamedTuple

@dataclass
class PaymentDetails:
    amount: float
    sourceAccount: str
    targetAccount: str
    referenceId: str

@dataclass
class ActivityResult:
    success: bool
    transactionId: str
    message: str

class TaskQueues:
    DEPOSIT = "DEPOSIT_QUEUE"