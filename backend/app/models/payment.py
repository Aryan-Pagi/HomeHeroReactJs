from sqlalchemy import Column, String, DateTime, Float, Enum as SQLEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from enum import Enum
import uuid

from app.core.database import Base


class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentMethod(str, Enum):
    RAZORPAY = "razorpay"
    STRIPE = "stripe"
    CASH = "cash"


class Payment(Base):
    __tablename__ = "payments"

    payment_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.booking_id"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(SQLEnum(PaymentMethod), nullable=False)
    status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING)
    
    # Payment gateway specific fields
    transaction_id = Column(String)  # Razorpay/Stripe transaction ID
    order_id = Column(String)  # Razorpay order ID
    payment_signature = Column(String)  # For verification
    
    # Metadata
    currency = Column(String, default="INR")
    payment_date = Column(DateTime(timezone=True))
    failure_reason = Column(String)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    booking = relationship("Booking", foreign_keys=[booking_id])
