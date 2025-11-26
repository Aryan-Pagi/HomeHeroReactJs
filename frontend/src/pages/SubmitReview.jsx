import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Star,
  Loader,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import { reviewAPI, bookingAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { validators } from "../utils/validation";

function SubmitReview() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [reviewData, setReviewData] = useState({
    rating: 0,
    comment: "",
  });

  const [hoveredRating, setHoveredRating] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    fetchBookingDetails();
  }, [bookingId, isAuthenticated]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const data = await bookingAPI.getBooking(bookingId);

      // Check if booking is completed
      if (data.status !== "completed") {
        setError("You can only review completed bookings");
      }

      setBooking(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate rating
    const ratingValidation = validators.rating(reviewData.rating);
    if (!ratingValidation.isValid) {
      setError(ratingValidation.message);
      return;
    }

    // Validate comment
    const commentValidation = validators.reviewComment(reviewData.comment);
    if (!commentValidation.isValid) {
      setError(commentValidation.message);
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await reviewAPI.submitReview({
        booking_id: parseInt(bookingId),
        provider_id: booking.provider_id,
        rating: ratingValidation.sanitized,
        comment: commentValidation.sanitized,
      });

      setSuccess(true);

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate(`/provider/${booking.provider_id}`);
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to submit review. You may have already reviewed this booking."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="h-12 w-12 text-cyan-600 animate-spin" />
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="h-8 w-8" />
            <h2 className="text-2xl font-bold">Error</h2>
          </div>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => navigate("/my-bookings")}
            className="w-full bg-cyan-600 text-white py-3 rounded-xl font-bold hover:bg-cyan-700 transition-all"
          >
            Back to My Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/my-bookings")}
          className="flex items-center gap-2 text-cyan-600 hover:text-cyan-700 font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to My Bookings
        </button>

        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10 border border-gray-100">
          <h1 className="text-3xl font-bold bg-linear-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Submit Review
          </h1>
          <p className="text-gray-600 mb-8">
            Share your experience with this service provider
          </p>

          {/* Booking Info */}
          <div className="bg-cyan-50 rounded-xl p-6 mb-8 border border-cyan-100">
            <h3 className="font-bold text-gray-900 mb-2">Booking Details</h3>
            <p className="text-gray-700">
              <span className="font-medium">Service:</span>{" "}
              {booking?.service_type}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Date:</span>{" "}
              {new Date(booking?.date_time).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <span className="text-green-800 font-medium">
                Review submitted successfully! Redirecting...
              </span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Rating <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() =>
                      setReviewData({ ...reviewData, rating: star })
                    }
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-10 w-10 ${
                        star <= (hoveredRating || reviewData.rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-3 text-lg font-semibold text-gray-700">
                  {reviewData.rating > 0
                    ? `${reviewData.rating} / 5`
                    : "Select rating"}
                </span>
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your Review <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all resize-none"
                rows="6"
                placeholder="Share your experience with this service provider..."
                value={reviewData.comment}
                onChange={(e) =>
                  setReviewData({ ...reviewData, comment: e.target.value })
                }
                required
              />
              <p className="text-sm text-gray-500 mt-2">
                {reviewData.comment.length} characters
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate("/my-bookings")}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3.5 rounded-xl font-bold transition-all"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white py-3.5 rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={submitting || success}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader className="animate-spin h-5 w-5" />
                    Submitting...
                  </span>
                ) : (
                  "Submit Review"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SubmitReview;

