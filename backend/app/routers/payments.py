from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
import hmac
import hashlib

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.config import settings
from app.schemas.payment import (
    PaymentOrderCreate,
    PaymentOrderResponse,
    PaymentVerification,
    PaymentResponse,
    PaymentStatusResponse,
)
from app.models.payment import Payment, PaymentStatus, PaymentMethod
from app.models.booking import Booking
from app.models.user import User
from app.models.notification import Notification

router = APIRouter()


@router.post("/create-order", response_model=PaymentOrderResponse)
async def create_payment_order(
    order_data: PaymentOrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a payment order (Razorpay or Stripe)"""
    
    # Verify booking exists and belongs to user
    booking = db.query(Booking).filter(Booking.booking_id == order_data.booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )
    
    if str(booking.customer_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only pay for your own bookings",
        )
    
    # Create payment record
    payment = Payment(
        booking_id=order_data.booking_id,
        amount=order_data.amount,
        payment_method=order_data.payment_method,
        status=PaymentStatus.PENDING,
        currency="INR",
    )
    
    # Generate order ID based on payment method
    if order_data.payment_method == PaymentMethod.RAZORPAY:
        # In production, integrate with Razorpay SDK to create actual order
        # import razorpay
        # client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        # razorpay_order = client.order.create({
        #     'amount': int(order_data.amount * 100),  # Convert to paise
        #     'currency': 'INR',
        #     'payment_capture': 1
        # })
        # payment.order_id = razorpay_order['id']
        
        # For now, generate a mock order ID
        payment.order_id = f"order_{payment.payment_id}"
        
    elif order_data.payment_method == PaymentMethod.STRIPE:
        # In production, integrate with Stripe SDK
        # import stripe
        # stripe.api_key = settings.STRIPE_SECRET_KEY
        # intent = stripe.PaymentIntent.create(
        #     amount=int(order_data.amount * 100),
        #     currency='inr',
        # )
        # payment.order_id = intent.id
        
        payment.order_id = f"pi_{payment.payment_id}"
    
    db.add(payment)
    db.commit()
    db.refresh(payment)
    
    return PaymentOrderResponse(
        order_id=payment.order_id,
        amount=payment.amount,
        currency=payment.currency,
        key_id=settings.RAZORPAY_KEY_ID if order_data.payment_method == PaymentMethod.RAZORPAY else None,
    )


@router.post("/verify-payment", response_model=dict)
async def verify_payment(
    verification_data: PaymentVerification,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Verify payment signature and update payment status"""
    
    payment = db.query(Payment).filter(Payment.payment_id == verification_data.payment_id).first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found",
        )
    
    # Verify payment belongs to user's booking
    booking = db.query(Booking).filter(Booking.booking_id == payment.booking_id).first()
    if str(booking.customer_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    # Verify signature for Razorpay
    if payment.payment_method == PaymentMethod.RAZORPAY:
        if not all([
            verification_data.razorpay_order_id,
            verification_data.razorpay_payment_id,
            verification_data.razorpay_signature,
        ]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing Razorpay verification data",
            )
        
        # Verify signature
        generated_signature = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode() if settings.RAZORPAY_KEY_SECRET else b"",
            f"{verification_data.razorpay_order_id}|{verification_data.razorpay_payment_id}".encode(),
            hashlib.sha256,
        ).hexdigest()
        
        # For demo purposes, we'll accept any signature if RAZORPAY_KEY_SECRET is not set
        # In production, always verify the signature
        if settings.RAZORPAY_KEY_SECRET and generated_signature != verification_data.razorpay_signature:
            payment.status = PaymentStatus.FAILED
            payment.failure_reason = "Invalid signature"
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment verification failed - invalid signature",
            )
        
        payment.transaction_id = verification_data.razorpay_payment_id
        payment.payment_signature = verification_data.razorpay_signature
    
    elif payment.payment_method == PaymentMethod.STRIPE:
        if not verification_data.stripe_payment_intent_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing Stripe payment intent ID",
            )
        payment.transaction_id = verification_data.stripe_payment_intent_id
    
    # Update payment status
    payment.status = PaymentStatus.COMPLETED
    payment.payment_date = datetime.utcnow()
    
    # Update booking final price
    booking.final_price = payment.amount
    
    db.commit()
    
    # Create notification for provider
    provider_notification = Notification(
        user_id=booking.provider.user_id,
        type="payment_received",
        message=f"Payment of ₹{payment.amount} received for booking #{booking.booking_id}",
    )
    db.add(provider_notification)
    
    # Create notification for customer
    customer_notification = Notification(
        user_id=booking.customer_id,
        type="payment_confirmed",
        message=f"Your payment of ₹{payment.amount} has been confirmed",
    )
    db.add(customer_notification)
    
    db.commit()
    
    return {
        "success": True,
        "message": "Payment verified successfully",
        "payment_id": str(payment.payment_id),
        "status": payment.status,
    }


@router.get("/payment-status/{payment_id}", response_model=PaymentStatusResponse)
async def get_payment_status(
    payment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get payment status"""
    
    payment = db.query(Payment).filter(Payment.payment_id == payment_id).first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found",
        )
    
    # Verify access
    booking = db.query(Booking).filter(Booking.booking_id == payment.booking_id).first()
    if str(booking.customer_id) != str(current_user.id) and current_user.user_type != "admin":
        if current_user.user_type == "provider":
            if str(booking.provider.user_id) != str(current_user.id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied",
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )
    
    return PaymentStatusResponse(
        payment_id=payment.payment_id,
        status=payment.status,
        transaction_id=payment.transaction_id,
        amount=payment.amount,
        payment_date=payment.payment_date,
    )


@router.get("/booking/{booking_id}", response_model=PaymentResponse)
async def get_booking_payment(
    booking_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get payment details for a booking"""
    
    # Verify booking exists
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )
    
    # Verify access
    if str(booking.customer_id) != str(current_user.id) and current_user.user_type != "admin":
        if current_user.user_type == "provider":
            if str(booking.provider.user_id) != str(current_user.id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied",
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )
    
    # Get payment for booking
    payment = db.query(Payment).filter(Payment.booking_id == booking_id).first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No payment found for this booking",
        )
    
    return payment
