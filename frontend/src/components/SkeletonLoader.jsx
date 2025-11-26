// Reusable skeleton loader components for consistent loading states

// Base skeleton pulse animation class
export const SkeletonPulse = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

// Provider Card Skeleton (for SearchResults)
export const ProviderCardSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 animate-pulse">
    <div className="flex flex-col md:flex-row gap-6">
      {/* Image Skeleton */}
      <div className="shrink-0">
        <div className="w-full md:w-56 h-56 rounded-xl bg-gray-200"></div>
      </div>

      {/* Content Skeleton */}
      <div className="flex-1 space-y-4">
        {/* Name */}
        <div className="h-8 bg-gray-200 rounded w-2/3"></div>

        {/* Services */}
        <div className="flex flex-wrap gap-2">
          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
          <div className="h-6 bg-gray-200 rounded-full w-24"></div>
          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
        </div>

        {/* Details */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/5"></div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
          <div>
            <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Provider Profile Skeleton
export const ProviderProfileSkeleton = () => (
  <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
    <div className="max-w-7xl mx-auto">
      {/* Back Button Skeleton */}
      <div className="mb-6">
        <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
      </div>

      {/* Main Card Skeleton */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 mb-8 animate-pulse">
        <div className="flex flex-col md:flex-row">
          {/* Sidebar Skeleton */}
          <div className="w-full md:w-1/3 bg-gray-100 p-12">
            <div className="flex flex-col items-center">
              <div className="w-48 h-48 bg-gray-200 rounded-full mb-6"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="w-full md:w-2/3 p-8 space-y-6">
            {/* Header */}
            <div className="space-y-3">
              <div className="h-10 bg-gray-200 rounded w-2/3"></div>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 bg-gray-50 p-5 rounded-xl"
                >
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>

            {/* Button */}
            <div className="h-14 bg-gray-200 rounded-xl w-full"></div>
          </div>
        </div>
      </div>

      {/* Services Section Skeleton */}
      <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 mb-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Booking Card Skeleton (for MyBookings)
export const BookingCardSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-7 bg-gray-200 rounded w-1/3"></div>
          <div className="h-6 bg-gray-200 rounded-full w-24"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="flex items-center gap-4">
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    </div>

    {/* Action buttons area */}
    <div className="flex gap-3 pt-4 border-t border-gray-100">
      <div className="h-10 bg-gray-200 rounded-lg flex-1"></div>
      <div className="h-10 bg-gray-200 rounded-lg flex-1"></div>
    </div>
  </div>
);

// Stats Card Skeleton (for ProviderDashboard)
export const StatsCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 animate-pulse">
    <div className="flex items-center justify-between mb-2">
      <div className="h-5 bg-gray-200 rounded w-1/2"></div>
      <div className="w-8 h-8 bg-gray-200 rounded"></div>
    </div>
    <div className="h-9 bg-gray-200 rounded w-1/3"></div>
  </div>
);

// Generic Page Loading Skeleton
export const PageLoadingSkeleton = ({ message = "Loading..." }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="w-16 h-16 border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin mx-auto"></div>
      <p className="text-lg text-gray-600 font-medium">{message}</p>
    </div>
  </div>
);

export default {
  SkeletonPulse,
  ProviderCardSkeleton,
  ProviderProfileSkeleton,
  BookingCardSkeleton,
  StatsCardSkeleton,
  PageLoadingSkeleton,
};
