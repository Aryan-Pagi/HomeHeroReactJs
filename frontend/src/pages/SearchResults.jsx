import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MapPin, Loader, Navigation } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { providerAPI } from "../services/api";
import { ProviderCardSkeleton } from "../components/SkeletonLoader";

function SearchResults() {
  const [searchParams] = useSearchParams();
  const service = searchParams.get("service");
  const location = searchParams.get("location");
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [radiusKm, setRadiusKm] = useState(10); // Default 10km radius
  const [userLocation, setUserLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Function to calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Get user's current location
  const getUserLocation = () => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setGettingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert(
            "Could not get your location. Please enable location services."
          );
          setGettingLocation(false);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
      setGettingLocation(false);
    }
  };

  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      setError("");

      try {
        // Fetch all providers
        const providers = await providerAPI.searchProviders({});

        // Filter locally if search params exist
        let filteredResults = providers || [];

        if (service && service.trim()) {
          filteredResults = filteredResults.filter((p) =>
            p.services?.some((s) =>
              s.toLowerCase().includes(service.toLowerCase())
            )
          );
        }

        if (location && location.trim()) {
          filteredResults = filteredResults.filter((p) =>
            p.user?.location?.toLowerCase().includes(location.toLowerCase())
          );
        }

        // Filter by radius if user location is available
        if (userLocation && radiusKm) {
          filteredResults = filteredResults.filter((provider) => {
            // For demo, use approximate coordinates for Goa locations
            const providerCoords = getLocationCoordinates(
              provider.user?.location
            );
            if (providerCoords) {
              const distance = calculateDistance(
                userLocation.lat,
                userLocation.lng,
                providerCoords.lat,
                providerCoords.lng
              );
              return distance <= radiusKm;
            }
            return true; // Include if coordinates not available
          });

          // Sort by distance when location filter is active
          filteredResults = filteredResults.sort((a, b) => {
            const coordsA = getLocationCoordinates(a.user?.location);
            const coordsB = getLocationCoordinates(b.user?.location);

            if (!coordsA && !coordsB) return 0;
            if (!coordsA) return 1;
            if (!coordsB) return -1;

            const distanceA = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              coordsA.lat,
              coordsA.lng
            );
            const distanceB = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              coordsB.lat,
              coordsB.lng
            );

            return distanceA - distanceB; // Nearest first
          });
        }

        setResults(filteredResults);
      } catch (err) {
        console.error("Search error:", err);
        setError("Failed to load providers. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [service, location, userLocation, radiusKm]);

  // Approximate coordinates for Goa locations (for demo)
  const getLocationCoordinates = (location) => {
    const coords = {
      Panaji: { lat: 15.4909, lng: 73.8278 },
      Panjim: { lat: 15.4909, lng: 73.8278 },
      Margao: { lat: 15.2707, lng: 73.9587 },
      Calangute: { lat: 15.544, lng: 73.7551 },
      Baga: { lat: 15.5559, lng: 73.7516 },
      Mapusa: { lat: 15.5906, lng: 73.8087 },
      Vasco: { lat: 15.3989, lng: 73.8151 },
      "Vasco da Gama": { lat: 15.3989, lng: 73.8151 },
    };

    if (!location) return null;

    for (const [city, coord] of Object.entries(coords)) {
      if (location.toLowerCase().includes(city.toLowerCase())) {
        return coord;
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Searching for providers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Location Filter Section */}
        <div className="bg-white shadow-lg rounded-xl p-6 mb-8 border border-cyan-100">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-cyan-600" />
                Filter by Location
              </h2>
              <p className="text-sm text-gray-600">
                {userLocation
                  ? `Showing providers within ${radiusKm} km of your location`
                  : "Enable location to find nearby providers"}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {/* Radius Selector */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Radius (km)
                </label>
                <select
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  disabled={!userLocation}
                >
                  <option value={5}>5 km</option>
                  <option value={10}>10 km</option>
                  <option value={20}>20 km</option>
                  <option value={50}>50 km</option>
                  <option value={100}>100 km</option>
                </select>
              </div>

              {/* Location Button */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700 invisible sm:visible">
                  Action
                </label>
                <button
                  onClick={getUserLocation}
                  disabled={gettingLocation}
                  className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
                    userLocation
                      ? "bg-green-100 text-green-700 border border-green-300"
                      : "bg-cyan-600 text-white hover:bg-cyan-700"
                  }`}
                >
                  {gettingLocation ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Getting Location...
                    </>
                  ) : userLocation ? (
                    <>
                      <Navigation className="w-4 h-4" />
                      Location Enabled
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4" />
                      Use My Location
                    </>
                  )}
                </button>
              </div>

              {/* Clear Location Button */}
              {userLocation && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700 invisible sm:visible">
                    Clear
                  </label>
                  <button
                    onClick={() => setUserLocation(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-10">
          <h1 className="text-4xl font-bold bg-linear-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-3">
            Search Results for "{service || "All Services"}"
          </h1>
          <p className="text-lg text-gray-600">
            Found{" "}
            <span className="font-bold text-cyan-600">
              {results.length} professionals
            </span>{" "}
            in {location || "Goa"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {results.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No providers found. Try adjusting your search.
              </p>
            </div>
          ) : (
            results.map((provider) => {
              // Calculate distance if user location is available
              let distance = null;
              if (userLocation) {
                const providerCoords = getLocationCoordinates(
                  provider.user?.location
                );
                if (providerCoords) {
                  distance = calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    providerCoords.lat,
                    providerCoords.lng
                  );
                }
              }

              return (
                <div
                  key={provider.provider_id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1 border border-gray-100"
                  onClick={() => navigate(`/provider/${provider.provider_id}`)}
                >
                  <div className="p-8 flex flex-col md:flex-row gap-6">
                    <div className="shrink-0">
                      <div className="w-full md:w-56 h-56 rounded-xl ring-4 ring-cyan-100 shadow-md bg-linear-to-br from-cyan-100 to-blue-100 flex items-center justify-center">
                        <span className="text-6xl">👨‍🔧</span>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {provider.user?.name || "Provider"}
                          </h3>
                          <p className="text-cyan-600 font-semibold mb-2">
                            {provider.services?.join(", ") ||
                              "Service Provider"}
                          </p>
                          <div className="flex items-center gap-3 text-gray-500">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{provider.user?.location || "Goa"}</span>
                            </div>
                            {distance !== null && (
                              <span className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-sm font-semibold flex items-center gap-1">
                                <Navigation className="h-3 w-3" />
                                {distance.toFixed(1)} km away
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold bg-linear-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                            ₹{provider.pricing}/hr
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-600 mb-6 flex-1">
                        {provider.experience_years} years of experience
                        {provider.availability
                          ? " • Available Now"
                          : " • Currently Unavailable"}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t-2 border-gray-100">
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className={`text-xl ${
                                  i < Math.floor(provider.rating || 0)
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="font-bold text-gray-900 text-lg">
                            {provider.rating?.toFixed(1) || "0.0"}
                          </span>
                          <span className="text-gray-500">
                            ({provider.rating_count || 0} reviews)
                          </span>
                        </div>
                        <button className="bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                          View Profile
                        </button>
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

export default SearchResults;
