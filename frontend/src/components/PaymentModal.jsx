import { useState } from "react";
import {
  CreditCard,
  Loader,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  loadRazorpayScript,
  initiateRazorpayPayment,
  verifyRazorpayPayment,
} from "../services/payment";

/**
 * PaymentModal Component
 * Handles payment processing with Razorpay
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Modal visibility
 * @param {Function} props.onClose - Close handler
 * @param {Object} props.bookingDetails - Booking information
 * @param {Function} props.onSuccess - Success callback
 */
function PaymentModal({ isOpen, onClose, bookingDetails, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentStatus, setPaymentStatus] = useState(null); // 'success', 'failed', null

  if (!isOpen) return null;

  const handlePayment = async () => {
    setLoading(true);
    setError("");

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load payment gateway. Please try again.");
      }

      // Create order on backend
      const orderData = await initiateRazorpayPayment({
        booking_id: bookingDetails.booking_id,
        amount: bookingDetails.amount,
        currency: "INR",
      });

      // Razorpay options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_dummy_key",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "HomeHero",
        description: `Payment for ${bookingDetails.service_type}`,
        order_id: orderData.order_id,
        handler: async (response) => {
          try {
            // Verify payment on backend
            const verificationResult = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              booking_id: bookingDetails.booking_id,
            });

            setPaymentStatus("success");
            setTimeout(() => {
              onSuccess(verificationResult);
              onClose();
            }, 2000);
          } catch (err) {
            console.error("Payment verification failed:", err);
            setPaymentStatus("failed");
            setError("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: bookingDetails.customer_name || "",
          email: bookingDetails.customer_email || "",
          contact: bookingDetails.customer_phone || "",
        },
        theme: {
          color: "#06b6d4", // Cyan-500
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setError("Payment cancelled by user");
          },
        },
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();
      setLoading(false);
    } catch (err) {
      console.error("Payment initiation failed:", err);
      setError(err.message || "Failed to initiate payment. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close payment modal"
        >
          <XCircle className="h-6 w-6" />
        </button>

        {/* Payment Status */}
        {paymentStatus === "success" ? (
          <div className="text-center py-8">
            <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h2>
            <p className="text-gray-600">Your booking has been confirmed.</p>
          </div>
        ) : paymentStatus === "failed" ? (
          <div className="text-center py-8">
            <div className="bg-red-100 rounded-full p-4 w-20 h-20 mx-auto mb-4">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Failed
            </h2>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => setPaymentStatus(null)}
              className="mt-4 bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Payment Form */}
            <div className="text-center mb-6">
              <div className="bg-linear-to-br from-cyan-500 to-cyan-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <CreditCard className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Payment Details
              </h2>
              <p className="text-gray-600">
                Secure payment powered by Razorpay
              </p>
            </div>

            {/* Booking Summary */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Booking Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Service</span>
                  <span className="font-medium text-gray-900">
                    {bookingDetails.service_type}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Provider</span>
                  <span className="font-medium text-gray-900">
                    {bookingDetails.provider_name}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Date & Time</span>
                  <span className="font-medium text-gray-900">
                    {new Date(bookingDetails.date_time).toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">
                      Total Amount
                    </span>
                    <span className="font-bold text-cyan-600 text-xl">
                      ₹{bookingDetails.amount || "500"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Payment Button */}
            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5" />
                  Pay ₹{bookingDetails.amount || "500"}
                </>
              )}
            </button>

            {/* Security Notice */}
            <p className="text-center text-xs text-gray-500 mt-4">
              🔒 Your payment is secure and encrypted
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default PaymentModal;
