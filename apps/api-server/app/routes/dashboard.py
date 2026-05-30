from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.auth import get_current_user, require_tenant
from app.models.user import User
from app.models.order import Order
from app.models.expense import Expense
from app.models.member import Member

router = APIRouter()

@router.get("/stats")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: int = Depends(require_tenant)
):
    today = datetime.now().date()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    
    # 今日订单
    today_orders = db.query(Order).filter(
        Order.tenant_id == tenant_id,
        func.date(Order.created_at) == today
    ).count()
    
    # 今日收入
    today_revenue = db.query(func.sum(Order.total_amount)).filter(
        Order.tenant_id == tenant_id,
        func.date(Order.created_at) == today
    ).scalar() or 0
    
    # 本周收入
    week_revenue = db.query(func.sum(Order.total_amount)).filter(
        Order.tenant_id == tenant_id,
        func.date(Order.created_at) >= week_ago
    ).scalar() or 0
    
    # 本月收入
    month_revenue = db.query(func.sum(Order.total_amount)).filter(
        Order.tenant_id == tenant_id,
        func.date(Order.created_at) >= month_ago
    ).scalar() or 0
    
    # 总订单数
    total_orders = db.query(Order).filter(Order.tenant_id == tenant_id).count()
    
    # 总客户数
    total_customers = db.query(Member).filter(Member.tenant_id == tenant_id).count()
    
    # 总支出
    total_expenses = db.query(func.sum(Expense.amount)).filter(
        Expense.tenant_id == tenant_id,
        func.date(Expense.created_at) >= month_ago
    ).scalar() or 0
    
    return {
        "today_orders": today_orders,
        "today_revenue": round(today_revenue, 2),
        "week_revenue": round(week_revenue, 2),
        "month_revenue": round(month_revenue, 2),
        "total_orders": total_orders,
        "total_customers": total_customers,
        "total_expenses": round(total_expenses, 2),
        "profit": round(month_revenue - total_expenses, 2)
    }

@router.get("/recent-orders")
async def get_recent_orders(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: int = Depends(require_tenant)
):
    orders = db.query(Order).filter(
        Order.tenant_id == tenant_id
    ).order_by(Order.created_at.desc()).limit(limit).all()
    
    return [
        {
            "id": o.id,
            "order_number": o.order_number,
            "plate_number": o.plate_number,
            "total_amount": o.total_amount,
            "status": o.status,
            "created_at": o.created_at.isoformat()
        }
        for o in orders
    ]
