import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { bookingAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { BookingCardSkeleton } from "../components/SkeletonLoader";

function MyBookings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [cancellingId, setCancellingId] = useState(null);
  const [completingId, setCompletingId] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await bookingAPI.getMyBookings();
      setBookings(data || []);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError("Failed to load bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const canCancelBooking = (booking) => {
    if (booking.status !== "pending" && booking.status !== "accepted") {
      return {
        canCancel: false,
        reason: "Can only cancel pending or accepted bookings",
      };
    }

    const bookingDate = new Date(booking.date_time);
    const now = new Date();
    const hoursDifference = (bookingDate - now) / (1000 * 60 * 60);

    if (hoursDifference < 24) {
      return {
        canCancel: false,
        reason: "Booking can only be cancelled 24 hours before scheduled time",
      };
    }

    return { canCancel: true };
  };

  const canMarkAsCompleted = (booking) => {
    // Only accepted bookings can be marked as completed
    if (booking.status !== "accepted") {
      return false;
    }

    // Booking scheduled time must have passed
    const bookingDate = new Date(booking.date_time);
    const now = new Date();

    return now >= bookingDate;
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    setCancellingId(bookingId);

    try {
      await bookingAPI.cancelBooking(bookingId, "Cancelled by customer");
      await fetchBookings(); // Refresh bookings
      alert("Booking cancelled successfully!");
    } catch (err) {
      console.error("Error cancelling booking:", err);
      alert(err.response?.data?.detail || "Failed to cancel booking");
    } finally {
      setCancellingId(null);
    }
  };

  const handleMarkAsCompleted = async (bookingId) => {
    if (
      !window.confirm(
        "Are you sure you want to mark this booking as completed?"
      )
    ) {
      return;
    }

    setCompletingId(bookingId);

    try {
      await bookingAPI.completeBooking(bookingId);
      await fetchBookings(); // Refresh bookings
      alert("Booking marked as completed successfully!");
    } catch (err) {
      console.error("Error completing booking:", err);
      alert(
        err.response?.data?.detail || "Failed to mark booking as completed"
      );
    } finally {
      setCompletingId(null);
    }
  };

  const getFilteredBookings = () => {
    const now = new Date();

    switch (filter) {
      case "pending":
        return bookings.filter((b) => b.status === "pending");
      case "accepted":
        return bookings.filter((b) => b.status === "accepted");
      case "completed":
        return bookings.filter((b) => b.status === "completed");
      case "cancelled":
        return bookings.filter(
          (b) => b.status === "cancelled" || b.status === "declined"
        );
      case "upcoming":
        return bookings.filter(
          (b) =>
            (b.status === "pending" || b.status === "accepted") &&
            new Date(b.date_time) > now
        );
      case "past":
        return bookings.filter(
          (b) =>
            b.status === "completed" ||
            b.status === "cancelled" ||
            b.status === "declined" ||
            new Date(b.date_time) < now
        );
      default:
        return bookings;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        color: "bg-yellow-100 text-yellow-700 border-yellow-200",
        icon: <Clock className="h-4 w-4" />,
        text: "Pending",
      },
      accepted: {
        color: "bg-blue-100 text-blue-700 border-blue-200",
        icon: <CheckCircle className="h-4 w-4" />,
        text: "Accepted",
      },
      completed: {
        color: "bg-green-100 text-green-700 border-green-200",
        icon: <CheckCircle className="h-4 w-4" />,
        text: "Completed",
      },
      cancelled: {
        color: "bg-red-100 text-red-700 border-red-200",
        icon: <XCircle className="h-4 w-4" />,
        text: "Cancelled",
      },
      declined: {
        color: "bg-red-100 text-red-700 border-red-200",
        icon: <XCircle className="h-4 w-4" />,
        text: "Declined",
      },
    };

    const badge = badges[status] || badges.pending;

    return (
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 font-semibold text-sm ${badge.color}`}
      >
        {badge.icon}
        {badge.text}
      </div>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <div className="h-10 bg-gray-200 rounded w-1/3 mb-3 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
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

  const filteredBookings = getFilteredBookings();

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold bg-linear-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-3">
            My Bookings
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            You have{" "}
            <span className="font-bold text-cyan-600">{bookings.length}</span>{" "}
            total bookings
          </p>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-3">
            {[
              { key: "all", label: "All Bookings" },
              { key: "upcoming", label: "Upcoming" },
              { key: "pending", label: "Pending" },
              { key: "accepted", label: "Accepted" },
              { key: "completed", label: "Completed" },
              { key: "cancelled", label: "Cancelled" },
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

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No bookings found</p>
              <button
                onClick={() => navigate("/")}
                className="mt-4 bg-linear-to-r from-cyan-500 to-cyan-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-cyan-600 hover:to-cyan-700 transition-all"
              >
                Browse Service Providers
              </button>
            </div>
          ) : (
            filteredBookings.map((booking) => {
              const cancelCheck = canCancelBooking(booking);

              return (
                <div
                  key={booking.booking_id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {booking.service_type}
                        </h3>
                        <p className="text-gray-600 mb-2">
                          Booking ID: {booking.booking_id.slice(0, 8)}...
                        </p>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-cyan-500" />
                        <div>
                          <p className="text-xs text-gray-500">
                            Scheduled Date
                          </p>
                          <p className="font-semibold text-gray-900">
                            {formatDate(booking.date_time)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-cyan-500" />
                        <div>
                          <p className="text-xs text-gray-500">
                            Scheduled Time
                          </p>
                          <p className="font-semibold text-gray-900">
                            {formatTime(booking.date_time)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {booking.special_instructions && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">
                          Special Instructions
                        </p>
                        <p className="text-sm text-gray-700">
                          {booking.special_instructions}
                        </p>
                      </div>
                    )}

                    {booking.cancellation_reason && (
                      <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-xs text-red-500 mb-1">
                          Cancellation Reason
                        </p>
                        <p className="text-sm text-red-700">
                          {booking.cancellation_reason}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-500">
                        Booked on {formatDate(booking.created_at)}
                      </p>

                      <div className="flex gap-2 flex-wrap">
                        {cancelCheck.canCancel ? (
                          <button
                            onClick={() =>
                              handleCancelBooking(booking.booking_id)
                            }
                            disabled={cancellingId === booking.booking_id}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {cancellingId === booking.booking_id ? (
                              <>
                                <Loader className="h-4 w-4 animate-spin" />
                                Cancelling...
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4" />
                                Cancel Booking
                              </>
                            )}
                          </button>
                        ) : (
                          cancelCheck.reason && (
                            <div className="text-sm text-gray-500 italic">
                              {cancelCheck.reason}
                            </div>
                          )
                        )}

                        {canMarkAsCompleted(booking) && (
                          <button
                            onClick={() =>
                              handleMarkAsCompleted(booking.booking_id)
                            }
                            disabled={completingId === booking.booking_id}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {completingId === booking.booking_id ? (
                              <>
                                <Loader className="h-4 w-4 animate-spin" />
                                Completing...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4" />
                                Mark as Completed
                              </>
                            )}
                          </button>
                        )}

                        {booking.status === "completed" && (
                          <button
                            onClick={() =>
                              navigate(`/review/${booking.booking_id}`)
                            }
                            className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-lg font-semibold transition-all"
                          >
                            Write Review
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default MyBookings;

