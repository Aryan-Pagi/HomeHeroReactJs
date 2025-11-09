import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus, AlertCircle, Loader, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    userType: "customer",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const registrationData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        user_type: formData.userType,
      };
      
      console.log("Sending registration data:", registrationData);
      
      await register(registrationData);
      
      setSuccess(true);
      setTimeout(() => {
        // Redirect providers to verification page
        if (formData.userType === 'provider') {
          navigate("/provider-verification");
        } else {
          navigate("/login");
        }
      }, 2000);
    } catch (err) {
      console.error("Registration error:", err);
      console.error("Error detail:", err.detail);
      console.error("Error data:", err.data);
      
      // Handle different error response formats
      let errorMessage = "Registration failed. Please try again.";
      
      // Check if error has detail property directly (from catch block)
      if (err.detail) {
        const detail = err.detail;
        
        // If detail is an array (validation errors)
        if (Array.isArray(detail)) {
          errorMessage = detail.map(e => {
            // Extract field name and message
            const field = e.loc ? e.loc[e.loc.length - 1] : 'field';
            const msg = e.msg || e.message || 'validation error';
            return `${field}: ${msg}`;
          }).join(", ");
        } 
        // If detail is a string
        else if (typeof detail === 'string') {
          errorMessage = detail;
        }
      }
      // Check if error has response.data.detail
      else if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        
        // If detail is an array (validation errors)
        if (Array.isArray(detail)) {
          errorMessage = detail.map(e => {
            const field = e.loc ? e.loc[e.loc.length - 1] : 'field';
            const msg = e.msg || e.message || 'validation error';
            return `${field}: ${msg}`;
          }).join(", ");
        } 
        // If detail is a string
        else if (typeof detail === 'string') {
          errorMessage = detail;
        }
        // If detail is an object
        else if (typeof detail === 'object') {
          errorMessage = detail.msg || detail.message || JSON.stringify(detail);
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-10 border border-gray-100">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Create Account
            </h2>
            <p className="text-gray-600">Join HomeHero and get started today</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
              <p className="text-green-700 text-sm">Registration successful! Redirecting to login...</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                  placeholder="Enter your phone number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                  placeholder="Create a password"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                I am a
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label
                  className={`flex items-center justify-center px-6 py-4 border-2 rounded-xl cursor-pointer transition-all ${
                    formData.userType === "customer"
                      ? "border-cyan-500 bg-cyan-50 shadow-md"
                      : "border-gray-200 hover:border-cyan-300 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="userType"
                    value="customer"
                    checked={formData.userType === "customer"}
                    onChange={handleChange}
                    className="mr-3 accent-cyan-500 w-4 h-4"
                  />
                  <span
                    className={`font-semibold ${
                      formData.userType === "customer"
                        ? "text-cyan-700"
                        : "text-gray-700"
                    }`}
                  >
                    Customer
                  </span>
                </label>

                <label
                  className={`flex items-center justify-center px-6 py-4 border-2 rounded-xl cursor-pointer transition-all ${
                    formData.userType === "provider"
                      ? "border-cyan-500 bg-cyan-50 shadow-md"
                      : "border-gray-200 hover:border-cyan-300 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="userType"
                    value="provider"
                    checked={formData.userType === "provider"}
                    onChange={handleChange}
                    className="mr-3 accent-cyan-500 w-4 h-4"
                  />
                  <span
                    className={`font-semibold ${
                      formData.userType === "provider"
                        ? "text-cyan-700"
                        : "text-gray-700"
                    }`}
                  >
                    Service Provider
                  </span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  Creating Account...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Success!
                </>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-cyan-600 hover:text-cyan-700 font-bold hover:underline transition-colors"
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
