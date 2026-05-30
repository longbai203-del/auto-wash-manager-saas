from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class OrderItemCreate(BaseModel):
    item_name: str
    item_type: str
    quantity: int = 1
    unit_price: float
    total: float

class OrderCreate(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    plate_number: str
    vehicle_type: str
    service_type: str
    subtotal: float
    vat_amount: float
    total_amount: float
    discount: float = 0
    payment_method: str
    notes: Optional[str] = None
    items: List[OrderItemCreate]

class OrderResponse(BaseModel):
    id: int
    order_number: str
    customer_name: Optional[str]
    customer_phone: Optional[str]
    plate_number: str
    vehicle_type: str
    service_type: str
    subtotal: float
    vat_amount: float
    total_amount: float
    discount: float
    payment_method: str
    status: str
    cashier_name: Optional[str]
    created_at: datetime
