from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date, datetime

from app.core.database import get_db
from app.core.auth import get_current_user, require_roles
from app.models.user import User
from app.models.order import Order, OrderItem, Payment
from app.models.inventory import Inventory, InventoryTransaction
from app.schemas.order import OrderCreate, OrderResponse

router = APIRouter()

@router.get("/", response_model=List[OrderResponse])
async def get_orders(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    status: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "admin", "manager", "cashier"]))
):
    query = db.query(Order)
    
    if current_user.tenant_id:
        query = query.filter(Order.tenant_id == current_user.tenant_id)
    
    if start_date:
        query = query.filter(func.date(Order.created_at) >= start_date)
    if end_date:
        query = query.filter(func.date(Order.created_at) <= end_date)
    if status:
        query = query.filter(Order.status == status)
    
    orders = query.order_by(Order.created_at.desc()).limit(limit).all()
    return orders

@router.post("/", response_model=OrderResponse)
async def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "admin", "manager", "cashier"]))
):
    # 生成订单号
    order_number = f"ORD-{datetime.now().strftime('%Y%m%d%H%M%S')}-{current_user.id}"
    
    # 创建订单
    new_order = Order(
        order_number=order_number,
        customer_name=order_data.customer_name,
        customer_phone=order_data.customer_phone,
        plate_number=order_data.plate_number.upper(),
        vehicle_type=order_data.vehicle_type,
        service_type=order_data.service_type,
        subtotal=order_data.subtotal,
        vat_amount=order_data.vat_amount,
        total_amount=order_data.total_amount,
        discount=order_data.discount,
        payment_method=order_data.payment_method,
        notes=order_data.notes,
        cashier_id=current_user.id,
        tenant_id=current_user.tenant_id,
        branch_id=current_user.branch_id
    )
    db.add(new_order)
    db.flush()
    
    # 添加订单项
    for item in order_data.items:
        order_item = OrderItem(
            order_id=new_order.id,
            item_name=item.item_name,
            item_type=item.item_type,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total=item.total
        )
        db.add(order_item)
        
        # 扣减库存（如果是消耗品）
        if item.item_type in ["chemical", "consumable"]:
            inventory_item = db.query(Inventory).filter(
                Inventory.name == item.item_name,
                Inventory.tenant_id == current_user.tenant_id
            ).first()
            if inventory_item:
                inventory_item.quantity -= item.quantity
                # 记录库存流水
                transaction = InventoryTransaction(
                    item_id=inventory_item.id,
                    type="out",
                    quantity=item.quantity,
                    reason=f"订单 {order_number}",
                    order_id=new_order.id
                )
                db.add(transaction)
    
    # 添加支付记录
    payment = Payment(
        order_id=new_order.id,
        amount=order_data.total_amount,
        method=order_data.payment_method,
        status="completed"
    )
    db.add(payment)
    
    db.commit()
    db.refresh(new_order)
    
    return new_order

@router.put("/{order_id}/status")
async def update_order_status(
    order_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "admin", "manager"]))
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.status = status
    db.commit()
    
    return {"message": "Status updated", "status": status}
