import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
  User,
  DollarSign,
  Star,
  TrendingUp,
  Power,
  PowerOff,
} from "lucide-react";
import { bookingAPI, reviewAPI, providerAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  StatsCardSkeleton,
  BookingCardSkeleton,
} from "../components/SkeletonLoader";

function ProviderDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [respondingId, setRespondingId] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (user?.user_type !== "provider") {
      navigate("/");
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch bookings - try to get all provider bookings
      let bookingsData = [];
      try {
        bookingsData = await bookingAPI.getMyBookings();
      } catch (err) {
        console.error("Failed to fetch bookings:", err);
        bookingsData = [];
      }

      // Fetch reviews
      let reviewsData = [];
      try {
        reviewsData = await reviewAPI.getMyReviews();
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
        reviewsData = [];
      }

      setBookings(bookingsData || []);
      setReviews(reviewsData || []);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError("Failed to load some dashboard data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToBooking = async (bookingId, action) => {
    // action will be "accept" or "decline"
    const actionLabel = action === "accept" ? "accept" : "decline";

    if (
      !window.confirm(`Are you sure you want to ${actionLabel} this booking?`)
    ) {
      return;
    }

    try {
      setRespondingId(bookingId);

      // Convert "accept" to "accepted" and "decline" to "declined" for the API
      const status = action === "accept" ? "accepted" : "declined";

      await bookingAPI.respondToBooking(bookingId, status);
      await fetchData();

      alert(`Booking ${actionLabel}ed successfully!`);
    } catch (err) {
      console.error(`Failed to ${actionLabel} booking:`, err);
      alert(
        `Failed to ${actionLabel} booking: ${
          err.response?.data?.detail || err.message
        }`
      );
    } finally {
      setRespondingId(null);
    }
  };

  const toggleOnlineStatus = async () => {
    try {
      setUpdatingStatus(true);
      const newStatus = !isOnline;

      // Update availability in backend - expects { available: boolean }
      await providerAPI.updateAvailability(newStatus);

      setIsOnline(newStatus);
      alert(`You are now ${newStatus ? "ONLINE" : "OFFLINE"}`);
    } catch (err) {
      console.error("Failed to update status:", err);
      alert(
        "Failed to update status: " +
          (err.response?.data?.detail || err.message)
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      accepted: "bg-blue-100 text-blue-800 border-blue-200",
      completed: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
      declined: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return badges[status] || badges.pending;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredBookings = bookings.filter((booking) => {
    if (filter === "all") return true;
    return booking.status === filter;
  });

  // Calculate stats
  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    accepted: bookings.filter((b) => b.status === "accepted").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    avgRating:
      reviews.length > 0
        ? (
            reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          ).toFixed(1)
        : "N/A",
    totalReviews: reviews.length,
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-10 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <StatsCardSkeleton key={i} />
            ))}
          </div>

          {/* Bookings Skeleton */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="flex flex-wrap gap-3 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-gray-200 rounded-lg w-32"></div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <BookingCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Online/Offline Toggle */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-linear-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Provider Dashboard
            </h1>
            <p className="text-gray-600">Welcome back, {user?.name}!</p>
          </div>

          {/* Online/Offline Toggle */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-600">
              Status: {isOnline ? "Online" : "Offline"}
            </span>
            <button
              onClick={toggleOnlineStatus}
              disabled={updatingStatus}
              className={`relative inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${
                isOnline
                  ? "bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                  : "bg-linear-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white"
              }`}
            >
              {updatingStatus ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  {isOnline ? (
                    <>
                      <Power className="h-5 w-5" />
                      Go Offline
                    </>
                  ) : (
                    <>
                      <PowerOff className="h-5 w-5" />
                      Go Online
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Online Status Banner */}
        {isOnline && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <p className="text-green-800 font-semibold">
                You are currently ONLINE
              </p>
              <p className="text-green-700 text-sm">
                Customers can see and book your services
              </p>
            </div>
          </div>
        )}

        {!isOnline && (
          <div className="mb-6 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl flex items-center gap-3">
            <PowerOff className="h-6 w-6 text-gray-600" />
            <div>
              <p className="text-gray-800 font-semibold">
                You are currently OFFLINE
              </p>
              <p className="text-gray-700 text-sm">
                Customers cannot see or book your services. Go online to start
                receiving bookings.
              </p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 font-medium">Total Bookings</h3>
              <Calendar className="h-8 w-8 text-cyan-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 font-medium">Pending</h3>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 font-medium">Completed</h3>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats.completed}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 font-medium">Avg Rating</h3>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats.avgRating}
            </p>
            <p className="text-sm text-gray-500">
              {stats.totalReviews} reviews
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Booking Requests
          </h2>
          <div className="flex flex-wrap gap-3">
            {[
              { key: "all", label: "All Bookings" },
              { key: "pending", label: "Pending" },
              { key: "accepted", label: "Accepted" },
              { key: "completed", label: "Completed" },
              { key: "cancelled", label: "Cancelled" },
              { key: "declined", label: "Declined" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
                  filter === tab.key
                    ? "bg-linear-to-r from-cyan-500 to-cyan-600 text-white shadow-md"
                    : "bg-white text-gray-700 border-2 border-gray-200 hover:border-cyan-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No bookings found</p>
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <div
                key={booking.booking_id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {booking.service_type}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getStatusBadge(
                            booking.status
                          )}`}
                        >
                          {booking.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 mb-2">
                        <User className="h-4 w-4" />
                        <span>Customer ID: {booking.customer_id}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(booking.date_time)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatTime(booking.date_time)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {booking.special_instructions && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-sm font-semibold text-blue-900 mb-1">
                        Special Instructions:
                      </p>
                      <p className="text-sm text-blue-800">
                        {booking.special_instructions}
                      </p>
                    </div>
                  )}

                  {booking.status === "pending" && (
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                      <button
                        onClick={() =>
                          handleRespondToBooking(booking.booking_id, "accept")
                        }
                        disabled={respondingId === booking.booking_id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {respondingId === booking.booking_id ? (
                          <>
                            <Loader className="h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-5 w-5" />
                            Accept
                          </>
                        )}
                      </button>
                      <button
                        onClick={() =>
                          handleRespondToBooking(booking.booking_id, "decline")
                        }
                        disabled={respondingId === booking.booking_id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {respondingId === booking.booking_id ? (
                          <>
                            <Loader className="h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <XCircle className="h-5 w-5" />
                            Decline
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {booking.status === "accepted" && (
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-sm text-blue-600 font-medium">
                        ✓ You have accepted this booking. Please complete the
                        service on the scheduled date.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Recent Reviews Section */}
        {reviews.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Recent Reviews
            </h2>
            <div className="space-y-4">
              {reviews.slice(0, 5).map((review) => (
                <div
                  key={review.review_id}
                  className="border-b border-gray-100 pb-4 last:border-0"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
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
                    <span className="text-sm text-gray-500">
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProviderDashboard;
