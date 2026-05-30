from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from app.core.database import get_db
from app.core.auth import get_current_user, require_roles
from app.models.user import User
from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate, ExpenseResponse

router = APIRouter()

@router.get("/", response_model=List[ExpenseResponse])
async def get_expenses(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "admin", "manager"]))
):
    expenses = db.query(Expense).filter(
        Expense.tenant_id == current_user.tenant_id
    ).order_by(Expense.created_at.desc()).limit(100).all()
    return expenses

@router.post("/", response_model=ExpenseResponse)
async def create_expense(
    expense_data: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "admin", "manager"]))
):
    new_expense = Expense(
        category=expense_data.category,
        amount=expense_data.amount,
        note=expense_data.note,
        created_by=current_user.id,
        tenant_id=current_user.tenant_id,
        branch_id=current_user.branch_id
    )
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    return new_expense
