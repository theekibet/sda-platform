// src/components/notifications/NotificationItem.jsx
import React from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const NotificationItem = ({ notification, onClose }) => {
  const { markAsRead, deleteNotification } = useNotifications();

  const getIcon = (type) => {
    const icons = {
      forum_reply: '💬',
      prayer_response: '🙏',
      verse_published: '📖',
      group_invite: '👥',
      announcement: '📢',
    };
    return icons[type] || '🔔';
  };

  const handleClick = () => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    // Navigate based on notification data
    if (notification.data?.url) {
      window.location.href = notification.data.url;
    }
    
    onClose();
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    deleteNotification(notification.id);
  };

  return (
    <div 
      className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
      onClick={handleClick}
    >
      <div className="notification-icon">{getIcon(notification.type)}</div>
      
      <div className="notification-content">
        <div className="notification-title">{notification.title}</div>
        <div className="notification-message">{notification.message}</div>
        <div className="notification-time">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </div>
      </div>

      <button 
        className="notification-delete"
        onClick={handleDelete}
        aria-label="Delete"
      >
        ✕
      </button>
    </div>
  );
};

export default NotificationItem;