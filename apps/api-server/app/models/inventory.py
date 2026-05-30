from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base

class Inventory(Base):
    __tablename__ = "inventory"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50))
    quantity = Column(Integer, default=0)
    min_quantity = Column(Integer, default=5)
    unit = Column(String(20))
    price = Column(Float, default=0)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    branch_id = Column(Integer, ForeignKey("branches.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    tenant = relationship("Tenant", back_populates="inventory_items")
    branch = relationship("Branch", back_populates="inventory_items")
    transactions = relationship("InventoryTransaction", back_populates="item")

class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("inventory.id"))
    type = Column(String(20))  # 'in' / 'out'
    quantity = Column(Integer)
    reason = Column(String(200))
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    item = relationship("Inventory", back_populates="transactions")
