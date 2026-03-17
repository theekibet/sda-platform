import React from 'react';
import { useNavigate } from 'react-router-dom';
import './community.css';

const PostCard = ({ post, currentUser, formatDistance }) => {
  const navigate = useNavigate();

  // Get location display based on privacy and distance
  const getLocationDisplay = () => {
    // If post has distance (from local filtering) and user has permission
    if (post.distance && post.author?.locationPrivacy === 'exact') {
      return formatDistance ? formatDistance(post.distance) : `${post.distance.toFixed(1)}km away`;
    }
    
    // Show author's location name based on privacy
    if (post.author?.locationName) {
      if (post.author.locationPrivacy === 'city') {
        const city = post.author.locationName.split(',')[0].trim();
        return `📍 ${city}`;
      }
      if (post.author.locationPrivacy === 'country') {
        const country = post.author.locationName.split(',').pop()?.trim() || post.author.locationName;
        return `📍 ${country}`;
      }
    }
    
    // Fallback to post's own location field
    if (post.location) {
      return `📍 ${post.location}`;
    }
    
    return null;
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getTypeColor = (type) => {
    const colors = {
      event: 'post-type-event',
      support: 'post-type-support',
      ride: 'post-type-ride',
      donation: 'post-type-donation',
      announcement: 'post-type-announcement',
      general: 'post-type-general'
    };
    return colors[type] || colors.general;
  };

  const getAuthorInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const calculateProgress = () => {
    if (!post.goalAmount || post.goalAmount === 0) return 0;
    return Math.min((post.currentAmount / post.goalAmount) * 100, 100);
  };

  const locationDisplay = getLocationDisplay();

  return (
    <div className="post-card" onClick={() => navigate(`/community/${post.id}`)}>
      {/* Header */}
      <div className="post-card-header">
        <div className="post-header-top">
          <div className="post-author-section">
            <div className="post-author-avatar">
              {post.author?.avatarUrl ? (
                <img 
                  src={post.author.avatarUrl} 
                  alt={post.author.name}
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                getAuthorInitials(post.author?.name || 'Unknown')
              )}
            </div>
            <div className="post-author-info">
              <div className="post-author-name">
                {post.author?.name || 'Anonymous'}
              </div>
              <div className="post-timestamp">
                {formatTimeAgo(post.createdAt)}
              </div>
            </div>
          </div>
          <div className={`post-type-badge ${getTypeColor(post.type)}`}>
            {post.type}
          </div>
        </div>

        {/* Location Badge */}
        {locationDisplay && (
          <div className="post-location-badge">
            {locationDisplay}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="post-card-body">
        <h3 className="post-title">{post.title}</h3>
        <p className="post-description">
          {post.description?.length > 150 
            ? `${post.description.substring(0, 150)}...` 
            : post.description
          }
        </p>

        {/* Type-specific details */}
        <div className="post-details-grid">
          {/* Event Details */}
          {post.type === 'event' && post.eventDate && (
            <>
              <div className="post-detail-row">
                <span className="post-detail-icon">📅</span>
                <span className="post-detail-label">Date:</span>
                <span className="post-detail-value">
                  {new Date(post.eventDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
              {post.location && (
                <div className="post-detail-row">
                  <span className="post-detail-icon">📍</span>
                  <span className="post-detail-label">Venue:</span>
                  <span className="post-detail-value">{post.location}</span>
                </div>
              )}
            </>
          )}

          {/* Donation Details */}
          {(post.type === 'donation' || post.type === 'support') && post.goalAmount && (
            <div className="donation-progress">
              <div className="donation-progress-info">
                <span className="donation-amount">
                  KSh {post.currentAmount?.toLocaleString() || 0}
                </span>
                <span className="donation-goal">
                  of KSh {post.goalAmount.toLocaleString()}
                </span>
              </div>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${calculateProgress()}%` }}
                />
              </div>
            </div>
          )}

          {/* Support Items */}
          {post.type === 'support' && post.itemsNeeded && (
            <div className="post-detail-row">
              <span className="post-detail-icon">📦</span>
              <span className="post-detail-label">Needs:</span>
              <span className="post-detail-value">{post.itemsNeeded}</span>
            </div>
          )}

          {/* Ride Details */}
          {post.type === 'ride' && (
            <>
              {post.fromLocation && (
                <div className="post-detail-row">
                  <span className="post-detail-icon">🚗</span>
                  <span className="post-detail-label">From:</span>
                  <span className="post-detail-value">{post.fromLocation}</span>
                </div>
              )}
              {post.toLocation && (
                <div className="post-detail-row">
                  <span className="post-detail-icon">🎯</span>
                  <span className="post-detail-label">To:</span>
                  <span className="post-detail-value">{post.toLocation}</span>
                </div>
              )}
              {post.departureTime && (
                <div className="post-detail-row">
                  <span className="post-detail-icon">⏰</span>
                  <span className="post-detail-label">Departure:</span>
                  <span className="post-detail-value">
                    {new Date(post.departureTime).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
              {post.seatsAvailable && (
                <div className="post-detail-row">
                  <span className="post-detail-icon">💺</span>
                  <span className="post-detail-label">Seats:</span>
                  <span className="post-detail-value">{post.seatsAvailable} available</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Contact Info */}
        {(post.contactPhone || post.contactEmail) && (
          <div className="contact-info">
            {post.contactPhone && (
              <div className="contact-item">
                📞 <a href={`tel:${post.contactPhone}`}>{post.contactPhone}</a>
              </div>
            )}
            {post.contactEmail && (
              <div className="contact-item">
                ✉️ <a href={`mailto:${post.contactEmail}`}>{post.contactEmail}</a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="post-card-footer">
        <div className="post-engagement">
          {post.interestedCount > 0 && (
            <div className="engagement-item">
              👍 <span className="engagement-count">{post.interestedCount}</span> interested
            </div>
          )}
          {post.goingCount > 0 && (
            <div className="engagement-item">
              ✓ <span className="engagement-count">{post.goingCount}</span> going
            </div>
          )}
          {post.responses?.length > 0 && (
            <div className="engagement-item">
              💬 <span className="engagement-count">{post.responses.length}</span> responses
            </div>
          )}
        </div>
        <button 
          className="view-details-button"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/community/${post.id}`);
          }}
        >
          View Details →
        </button>
      </div>
    </div>
  );
};

export default PostCard;