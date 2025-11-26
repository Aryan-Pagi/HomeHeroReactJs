# Payment Integration Guide

## Overview
HomeHero now supports online payment processing for service bookings using Razorpay (primary) and Stripe (alternative).

## Features
- ✅ Secure payment processing
- ✅ Razorpay integration (India-focused)
- ✅ Stripe integration (Global)
- ✅ Payment verification
- ✅ Booking-payment linking
- ✅ Payment status tracking
- ✅ Failed payment handling
- ✅ Refund support (backend)

## Setup Instructions

### 1. Frontend Setup

#### Install Dependencies
```bash
cd frontend
# No additional dependencies needed - using CDN scripts
```

#### Configure Environment Variables
```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your keys
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
VITE_API_URL=http://localhost:8000/api
```

### 2. Backend Setup

#### Add Payment Routes
The backend should have these endpoints:

```python
# /api/payments/razorpay/create-order
POST - Create Razorpay order
Body: { "booking_id": "uuid", "amount": 500, "currency": "INR" }
Returns: { "order_id": "order_xxx", "amount": 50000, "currency": "INR" }

# /api/payments/razorpay/verify
POST - Verify Razorpay payment
Body: {
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx",
  "booking_id": "uuid"
}
Returns: { "success": true, "payment_id": "pay_xxx" }

# /api/payments/{payment_id}/status
GET - Get payment status
Returns: { "status": "captured|failed|pending", "amount": 500 }
```

#### Backend Environment Variables
```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxx_secret

STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
```

## Usage

### For Customers

1. **Browse Services**: Navigate to home and search for providers
2. **Select Provider**: Click on a provider card to view profile
3. **Create Booking**: Fill in booking details (service, date, instructions)
4. **Make Payment**: After booking creation, payment modal appears automatically
5. **Complete Payment**: 
   - Enter card details in Razorpay checkout
   - Payment is verified automatically
   - Booking status updated to "paid"
6. **View Bookings**: Navigate to "My Bookings" to see booking status

### Payment Flow

```
User clicks "Confirm Booking"
    ↓
Booking created in database (status: "pending")
    ↓
Payment modal opens with booking details
    ↓
User clicks "Pay ₹500"
    ↓
Backend creates Razorpay order
    ↓
Razorpay checkout opens
    ↓
User enters payment details
    ↓
Payment processed by Razorpay
    ↓
Payment signature verified on backend
    ↓
Booking status updated to "confirmed"
    ↓
User redirected to "My Bookings"
```

## Payment Modal Features

- **Booking Summary**: Shows service, provider, date, and amount
- **Secure Payment**: SSL encrypted with Razorpay
- **Error Handling**: User-friendly error messages
- **Loading States**: Visual feedback during processing
- **Success Animation**: Confirmation with checkmark
- **Cancel Option**: Users can cancel and pay later

## Testing

### Test Cards (Razorpay Test Mode)

**Successful Payment:**
- Card: 4111 1111 1111 1111
- Expiry: Any future date
- CVV: Any 3 digits
- Name: Any name

**Failed Payment:**
- Card: 4000 0000 0000 0002
- This will trigger a payment failure

**Network Error:**
- Card: 4000 0000 0000 0119
- Simulates network issues

### Test Mode vs Production

**Test Mode:**
- Use test keys: `rzp_test_xxxxx`
- No real money transferred
- Use test cards above

**Production Mode:**
- Use live keys: `rzp_live_xxxxx`
- Real payments processed
- Requires business verification

## Security Best Practices

1. **Never expose secret keys** in frontend code
2. **Always verify payments** on backend using signature
3. **Use HTTPS** in production
4. **Validate amounts** on backend before creating orders
5. **Log all transactions** for audit trail
6. **Handle failures gracefully** with retry mechanisms
7. **Store payment IDs** for reconciliation

## Troubleshooting

### Payment Modal Not Opening
- Check if Razorpay script is loaded: `window.Razorpay`
- Verify environment variable: `VITE_RAZORPAY_KEY_ID`
- Check browser console for errors

### Payment Verification Failing
- Ensure signature verification logic is correct on backend
- Check if webhook secret matches
- Verify order_id and payment_id are valid

### Amount Mismatch
- Backend should use smallest currency unit (paise for INR)
- ₹500 = 50000 paise
- Frontend displays in rupees, backend processes in paise

## API Integration Examples

### Backend (Python/FastAPI)

```python
import razorpay
from fastapi import APIRouter

router = APIRouter()
client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

@router.post("/payments/razorpay/create-order")
async def create_order(booking_id: str, amount: int):
    order = client.order.create({
        "amount": amount * 100,  # Convert to paise
        "currency": "INR",
        "receipt": f"booking_{booking_id}",
        "payment_capture": 1
    })
    return order

@router.post("/payments/razorpay/verify")
async def verify_payment(data: dict):
    try:
        client.utility.verify_payment_signature(data)
        # Update booking status to confirmed
        return {"success": True}
    except:
        return {"success": False, "error": "Invalid signature"}
```

## Webhooks (Optional)

For production, set up webhooks to handle:
- Payment success notifications
- Payment failure notifications
- Refund notifications

Webhook URL: `https://your-domain.com/api/webhooks/razorpay`

## Support

For payment gateway specific issues:
- **Razorpay**: https://razorpay.com/support/
- **Stripe**: https://support.stripe.com/

For HomeHero integration issues:
- Check backend logs for payment errors
- Verify booking_id exists before payment
- Ensure user is authenticated

## Future Enhancements

- [ ] Add payment history page
- [ ] Support for partial payments
- [ ] Multiple payment methods (UPI, Wallets, Net Banking)
- [ ] Automatic refunds for cancellations
- [ ] Payment receipts via email
- [ ] EMI options for high-value services
- [ ] Recurring payments for subscriptions
