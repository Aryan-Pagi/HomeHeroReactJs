import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import RouteLoader from "./components/RouteLoader";
import SkipToMain from "./components/SkipToMain";

// Lazy load route components for code splitting
// This reduces initial bundle size and improves first load time
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ProviderProfile = lazy(() => import("./pages/ProviderProfile"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const MyBookings = lazy(() => import("./pages/MyBookings"));
const SubmitReview = lazy(() => import("./pages/SubmitReview"));
const ProviderDashboard = lazy(() => import("./pages/ProviderDashboard"));
const ProviderVerification = lazy(() => import("./pages/ProviderVerification"));

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <Router>
          <SkipToMain />
          <div className="min-h-screen bg-linear-to-br from-cyan-50 via-blue-50 to-indigo-50">
            <Navbar />
            {/* Suspense boundary for lazy-loaded routes */}
            <Suspense fallback={<RouteLoader />}>
              <div id="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/my-bookings" element={<MyBookings />} />
                <Route path="/provider-dashboard" element={<ProviderDashboard />} />
                <Route
                  path="/provider-verification"
                  element={<ProviderVerification />}
                />
                <Route path="/provider/:id" element={<ProviderProfile />} />
                <Route path="/review/:bookingId" element={<SubmitReview />} />
              </Routes>
              </div>
            </Suspense>
            <Footer />
          </div>
        </Router>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

