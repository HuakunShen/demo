from dataclasses import dataclass
from typing import NamedTuple

@dataclass
class PaymentDetails:
    amount: float
    source_account: str
    target_account: str
    reference_id: str

@dataclass
class ActivityResult:
    success: bool
    transaction_id: str
    message: str

class TaskQueues:
    MAIN_WORKFLOW = "MULTI_LANG_TRANSFER_QUEUE"
    WITHDRAWAL = "WITHDRAWAL_QUEUE"
    DEPOSIT = "DEPOSIT_QUEUE"
    REFUND = "REFUND_QUEUE"