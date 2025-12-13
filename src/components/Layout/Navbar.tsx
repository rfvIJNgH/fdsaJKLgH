import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Menu,
  X,
  User,
  LogOut,
  MessageCircle,
  Bell,
  Heart,
  Plus,
} from "lucide-react";
import { useNotifications } from "../../contexts/NotificationContext";
import { useChatStore } from "../../store/useChatStore";
import NotificationDropdown from "./NotificationDropdown";
import { useCoin } from '../../contexts/CoinContext';

const Navbar: React.FC = () => {
  const { fetchCoinData, coinData } = useCoin();
  const { user, isAuthenticated, logout, ProfileImage } = useAuth();
  const { getTotalUnreadUsersCount } = useChatStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] =
    useState<boolean>(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Get total unread users count
  const totalUnreadUsers = getTotalUnreadUsersCount();

  // Add notifications context
  const { notificationCounts } = useNotifications();

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchCoinData(user.id);
    }
  }, [isAuthenticated]);

  // Handle click outside profile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleProfileMenu = () => setIsProfileMenuOpen(!isProfileMenuOpen);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setIsProfileMenuOpen(false);
  };

  const handleCloseNotificationDropdown = () => {
    setIsNotificationDropdownOpen(false);
  };

  const handlePurchaseCoins = () => {
    // Navigate to coin purchase page or open modal
    navigate("/purchase-coins");
  };

  return (
    <nav className="bg-dark-900 py-4 px-6 border-b border-dark-600">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-primary-500 font-bold text-2xl font-handwriting">
            Arouzy
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8 mx-8">
          <Link
            to="/trading"
            className="text-white hover:text-primary-300 transition-colors"
          >
            Trading
          </Link>
          <Link
            to="/streaming"
            className="text-white bg-primary-500 hover:bg-primary-600 transition-colors px-4 py-2 text-white rounded-full"
          >
            Streaming
          </Link>
        </div>

        <div className="hidden md:flex flex-1 max-w-xl mx-8">
          <div className="relative w-full">
          </div>
        </div>

        {/* Heart Coins Section */}
        {isAuthenticated && (
          <div className="hidden md:flex items-center space-x-2 mx-4">
            <div className="flex items-center bg-dark-800 rounded-full px-3 py-1.5 border border-dark-600">
              <Heart className="h-5 w-5 text-yellow-500 fill-yellow-500 mr-2" />
              <span className="text-white font-medium text-sm">
                {coinData?.coins ?? 0}
              </span>
              <button
                onClick={handlePurchaseCoins}
                className="ml-2 p-1 bg-yellow-500 hover:bg-yellow-600 rounded-full transition-colors group"
                title="Purchase Heart Coins"
              >
                <Plus className="h-3 w-3 text-dark-900" />
              </button>
            </div>
          </div>
        )}

        {/* Auth Buttons / User Profile */}
        <div className="hidden md:flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              {/* Notification Icon */}
              <button
                className="relative mr-2"
                onClick={() => setIsNotificationDropdownOpen(true)}
                aria-label="Notification"
              >
                <Bell className="h-6 w-6 text-white" />
                {notificationCounts.total > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.2rem] text-center">
                    {notificationCounts.total > 99
                      ? "99+"
                      : notificationCounts.total}
                  </span>
                )}
              </button>
              {/* Message Icon */}
              <button
                className="relative mr-2"
                onClick={() => navigate("/messages")}
                aria-label="Messages"
              >
                <MessageCircle className="h-6 w-6 text-white" />
                {totalUnreadUsers > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.2rem] text-center">
                    {totalUnreadUsers > 99 ? "99+" : totalUnreadUsers}
                  </span>
                )}
              </button>
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={toggleProfileMenu}
                  className="flex items-center space-x-2 text-white hover:text-primary-300 transition-colors focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-600 hover:border-primary-500 transition-colors">
                    {ProfileImage || user?.profile_image ? (
                      <img
                        src={ProfileImage || user?.profile_image}
                        alt={user?.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                          {user?.username?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </button>

                {/* Profile Dropdown */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-dark-800 rounded-md shadow-lg py-1 z-50 animate-fade-in">
                    <Link
                      to={`/${user?.username}/profile`}
                      className="block px-4 py-2 text-sm text-white hover:bg-dark-700"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      to={`/mycontent/${user?.username}`}
                      className="block px-4 py-2 text-sm text-white hover:bg-dark-700"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      My Contents
                    </Link>
                    <Link
                      to={`/collections`}
                      className="block px-4 py-2 text-sm text-white hover:bg-dark-700"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      My Collections
                    </Link>
                    <Link
                      to={`/upgradeplan`}
                      className="block px-4 py-2 text-sm text-white hover:bg-dark-700"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Upgrade Plan
                    </Link>
                    <Link
                      to={`/settings`}
                      className="block px-4 py-2 text-sm text-white hover:bg-dark-700"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-dark-700"
                    >
                      <div className="flex items-center">
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign out
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="text-white hover:text-primary-300 px-4 py-1.5 rounded-full transition-colors duration-200"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-1.5 rounded-full transition-colors duration-200"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white focus:outline-none"
          onClick={toggleMenu}
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-dark-800 mt-4 py-4 px-6 animate-slide-down">
          <div className="flex flex-col space-y-4">

            {/* Mobile Heart Coins Section */}
            {isAuthenticated && (
              <div className="flex items-center justify-between bg-dark-700 rounded-lg px-4 py-3 mb-2">
                <div className="flex items-center">
                  <Heart className="h-5 w-5 text-yellow-500 fill-yellow-500 mr-2" />
                  <span className="text-white font-medium">
                    {coinData?.coins ?? 0}
                  </span>
                </div>
                <button
                  onClick={() => {
                    handlePurchaseCoins();
                    setIsMenuOpen(false);
                  }}
                  className="p-2 bg-yellow-500 hover:bg-yellow-600 rounded-full transition-colors"
                  title="Purchase Heart Coins"
                >
                  <Plus className="h-4 w-4 text-dark-900" />
                </button>
              </div>
            )}

            <Link
              to="/"
              className="text-white hover:text-primary-300 transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Shop
            </Link>
            <Link
              to="/trading"
              className="text-white hover:text-primary-300 transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Trading
            </Link>
            {!isAuthenticated ? (
              <div className="flex flex-col space-y-2 pt-4 border-t border-dark-600">
                <Link
                  to="/login"
                  className="text-white hover:text-primary-300 transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-primary-500 hover:bg-primary-600 text-white py-2 rounded-full text-center transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign up
                </Link>
              </div>
            ) : (
              <div className="flex flex-col space-y-2 pt-4 border-t border-dark-600">
                {/* Notification Button */}
                <button
                  onClick={() => {
                    setIsNotificationDropdownOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="text-white hover:text-primary-300 transition-colors py-2 flex items-center"
                >
                  <span>Notifications</span>
                  {notificationCounts.total > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.2rem] text-center">
                      {notificationCounts.total > 99
                        ? "99+"
                        : notificationCounts.total}
                    </span>
                  )}
                </button>
                {/* Message Button */}
                <Link
                  to="/messages"
                  className="text-white hover:text-primary-300 transition-colors py-2 flex items-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span>Messages</span>
                  {totalUnreadUsers > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.2rem] text-center">
                      {totalUnreadUsers > 99 ? "99+" : totalUnreadUsers}
                    </span>
                  )}
                </Link>
                <Link
                  to={`/profile/${user?.username}`}
                  className="text-white hover:text-primary-300 transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
                <Link
                  to={`/collections`}
                  className="text-white hover:text-primary-300 transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Collections
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="text-white hover:text-primary-300 transition-colors py-2 text-left"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notification Dropdown */}
      <NotificationDropdown
        isOpen={isNotificationDropdownOpen}
        onClose={handleCloseNotificationDropdown}
      />
    </nav>
  );
};

export default Navbar;