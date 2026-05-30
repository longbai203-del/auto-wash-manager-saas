from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base

class Member(Base):
    __tablename__ = "members"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), unique=True, nullable=False, index=True)
    email = Column(String(255))
    level = Column(String(50), default="normal")
    discount_rate = Column(Float, default=0)
    balance = Column(Float, default=0)
    points = Column(Integer, default=0)
    total_spent = Column(Float, default=0)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    tenant = relationship("Tenant", back_populates="members")
    transactions = relationship("MemberTransaction", back_populates="member")

class MemberTransaction(Base):
    __tablename__ = "member_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("members.id"))
    type = Column(String(20))  # 'recharge', 'spend', 'points_earn', 'points_redeem'
    amount = Column(Float)
    points = Column(Integer)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    member = relationship("Member", back_populates="transactions")
