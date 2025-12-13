import React from "react";
import { Link } from "react-router-dom";
import {
  Twitter,
  Instagram,
  Facebook,
  Youtube,
  Mail,
  Phone,
  Heart,
  ArrowUp,
} from "lucide-react";

const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-dark-900 via-black text-gray-300">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-4">
              <img
                src={"/logo.svg"}
                alt="Arouzy"
                className="w-8 h-8 mr-2 cursor-pointer"
              />
              <h3 className="text-xl font-bold text-white">Arouzy</h3>
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Discover, share, and connect through amazing content. Join our
              community of creators and enthusiasts.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <Twitter size={20} />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <Instagram size={20} />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <Facebook size={20} />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <Youtube size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-lg">
              Viewer
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Shop
                </Link>
              </li>
              <li>
                <Link
                  to="/bookstreaming/:userId"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Book Streaming
                </Link>
              </li>
              <li>
                <Link
                  to="/privatecontent"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                 Private Content
                </Link>
              </li>
              <li>
                <Link
                  to="/customorder"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Custom Order
                </Link>
              </li>
              <li>
                <Link
                  to="/settings"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-lg">Provider</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/upload"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Upload Contents
                </Link>
              </li>
              <li>
                <Link
                  to="/providecontent"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Deliver Contents
                </Link>
              </li>
              <li>
                <Link
                  to="/scheduling"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Streaming Schedule
                </Link>
              </li>
              <li>
                <Link
                  to="/create_gig/:userId"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Create Gig
                </Link>
              </li>
              <li>
                <Link
                  to="/analytics"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Analytics Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-lg">
              Legal & Contact
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/terms"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/dmca"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  DMCA/Abuse
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  About Us
                </Link>
              </li>
            </ul>

            {/* Contact Info */}
            <div className="mt-6 space-y-2">
              <div className="flex items-center text-gray-400">
                <Mail size={16} className="mr-2" />
                <span className="text-sm">support@arouzy.com</span>
              </div>
              <div className="flex items-center text-gray-400">
                <Phone size={16} className="mr-2" />
                <span className="text-sm">+1 (555) 123-4567</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center text-gray-400 text-sm">
              <span>
                &copy; {new Date().getFullYear()} Arouzy. All rights reserved.
              </span>
              <span className="mx-2">•</span>
              <span>Made with</span>
              <Heart size={14} className="mx-1 text-red-500" />
              <span>for creators</span>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={scrollToTop}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-200"
              >
                <span className="text-sm">Back to top</span>
                <ArrowUp size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
