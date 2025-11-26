import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LogIn, AlertCircle, Loader } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { sanitizeString } from "../utils/validation";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email/phone and password");
      return;
    }

    setLoading(true);

    try {
      // Sanitize email/phone input
      await login(sanitizeString(email).trim(), password);

      // Get user from context/localStorage to check user type
      const userData = JSON.parse(localStorage.getItem("user") || "{}");

      // Redirect based on user type
      if (userData.user_type === "provider") {
        navigate("/provider-dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("Login error:", err);

      // Handle different error response formats
      let errorMessage = "Invalid email/phone or password";

      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;

        // If detail is an array (validation errors)
        if (Array.isArray(detail)) {
          errorMessage = detail
            .map((e) => e.msg || e.message || JSON.stringify(e))
            .join(", ");
        }
        // If detail is a string
        else if (typeof detail === "string") {
          errorMessage = detail;
        }
        // If detail is an object
        else if (typeof detail === "object") {
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

  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-10 border border-gray-100" role="region" aria-labelledby="login-heading">
          <div className="text-center mb-8">
            <div className="bg-linear-to-br from-cyan-500 to-cyan-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg" aria-hidden="true">
              <LogIn className="h-8 w-8 text-white" />
            </div>
            <h1 id="login-heading" className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600">Sign in to continue to HomeHero</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3" role="alert" aria-live="assertive">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" aria-hidden="true" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <label htmlFor="email-input" className="block text-sm font-semibold text-gray-700 mb-2">
                Email or Phone
              </label>
              <input
                id="email-input"
                type="text"
                value={email}
                aria-label="Enter your email or phone number"
                aria-required="true"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                placeholder="raj.sharma@gmail.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password-input" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password-input"
                type="password"
                value={password}
                aria-label="Enter your password"
                aria-required="true"
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
              aria-label={loading ? "Logging in, please wait" : "Login to your account"}
            >
              {loading ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" aria-hidden="true" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-cyan-600 hover:text-cyan-700 font-bold hover:underline transition-colors"
              >
                Sign Up
              </Link>
            </p>
          </div>

          {/* Test Credentials */}
          <div className="mt-8 p-4 bg-cyan-50 rounded-xl border border-cyan-200">
            <p className="text-xs font-bold text-cyan-700 mb-2">
              Test Credentials:
            </p>
            <p className="text-xs text-cyan-600">
              Email: raj.sharma@gmail.com
              <br />
              Password: CustomerPass123
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Login;

