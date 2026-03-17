// src/components/layout/Navbar.jsx
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import Avatar from '../common/Avatar';
import NotificationDropdown from '../notifications/NotificationDropdown';
import './Navbar.css';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { unreadCount, requestBrowserPermission } = useNotifications();
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  // Request browser notification permission on mount
  useEffect(() => {
    requestBrowserPermission();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Hamburger Menu Button (for mobile) */}
        <button 
          className="mobile-menu-button" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          ☰
        </button>

        {/* Logo - always goes to appropriate home */}
        <Link to={user ? '/dashboard' : '/'} className="logo">
          <span className="logo-icon">✝️</span>
          <span className="logo-text">SDA Youth Connect</span>
        </Link>

        {/* Desktop Navigation - EMPTY for now */}
        <div className="nav-links">
          {/* No links here - keeping space for future */}
        </div>

        {/* User Menu / Auth Buttons */}
        <div className="user-section">
          {user ? (
            <>
              {/* Notification Bell with Badge */}
              <div className="notification-wrapper" ref={notificationRef}>
                <button 
                  className="notification-bell"
                  onClick={() => setShowNotifications(!showNotifications)}
                  aria-label="Notifications"
                >
                  <span className="bell-icon">🔔</span>
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <NotificationDropdown onClose={() => setShowNotifications(false)} />
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="profile-container" ref={profileRef}>
                <button 
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="profile-button"
                  aria-label="Profile menu"
                >
                  <Avatar user={user} size="small" />
                  <span className="user-name">{user.name}</span>
                  <span className="dropdown-icon">▼</span>
                </button>
                
                {isProfileMenuOpen && (
                  <div className="dropdown-menu">
                    <Link to="/dashboard" className="dropdown-item" onClick={() => setIsProfileMenuOpen(false)}>
                      <span className="dropdown-icon">🏠</span> Dashboard
                    </Link>
                    <Link to="/profile" className="dropdown-item" onClick={() => setIsProfileMenuOpen(false)}>
                      <span className="dropdown-icon">👤</span> My Profile
                    </Link>
                    <Link to="/my-submissions" className="dropdown-item" onClick={() => setIsProfileMenuOpen(false)}>
                      <span className="dropdown-icon">📤</span> My Verses
                    </Link>
                    <Link to="/community" className="dropdown-item" onClick={() => setIsProfileMenuOpen(false)}>
                      <span className="dropdown-icon">👥</span> Community
                    </Link>
                    <Link to="/learning" className="dropdown-item" onClick={() => setIsProfileMenuOpen(false)}>
                      <span className="dropdown-icon">📚</span> Learning Hub
                    </Link>
                    {user.isAdmin && (
                      <>
                        <hr className="dropdown-divider" />
                        <Link to="/admin/dashboard" className="dropdown-item" onClick={() => setIsProfileMenuOpen(false)}>
                          <span className="dropdown-icon">⚙️</span> Admin Panel
                        </Link>
                      </>
                    )}
                    <hr className="dropdown-divider" />
                    <button onClick={handleLogout} className="dropdown-item">
                      <span className="dropdown-icon">🚪</span> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="auth-buttons">
              <button onClick={() => navigate('/login')} className="login-button">Login</button>
              <button onClick={() => navigate('/register')} className="register-button">Sign Up</button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          {/* Mobile menu for logged-in users */}
          {user ? (
            <>
              <Link to="/dashboard" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="mobile-link-icon">🏠</span> Dashboard
              </Link>
              <Link to="/profile" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="mobile-link-icon">👤</span> My Profile
              </Link>
              <Link to="/my-submissions" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="mobile-link-icon">📤</span> My Verses
              </Link>
              <Link to="/community" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="mobile-link-icon">👥</span> Community
              </Link>
              <Link to="/learning" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="mobile-link-icon">📚</span> Learning Hub
              </Link>
              {user.isAdmin && (
                <>
                  <hr className="mobile-divider" />
                  <Link to="/admin/dashboard" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
                    <span className="mobile-link-icon">⚙️</span> Admin Panel
                  </Link>
                </>
              )}
              <hr className="mobile-divider" />
              <button onClick={() => {
                handleLogout();
                setIsMobileMenuOpen(false);
              }} className="mobile-logout-button">
                <span className="mobile-link-icon">🚪</span> Logout
              </button>
            </>
          ) : (
            // Mobile menu for logged-out users
            <>
              <Link to="/" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="mobile-link-icon">🏠</span> Home
              </Link>
              <Link to="/about" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="mobile-link-icon">ℹ️</span> About
              </Link>
              <Link to="/contact" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="mobile-link-icon">📧</span> Contact
              </Link>
              <hr className="mobile-divider" />
              <button onClick={() => {
                navigate('/login');
                setIsMobileMenuOpen(false);
              }} className="mobile-login-button">Login</button>
              <button onClick={() => {
                navigate('/register');
                setIsMobileMenuOpen(false);
              }} className="mobile-register-button">Sign Up</button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;