from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, date, timedelta

from app.core.database import get_db
from app.core.auth import get_current_user, require_roles
from app.models.user import User
from app.models.order import Order
from app.models.expense import Expense

router = APIRouter()

@router.get("/daily")
async def get_daily_report(
    report_date: date = Query(default=date.today()),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "admin", "manager"]))
):
    query = db.query(Order).filter(
        Order.tenant_id == current_user.tenant_id,
        func.date(Order.created_at) == report_date
    )
    
    orders = query.all()
    total_orders = len(orders)
    total_revenue = sum(o.total_amount for o in orders)
    total_vat = sum(o.vat_amount for o in orders)
    total_discount = sum(o.discount for o in orders)
    
    # 按支付方式统计
    payment_stats = {}
    for o in orders:
        payment_stats[o.payment_method] = payment_stats.get(o.payment_method, 0) + o.total_amount
    
    # 按服务类型统计
    service_stats = {}
    for o in orders:
        service_stats[o.service_type] = service_stats.get(o.service_type, 0) + 1
    
    return {
        "date": report_date.isoformat(),
        "total_orders": total_orders,
        "total_revenue": round(total_revenue, 2),
        "total_vat": round(total_vat, 2),
        "total_discount": round(total_discount, 2),
        "average_order": round(total_revenue / total_orders if total_orders > 0 else 0, 2),
        "payment_stats": payment_stats,
        "service_stats": service_stats
    }

@router.get("/monthly")
async def get_monthly_report(
    year: int = Query(default=datetime.now().year),
    month: int = Query(default=datetime.now().month),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "admin", "manager"]))
):
    query = db.query(Order).filter(
        Order.tenant_id == current_user.tenant_id,
        extract('year', Order.created_at) == year,
        extract('month', Order.created_at) == month
    )
    
    orders = query.all()
    
    # 按日统计
    daily_stats = {}
    for o in orders:
        day = o.created_at.day
        if day not in daily_stats:
            daily_stats[day] = {"orders": 0, "revenue": 0}
        daily_stats[day]["orders"] += 1
        daily_stats[day]["revenue"] += o.total_amount
    
    daily_list = [{"day": d, "orders": stats["orders"], "revenue": round(stats["revenue"], 2)} 
                  for d, stats in daily_stats.items()]
    
    total_revenue = sum(o.total_amount for o in orders)
    total_vat = sum(o.vat_amount for o in orders)
    
    return {
        "year": year,
        "month": month,
        "total_orders": len(orders),
        "total_revenue": round(total_revenue, 2),
        "total_vat": round(total_vat, 2),
        "daily_stats": daily_list
    }

@router.get("/yearly")
async def get_yearly_report(
    year: int = Query(default=datetime.now().year),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "admin", "manager"]))
):
    query = db.query(Order).filter(
        Order.tenant_id == current_user.tenant_id,
        extract('year', Order.created_at) == year
    )
    
    orders = query.all()
    
    # 按月统计
    monthly_stats = {}
    for o in orders:
        month = o.created_at.month
        if month not in monthly_stats:
            monthly_stats[month] = {"orders": 0, "revenue": 0}
        monthly_stats[month]["orders"] += 1
        monthly_stats[month]["revenue"] += o.total_amount
    
    monthly_list = [{"month": m, "orders": stats["orders"], "revenue": round(stats["revenue"], 2)} 
                    for m, stats in monthly_stats.items()]
    
    total_revenue = sum(o.total_amount for o in orders)
    total_vat = sum(o.vat_amount for o in orders)
    
    return {
        "year": year,
        "total_orders": len(orders),
        "total_revenue": round(total_revenue, 2),
        "total_vat": round(total_vat, 2),
        "monthly_stats": monthly_list
    }
