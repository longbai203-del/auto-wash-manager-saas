from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base

class Tenant(Base):
    __tablename__ = "tenants"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    logo_url = Column(String(500))
    timezone = Column(String(50), default="Asia/Riyadh")
    currency = Column(String(3), default="SAR")
    vat_rate = Column(Float, default=15.0)
    status = Column(String(20), default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    users = relationship("User", back_populates="tenant")
    branches = relationship("Branch", back_populates="tenant")
    orders = relationship("Order", back_populates="tenant")
    expenses = relationship("Expense", back_populates="tenant")
    inventory_items = relationship("Inventory", back_populates="tenant")
    members = relationship("Member", back_populates="tenant")
