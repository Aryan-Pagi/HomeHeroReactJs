import { Loader } from "lucide-react";

/**
 * Loading fallback component for lazy-loaded routes
 * Displayed while route components are being loaded
 */
function RouteLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-cyan-50 via-blue-50 to-indigo-50">
      <div className="text-center">
        <Loader className="h-16 w-16 text-cyan-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600 text-lg font-medium">Loading...</p>
      </div>
    </div>
  );
}

export default RouteLoader;
