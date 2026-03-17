// src/components/notifications/NotificationDropdown.jsx
import React, { useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationItem from './NotificationItem';
import './NotificationDropdown.css';

const NotificationDropdown = ({ onClose }) => {
  const { notifications, loading, fetchNotifications, markAllAsRead, unreadCount } = useNotifications();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleViewAll = () => {
    // Navigate to notifications page
    window.location.href = '/notifications';
    onClose();
  };

  return (
    <div className="notification-dropdown">
      <div className="dropdown-header">
        <h3>Notifications</h3>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="mark-all-read">
            Mark all as read
          </button>
        )}
      </div>

      <div className="dropdown-content">
        {loading ? (
          <div className="loading-spinner-small"></div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <p>No notifications yet</p>
          </div>
        ) : (
          <>
            {notifications.slice(0, 5).map(notification => (
              <NotificationItem 
                key={notification.id} 
                notification={notification} 
                onClose={onClose}
              />
            ))}
            
            {notifications.length > 5 && (
              <button onClick={handleViewAll} className="view-all">
                View all {notifications.length} notifications
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;