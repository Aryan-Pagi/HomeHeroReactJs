import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProviderProfile from "./pages/ProviderProfile";
import SearchResults from "./pages/SearchResults";
import MyBookings from "./pages/MyBookings";
import SubmitReview from "./pages/SubmitReview";
import ProviderDashboard from "./pages/ProviderDashboard";
import ProviderVerification from "./pages/ProviderVerification";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/provider-dashboard" element={<ProviderDashboard />} />
            <Route path="/provider-verification" element={<ProviderVerification />} />
            <Route path="/provider/:id" element={<ProviderProfile />} />
            <Route path="/review/:bookingId" element={<SubmitReview />} />
          </Routes>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
