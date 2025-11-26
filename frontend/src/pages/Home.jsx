import { useState, useEffect } from "react";
import {
  Search,
  MapPin,
  Wrench,
  Zap,
  Paintbrush,
  Hammer,
  Sparkles,
  Wind,
  Loader,
  Star,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { providerAPI } from "../services/api";
import useDebounce from "../hooks/useDebounce";

function Home() {
  const [service, setService] = useState("");
  const [location, setLocation] = useState("");
  const [topProviders, setTopProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const navigate = useNavigate();

  // Debounce search inputs to reduce API calls
  const debouncedService = useDebounce(service, 500);
  const debouncedLocation = useDebounce(location, 500);

  useEffect(() => {
    fetchTopProviders();
  }, []);

  // Debounced search effect
  useEffect(() => {
    // Only search if both fields have values
    if (debouncedService.trim() || debouncedLocation.trim()) {
      performSearch();
    } else {
      // Clear search results if inputs are empty
      setSearchResults([]);
    }
  }, [debouncedService, debouncedLocation]);

  const fetchTopProviders = async () => {
    try {
      setLoadingProviders(true);
      // Fetch providers and sort by rating
      const response = await providerAPI.searchProviders({});

      // Sort by rating and get top 6
      const sortedProviders = response
        .filter((p) => p.approved && p.rating > 0)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 6);

      setTopProviders(sortedProviders);
    } catch (error) {
      console.error("Failed to fetch top providers:", error);
      setTopProviders([]);
    } finally {
      setLoadingProviders(false);
    }
  };

  const performSearch = async () => {
    try {
      setLoadingSearch(true);
      const response = await providerAPI.searchProviders({
        service: debouncedService,
        location: debouncedLocation,
      });

      // Filter for approved providers
      const filteredResults = response.filter((p) => p.approved);
      setSearchResults(filteredResults);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/search?service=${service}&location=${location}`);
  };

  const popularServices = [
    { name: "Plumbing", icon: Wrench, color: "bg-blue-50" },
    { name: "Electrical", icon: Zap, color: "bg-yellow-50" },
    { name: "Painting", icon: Paintbrush, color: "bg-pink-50" },
    { name: "Carpentry", icon: Hammer, color: "bg-orange-50" },
    { name: "Cleaning", icon: Sparkles, color: "bg-purple-50" },
    { name: "AC Repair", icon: Wind, color: "bg-cyan-50" },
  ];

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section
        aria-label="Hero section with search"
        className="relative bg-cover bg-center h-[450px] flex items-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=1920&h=1080&fit=crop)",
        }}
      >
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
            Goa's Trusted Home Services
          </h1>
          <p className="text-xl text-white mb-8 drop-shadow-md">
            Find reliable local professionals for any home repair or improvement
            project.
          </p>

          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-4 flex flex-col md:flex-row gap-4 backdrop-blur-sm"
            role="search"
            aria-label="Search for service providers"
          >
            <div className="flex-1 flex items-center gap-3 px-4 border-r border-gray-200">
              <Search className="text-cyan-500 h-6 w-6 shrink-0" aria-hidden="true" />
              <label htmlFor="service-input" className="sr-only">Service type</label>
              <input
                id="service-input"
                type="text"
                placeholder="What service do you need? e.g., 'leaky pipe'"
                className="flex-1 outline-none text-gray-700 placeholder-gray-400 text-lg focus:ring-2 focus:ring-cyan-500 rounded px-2 py-1"
                value={service}
                onChange={(e) => setService(e.target.value)}
                aria-label="Enter service type"
              />
            </div>
            <div className="flex-1 flex items-center gap-3 px-4">
              <MapPin className="text-cyan-500 h-6 w-6 shrink-0" aria-hidden="true" />
              <label htmlFor="location-input" className="sr-only">Location</label>
              <input
                id="location-input"
                type="text"
                placeholder="Goa"
                className="flex-1 outline-none text-gray-700 placeholder-gray-400 text-lg focus:ring-2 focus:ring-cyan-500 rounded px-2 py-1"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                aria-label="Enter location"
              />
            </div>
            <button
              type="submit"
              className="bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
              aria-label="Search for providers"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Live Search Results Section */}
      {(service.trim() || location.trim()) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-b border-gray-200" aria-label="Search results">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900">
              Search Results
              {searchResults.length > 0 && (
                <span className="text-lg text-gray-500 ml-3" role="status" aria-live="polite">
                  ({searchResults.length} provider{searchResults.length !== 1 ? 's' : ''} found)
                </span>
              )}
            </h2>
            {loadingSearch && (
              <div className="flex items-center gap-2 text-cyan-600" role="status" aria-live="polite" aria-label="Searching for providers">
                <Loader className="h-5 w-5 animate-spin" aria-hidden="true" />
                <span className="text-sm font-medium">Searching...</span>
              </div>
            )}
          </div>

          {!loadingSearch && searchResults.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl">
              <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                No providers found matching your search
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Try adjusting your search terms or location
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((provider) => (
                <article
                  key={provider.provider_id}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1 border border-gray-100 focus-within:ring-2 focus-within:ring-cyan-500"
                  onClick={() => navigate(`/provider/${provider.provider_id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/provider/${provider.provider_id}`);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`View profile of ${provider.user?.name || 'Service Provider'}, ${provider.services?.join(', ') || 'General Services'}, rated ${provider.rating?.toFixed(1) || '0.0'} stars`}
                >
                  <div className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-14 h-14 rounded-full bg-linear-to-br from-cyan-100 to-blue-100 flex items-center justify-center ring-2 ring-cyan-50">
                        <span className="text-2xl">👨‍🔧</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {provider.user?.name || "Service Provider"}
                        </h3>
                        <p className="text-sm text-cyan-600 font-medium">
                          {provider.services?.join(", ") || "General Services"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-gray-500 text-sm mb-4">
                      <MapPin className="h-4 w-4 text-cyan-500" />
                      <span>{provider.user?.location || "Goa"}</span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <span className="font-bold text-gray-900">
                          {provider.rating?.toFixed(1) || "0.0"}
                        </span>
                        <span className="text-gray-400 text-xs">
                          ({provider.rating_count || 0})
                        </span>
                      </div>
                      <button className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors">
                        View
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Popular Services Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20" aria-labelledby="popular-services-heading">
        <h2 id="popular-services-heading" className="text-5xl font-bold text-center mb-4 bg-linear-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
          Popular Services
        </h2>
        <p className="text-center text-gray-600 mb-12 text-lg">
          Choose from our most requested services
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {popularServices.map((service, index) => {
            const Icon = service.icon;
            return (
              <article
                key={index}
                className="group bg-white rounded-2xl p-10 text-center hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-cyan-500 transform hover:-translate-y-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                tabIndex={0}
                role="button"
                aria-label={`${service.name} service`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    // Could navigate to service-specific page
                  }
                }}
              >
                <div className="bg-linear-to-br from-cyan-100 to-blue-100 rounded-full p-6 w-20 h-20 mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="h-8 w-8 text-cyan-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 group-hover:text-cyan-600 transition-colors">
                  {service.name}
                </h3>
              </article>
            );
          })}
        </div>
      </section>

      {/* Top Rated Professionals Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20" aria-labelledby="top-providers-heading">
        <h2 id="top-providers-heading" className="text-5xl font-bold text-center mb-4 bg-linear-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
          Top Rated Professionals
        </h2>
        <p className="text-center text-gray-600 mb-12 text-lg">
          Trusted experts with verified reviews
        </p>

        {loadingProviders ? (
          <div className="flex justify-center items-center py-20" role="status" aria-live="polite" aria-label="Loading top rated providers">
            <Loader className="h-12 w-12 text-cyan-600 animate-spin" aria-hidden="true" />
            <span className="sr-only">Loading top rated providers...</span>
          </div>
        ) : topProviders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">
              No top-rated providers available yet
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {topProviders.map((provider) => (
              <article
                key={provider.provider_id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-2 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                onClick={() => navigate(`/provider/${provider.provider_id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/provider/${provider.provider_id}`);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`View profile of ${provider.user?.name || 'Service Provider'}, ${provider.services?.join(', ') || 'General Services'}, rated ${provider.rating?.toFixed(1) || '0.0'} stars`}
              >
                <div className="p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-20 h-20 rounded-full bg-linear-to-br from-cyan-100 to-blue-100 flex items-center justify-center ring-4 ring-cyan-50">
                      <span className="text-3xl">👨‍🔧</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1 hover:text-cyan-600 transition-colors">
                        {provider.user?.name || "Service Provider"}
                      </h3>
                      <p className="text-cyan-600 font-semibold mb-2">
                        {provider.services?.join(", ") || "General Services"}
                      </p>
                      <div className="flex items-center gap-1 text-gray-500 text-sm">
                        <MapPin className="h-4 w-4 text-cyan-500" />
                        <span>{provider.user?.location || "Goa"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-gray-100">
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
                      <span className="font-bold text-gray-900">
                        {provider.rating?.toFixed(1) || "0.0"}
                      </span>
                      <span className="text-gray-500 text-sm">
                        ({provider.rating_count || 0})
                      </span>
                    </div>
                    <button className="bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg">
                      View Profile
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Home;

