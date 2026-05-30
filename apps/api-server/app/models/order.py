from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, nullable=False, index=True)
    customer_name = Column(String(100))
    customer_phone = Column(String(20))
    plate_number = Column(String(20), index=True)
    vehicle_type = Column(String(50))
    service_type = Column(String(100))
    subtotal = Column(Float, default=0)
    vat_amount = Column(Float, default=0)
    total_amount = Column(Float, default=0)
    discount = Column(Float, default=0)
    payment_method = Column(String(50))
    status = Column(String(20), default="completed")
    plate_photo_url = Column(String(500))
    notes = Column(Text)
    cashier_id = Column(Integer, ForeignKey("users.id"))
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    branch_id = Column(Integer, ForeignKey("branches.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    cashier = relationship("User", back_populates="orders")
    tenant = relationship("Tenant", back_populates="orders")
    branch = relationship("Branch", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="order", uselist=False)

class OrderItem(Base):
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    item_name = Column(String(100))
    item_type = Column(String(50))
    quantity = Column(Integer, default=1)
    unit_price = Column(Float)
    total = Column(Float)
    
    # Relationships
    order = relationship("Order", back_populates="items")

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), unique=True)
    amount = Column(Float)
    method = Column(String(50))
    status = Column(String(20), default="completed")
    transaction_id = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    order = relationship("Order", back_populates="payment")
