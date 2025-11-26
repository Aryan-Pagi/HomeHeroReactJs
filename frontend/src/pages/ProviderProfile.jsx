import { useParams, useNavigate } from "react-router-dom";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Loader,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { providerAPI, bookingAPI, reviewAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { ProviderProfileSkeleton } from "../components/SkeletonLoader";
import { validators } from "../utils/validation";
import PaymentModal from "../components/PaymentModal";

function ProviderProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [showBooking, setShowBooking] = useState(false);
  const [provider, setProvider] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingData, setBookingData] = useState({
    service_type: "",
    date_time: "",
    special_instructions: "",
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);

  useEffect(() => {
    fetchProviderData();
  }, [id]);

  const fetchProviderData = async () => {
    setLoading(true);
    setError("");

    try {
      const providerData = await providerAPI.getProvider(id);
      setProvider(providerData);

      // Fetch reviews
      try {
        const reviewsData = await reviewAPI.getProviderReviews(id);
        setReviews(reviewsData || []);
      } catch (err) {
        console.log("No reviews found");
      }
    } catch (err) {
      console.error("Error fetching provider:", err);
      setError("Failed to load provider details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      alert("Please login to book a service");
      navigate("/login");
      return;
    }

    if (user?.user_type !== "customer") {
      alert("Only customers can book services");
      return;
    }

    // Validate booking date
    const dateValidation = validators.bookingDate(bookingData.date_time);
    if (!dateValidation.isValid) {
      alert(dateValidation.message);
      return;
    }

    // Validate special instructions (optional)
    const instructionsValidation = validators.specialInstructions(
      bookingData.special_instructions
    );
    if (!instructionsValidation.isValid) {
      alert(instructionsValidation.message);
      return;
    }

    setBookingLoading(true);

    try {
      const booking = await bookingAPI.createBooking({
        provider_id: id,
        service_type: bookingData.service_type || provider.services[0],
        date_time: dateValidation.sanitized,
        special_instructions: instructionsValidation.sanitized,
      });

      setCreatedBooking(booking);
      setBookingSuccess(true);

      // Show payment modal after brief success message
      setTimeout(() => {
        setBookingSuccess(false);
        setShowBooking(false);
        setShowPaymentModal(true);
      }, 1500);
    } catch (err) {
      console.error("Booking error:", err);
      alert(
        err.response?.data?.detail ||
          "Failed to create booking. Please try again."
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentResult) => {
    console.log("Payment successful:", paymentResult);
    // Navigate to bookings page after successful payment
    navigate("/my-bookings");
  };

  const handlePaymentClose = () => {
    setShowPaymentModal(false);
    // Still navigate to bookings even if payment was cancelled
    // Booking is created, payment can be done later
    navigate("/my-bookings");
  };

  if (loading) {
    return <ProviderProfileSkeleton />;
  }

  if (error || !provider) {
    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-700 text-lg mb-4">
            {error || "Provider not found"}
          </p>
          <button
            onClick={() => navigate("/providers")}
            className="bg-linear-to-r from-cyan-500 to-cyan-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-cyan-600 hover:to-cyan-700 transition-all"
          >
            Browse Providers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Provider Header */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-8 border border-gray-100">
          <div className="md:flex">
            <div className="w-full md:w-1/3 bg-linear-to-br from-cyan-100 to-blue-100 flex items-center justify-center">
              <span className="text-8xl">👨‍🔧</span>
            </div>
            <div className="p-10 flex-1">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-3">
                    {provider.user?.name || "Service Provider"}
                  </h1>
                  <p className="text-xl text-cyan-600 font-semibold mb-3">
                    {provider.services?.join(", ") || "General Services"}
                  </p>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-5 w-5 text-cyan-500" />
                    <span className="font-medium">
                      {provider.user?.location || "Goa"}
                    </span>
                  </div>
                </div>
                <div className="text-3xl font-bold bg-linear-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  ₹{provider.pricing}/hr
                </div>
              </div>

              <div className="flex items-center gap-4 mb-6 pb-6 border-b-2 border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-2xl ${
                          i < Math.floor(provider.rating || 0)
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-2xl font-bold text-gray-900">
                    {provider.rating?.toFixed(1) || "0.0"}
                  </span>
                  <span className="text-gray-500 text-lg">
                    ({provider.rating_count || 0} reviews)
                  </span>
                </div>
              </div>

              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                {provider.experience_years
                  ? `${provider.experience_years} years of professional experience providing quality services.`
                  : "Professional service provider with expertise in their field."}
              </p>

              <div className="grid grid-cols-1 gap-4 mb-8">
                <div className="flex items-center gap-3 text-gray-700 bg-cyan-50 p-4 rounded-xl">
                  <div className="bg-linear-to-br from-cyan-500 to-cyan-600 p-2.5 rounded-lg">
                    <Phone className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium">
                    {provider.user?.phone || "Contact via booking"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-gray-700 bg-cyan-50 p-4 rounded-xl">
                  <div className="bg-linear-to-br from-cyan-500 to-cyan-600 p-2.5 rounded-lg">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium">
                    {provider.user?.email || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-gray-700 bg-cyan-50 p-4 rounded-xl">
                  <div className="bg-linear-to-br from-cyan-500 to-cyan-600 p-2.5 rounded-lg">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium">
                    {provider.availability
                      ? provider.availability
                      : "Available on booking"}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowBooking(!showBooking)}
                className="w-full bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Book Now
              </button>
            </div>
          </div>
        </div>

        {/* Services Offered */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          <h2 className="text-3xl font-bold bg-linear-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-8">
            Services Offered
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {(provider.services || []).map((service, index) => (
              <div
                key={index}
                className="bg-linear-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-xl p-5 text-center font-semibold text-gray-800 hover:border-cyan-400 hover:shadow-md transition-all cursor-pointer"
              >
                {service}
              </div>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div className="bg-white rounded-2xl shadow-2xl p-10 border border-gray-100">
          <h2 className="text-3xl font-bold bg-linear-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-8">
            Customer Reviews
          </h2>
          <div className="space-y-6">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div
                  key={review.review_id}
                  className="border-b-2 border-gray-100 pb-6 last:border-0"
                >
                  <div className="flex items-start gap-5">
                    <div className="w-14 h-14 rounded-full bg-cyan-100 flex items-center justify-center ring-4 ring-cyan-50">
                      <span className="text-2xl">👤</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-900 text-lg">
                          Customer
                        </h3>
                        <span className="text-sm text-gray-500 font-medium">
                          {new Date(review.created_at).toLocaleDateString(
                            "en-IN"
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-lg ${
                              i < review.rating
                                ? "text-yellow-400"
                                : "text-gray-300"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">
                No reviews yet. Be the first to review!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-10 max-w-md w-full shadow-2xl border border-gray-100">
            <h2 className="text-3xl font-bold bg-linear-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-8">
              Book {provider.user?.name}
            </h2>

            {bookingSuccess && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <span className="text-green-800 font-medium">
                  Booking request sent successfully!
                </span>
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Service Required
                </label>
                <select
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                  value={bookingData.service_type}
                  onChange={(e) =>
                    setBookingData({
                      ...bookingData,
                      service_type: e.target.value,
                    })
                  }
                >
                  {(provider.services || []).map((service, index) => (
                    <option key={index} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                  value={bookingData.date_time}
                  onChange={(e) =>
                    setBookingData({
                      ...bookingData,
                      date_time: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Special Instructions (Optional)
                </label>
                <textarea
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all resize-none"
                  rows="3"
                  placeholder="Any specific requirements or details..."
                  value={bookingData.special_instructions}
                  onChange={(e) =>
                    setBookingData({
                      ...bookingData,
                      special_instructions: e.target.value,
                    })
                  }
                ></textarea>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBooking(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3.5 rounded-xl font-bold transition-all"
                  disabled={bookingLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white py-3.5 rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={bookingLoading}
                >
                  {bookingLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader className="animate-spin h-5 w-5" />
                      Booking...
                    </span>
                  ) : (
                    "Confirm Booking"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && createdBooking && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={handlePaymentClose}
          bookingDetails={{
            booking_id: createdBooking.booking_id,
            service_type: bookingData.service_type || provider.services[0],
            provider_name: provider.user?.name || "Service Provider",
            date_time: bookingData.date_time,
            amount: provider.pricing || 500,
            customer_name: user?.name,
            customer_email: user?.email,
            customer_phone: user?.phone,
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}

export default ProviderProfile;
