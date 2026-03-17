// src/components/layout/Sidebar.jsx
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Member-only links
  const memberLinks = [
    { path: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { path: '/discover', icon: '🔥', label: 'Discover' },
    { path: '/prayer-wall', icon: '🙏', label: 'Prayer Wall' },
    { path: '/groups', icon: '🤝', label: 'Groups' },
    { path: '/community', icon: '📢', label: 'Community Board' },
    
  ];

  // Bible tools - VERSE OF THE DAY REMOVED (now on dashboard)
  const bibleLinks = [
    { path: '/bible/reader', icon: '📖', label: 'Bible Reader' },
    { path: '/bible/queue', icon: '⏳', label: 'Verse Queue' },
    { path: '/bible/bookmarks', icon: '🔖', label: 'Bookmarks' },
    { path: '/my-submissions', icon: '📤', label: 'My Shared Verses' },
    { path: '/learning', icon: '📚', label: 'Learning Hub' },
  ];

  // Admin-only links
  const adminLinks = [
    { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/admin/users', icon: '👥', label: 'User Management' },
    { path: '/admin/moderation', icon: '📝', label: 'Content Moderation' },
    { path: '/admin/bible/queue', icon: '📖', label: 'Verse Moderation' },
    { path: '/admin/announcements', icon: '📢', label: 'Announcements' },
    { path: '/admin/analytics', icon: '📈', label: 'Analytics' },
    { path: '/admin/settings', icon: '⚙️', label: 'Settings' },
    { path: '/admin/security/ip', icon: '🔒', label: 'IP Blocking' },
    { path: '/admin/security/sessions', icon: '🖥️', label: 'Sessions' },
    { path: '/admin/security/attempts', icon: '🔐', label: 'Login Attempts' },
    { path: '/admin/backups', icon: '💾', label: 'Backups' },
    { path: '/admin/health', icon: '🏥', label: 'System Health' },
  ];

  if (!user) return null;

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3 className="sidebar-title">Menu</h3>
          <button className="sidebar-close" onClick={onClose}>✕</button>
        </div>

        <nav className="sidebar-nav">
          {/* For regular users (non-admins) - show member sections */}
          {!isAdmin && (
            <>
              {/* Main Section */}
              <div className="sidebar-section">
                <h4 className="sidebar-section-title">Main</h4>
                {memberLinks.map(link => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) => 
                      `sidebar-link ${isActive ? 'active' : ''}`
                    }
                    onClick={onClose}
                  >
                    <span className="sidebar-icon">{link.icon}</span>
                    <span>{link.label}</span>
                  </NavLink>
                ))}
              </div>

              {/* Bible Tools Section */}
              <div className="sidebar-section">
                <h4 className="sidebar-section-title">📖 Bible Tools</h4>
                {bibleLinks.map(link => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) => 
                      `sidebar-link ${isActive ? 'active' : ''}`
                    }
                    onClick={onClose}
                  >
                    <span className="sidebar-icon">{link.icon}</span>
                    <span>{link.label}</span>
                  </NavLink>
                ))}
              </div>
            </>
          )}

          {/* For admins - ONLY show admin panel */}
          {isAdmin && (
            <div className="sidebar-section">
              <h4 className="sidebar-section-title">👑 Admin Panel</h4>
              {adminLinks.map(link => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) => 
                    `sidebar-link ${isActive ? 'active' : ''}`
                  }
                  onClick={onClose}
                >
                  <span className="sidebar-icon">{link.icon}</span>
                  <span>{link.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;