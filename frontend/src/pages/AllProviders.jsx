import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Loader, Star, Briefcase } from "lucide-react";
import { providerAPI } from "../services/api";

function AllProviders() {
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchAllProviders = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await providerAPI.searchProviders({
          available_only: filter === "available",
          limit: 100,
        });

        setProviders(data || []);
      } catch (err) {
        console.error("Error fetching providers:", err);
        setError("Failed to load providers. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllProviders();
  }, [filter]);

  if (loading) {
    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading service providers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-3">
            All Service Providers
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Browse <span className="font-bold text-cyan-600">{providers.length}</span> professionals ready to help
          </p>

          {/* Filter Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setFilter("all")}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                filter === "all"
                  ? "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-md"
                  : "bg-white text-gray-700 border-2 border-gray-200 hover:border-cyan-300"
              }`}
            >
              All Providers
            </button>
            <button
              onClick={() => setFilter("available")}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                filter === "available"
                  ? "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-md"
                  : "bg-white text-gray-700 border-2 border-gray-200 hover:border-cyan-300"
              }`}
            >
              Available Now
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Providers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No providers found</p>
            </div>
          ) : (
            providers.map((provider) => (
              <div
                key={provider.provider_id}
                onClick={() => navigate(`/provider/${provider.provider_id}`)}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 border border-gray-100 overflow-hidden"
              >
                {/* Provider Image/Avatar */}
                <div className="h-48 bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center relative">
                  <span className="text-6xl">👨‍🔧</span>
                  {provider.availability && (
                    <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Available
                    </div>
                  )}
                </div>

                {/* Provider Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {provider.user?.name || "Service Provider"}
                  </h3>

                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="h-4 w-4 text-cyan-500" />
                    <p className="text-cyan-600 font-semibold text-sm">
                      {provider.services?.join(", ") || "General Services"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600 text-sm">
                      {provider.user?.location || "Goa"}
                    </span>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(provider.rating || 0)
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-bold text-gray-900">
                      {provider.rating?.toFixed(1) || "0.0"}
                    </span>
                    <span className="text-gray-500 text-sm">
                      ({provider.rating_count || 0})
                    </span>
                  </div>

                  {/* Pricing */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500">Starting from</p>
                      <p className="text-2xl font-bold text-cyan-600">
                        ₹{provider.pricing}/hr
                      </p>
                    </div>
                    <button className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all">
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default AllProviders;
