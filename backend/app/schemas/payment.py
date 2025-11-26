from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID
from enum import Enum


class PaymentMethodEnum(str, Enum):
    RAZORPAY = "razorpay"
    STRIPE = "stripe"
    CASH = "cash"


class PaymentStatusEnum(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentOrderCreate(BaseModel):
    booking_id: UUID
    amount: float = Field(..., gt=0, description="Payment amount in INR")
    payment_method: PaymentMethodEnum = PaymentMethodEnum.RAZORPAY


class PaymentOrderResponse(BaseModel):
    order_id: str
    amount: float
    currency: str = "INR"
    key_id: Optional[str] = None  # Razorpay key for frontend


class PaymentVerification(BaseModel):
    payment_id: UUID
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    razorpay_signature: Optional[str] = None
    stripe_payment_intent_id: Optional[str] = None


class PaymentResponse(BaseModel):
    payment_id: UUID
    booking_id: UUID
    amount: float
    payment_method: PaymentMethodEnum
    status: PaymentStatusEnum
    transaction_id: Optional[str] = None
    order_id: Optional[str] = None
    currency: str = "INR"
    payment_date: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PaymentStatusResponse(BaseModel):
    payment_id: UUID
    status: PaymentStatusEnum
    transaction_id: Optional[str] = None
    amount: float
    payment_date: Optional[datetime] = None
