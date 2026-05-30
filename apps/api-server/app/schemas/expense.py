from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ExpenseCreate(BaseModel):
    category: str
    amount: float
    note: Optional[str] = None

class ExpenseResponse(BaseModel):
    id: int
    category: str
    amount: float
    note: Optional[str]
    created_at: datetime
