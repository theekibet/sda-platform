// src/components/layout/Navbar.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../common/Avatar';
import './Navbar.css';  // Import the CSS file

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        >
          ☰
        </button>

        {/* Logo */}
        <Link to="/" className="logo">
          <span className="logo-icon">✝️</span>
          <span className="logo-text">SDA Youth Connect</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/about" className="nav-link">About</Link>
          <Link to="/contact" className="nav-link">Contact</Link>
        </div>

        {/* User Menu / Auth Buttons */}
        <div className="user-section">
          {user ? (
            <div className="profile-container">
              <button 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="profile-button"
              >
                <Avatar user={user} size="small" />
                <span className="user-name">{user.name}</span>
                <span className="dropdown-icon">▼</span>
              </button>
              
              {isProfileMenuOpen && (
                <div className="dropdown-menu">
                  <Link to="/dashboard" className="dropdown-item">Dashboard</Link>
                  <Link to="/profile" className="dropdown-item">My Profile</Link>
                  {user.isAdmin && (
                    <Link to="/admin/dashboard" className="dropdown-item">Admin Panel</Link>
                  )}
                  <hr className="dropdown-divider" />
                  <button onClick={handleLogout} className="dropdown-item">Logout</button>
                </div>
              )}
            </div>
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
          <Link to="/" className="mobile-link">Home</Link>
          <Link to="/about" className="mobile-link">About</Link>
          <Link to="/contact" className="mobile-link">Contact</Link>
          {!user && (
            <>
              <hr className="mobile-divider" />
              <button onClick={() => navigate('/login')} className="mobile-login-button">Login</button>
              <button onClick={() => navigate('/register')} className="mobile-register-button">Sign Up</button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;