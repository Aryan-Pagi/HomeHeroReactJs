import { Link, useNavigate } from "react-router-dom";
import { Wrench, User, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleLogoClick = () => {
    if (isAuthenticated && user?.user_type === "provider") {
      navigate("/provider-dashboard");
    } else {
      navigate("/");
    }
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div
            onClick={handleLogoClick}
            className="flex items-center space-x-2 group cursor-pointer"
          >
            <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 p-2 rounded-lg shadow-md group-hover:shadow-lg transition-all duration-200">
              <Wrench className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              HomeHero
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {/* Show Home only for customers or non-authenticated users */}
            {(!isAuthenticated || user?.user_type === "customer") && (
              <Link
                to="/"
                className="text-gray-700 hover:text-cyan-600 font-medium transition-colors duration-200 relative group"
              >
                Home
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-600 transition-all duration-200 group-hover:w-full"></span>
              </Link>
            )}

            {isAuthenticated && user?.user_type === "customer" && (
              <Link
                to="/my-bookings"
                className="text-gray-700 hover:text-cyan-600 font-medium transition-colors duration-200 relative group"
              >
                My Bookings
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-600 transition-all duration-200 group-hover:w-full"></span>
              </Link>
            )}

            {isAuthenticated && user?.user_type === "provider" && (
              <Link
                to="/provider-dashboard"
                className="text-gray-700 hover:text-cyan-600 font-medium transition-colors duration-200 relative group"
              >
                Dashboard
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-600 transition-all duration-200 group-hover:w-full"></span>
              </Link>
            )}
            
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-3 px-4 py-2 bg-cyan-50 rounded-lg">
                  <User className="h-5 w-5 text-cyan-600" />
                  <span className="font-medium text-gray-700">{user?.name}</span>
                  <span className="text-xs text-cyan-600 bg-cyan-100 px-2 py-1 rounded">
                    {user?.user_type}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-gray-700 hover:text-red-600 font-medium transition-colors duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-cyan-600 font-medium transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-cyan-600 hover:to-cyan-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
