from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base

class Branch(Base):
    __tablename__ = "branches"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    address = Column(String(500))
    phone = Column(String(20))
    manager_name = Column(String(100))
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    status = Column(String(20), default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    tenant = relationship("Tenant", back_populates="branches")
    users = relationship("User", back_populates="branch")
    orders = relationship("Order", back_populates="branch")
    inventory_items = relationship("Inventory", back_populates="branch")
