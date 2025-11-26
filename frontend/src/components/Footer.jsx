import { Link } from "react-router-dom";
import {
  Wrench,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from "lucide-react";

function Footer() {
  return (
    <footer
      className="bg-gray-900 text-gray-300"
      role="contentinfo"
      aria-label="Site footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* About Section */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-linear-to-br from-cyan-500 to-cyan-600 p-2 rounded-lg">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">HomeHero</span>
            </div>
            <p className="text-gray-400 mb-4">
              Goa's trusted platform for connecting homeowners with verified
              local service professionals.
            </p>
            <div
              className="flex space-x-4"
              role="group"
              aria-label="Social media links"
            >
              <a
                href="#"
                className="hover:text-cyan-500 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded"
                aria-label="Follow us on Facebook"
              >
                <Facebook className="h-5 w-5" aria-hidden="true" />
              </a>
              <a
                href="#"
                className="hover:text-cyan-500 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded"
                aria-label="Follow us on Twitter"
              >
                <Twitter className="h-5 w-5" aria-hidden="true" />
              </a>
              <a
                href="#"
                className="hover:text-cyan-500 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded"
                aria-label="Follow us on Instagram"
              >
                <Instagram className="h-5 w-5" aria-hidden="true" />
              </a>
              <a
                href="#"
                className="hover:text-cyan-500 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded"
                aria-label="Connect with us on LinkedIn"
              >
                <Linkedin className="h-5 w-5" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <nav aria-label="Quick links">
            <h3 className="text-white font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="hover:text-cyan-500 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/search"
                  className="hover:text-cyan-500 transition-colors"
                >
                  Find Services
                </Link>
              </li>
              <li>
                <Link
                  to="/my-bookings"
                  className="hover:text-cyan-500 transition-colors"
                >
                  My Bookings
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-cyan-500 transition-colors">
                  About Us
                </a>
              </li>
            </ul>
          </nav>

          {/* Services */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">
              Popular Services
            </h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="hover:text-cyan-500 transition-colors">
                  Plumbing
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-cyan-500 transition-colors">
                  Electrical
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-cyan-500 transition-colors">
                  Carpentry
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-cyan-500 transition-colors">
                  Cleaning
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-cyan-500 transition-colors">
                  AC Repair
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-cyan-500 mt-1 shrink-0" />
                <span>Panjim, Goa, India</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-cyan-500 shrink-0" />
                <span>+91 1234567890</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-cyan-500 shrink-0" />
                <span>support@homehero.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} HomeHero. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="hover:text-cyan-500 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-cyan-500 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-cyan-500 transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
