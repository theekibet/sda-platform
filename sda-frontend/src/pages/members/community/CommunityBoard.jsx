import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { communityService } from '../../../services/communityService';
import PostCard from './PostCard';
import './community.css'; // This should work - if not, rename to CommunityBoard.css

const CommunityBoard = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Use AuthContext instead of manual fetch
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocalOnly, setShowLocalOnly] = useState(false);
  const [radius, setRadius] = useState(50); // Default radius in km

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await communityService.getPosts();
        setPosts(response.data || []);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 10) / 10; // Round to 1 decimal
  };

  // Filter and process posts
  useEffect(() => {
    let filtered = [...posts];

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(post => post.type === selectedType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post => 
        post.title?.toLowerCase().includes(query) ||
        post.description?.toLowerCase().includes(query) ||
        post.author?.name?.toLowerCase().includes(query)
      );
    }

    // Filter by location proximity
    if (showLocalOnly && user?.latitude && user?.longitude) {
      filtered = filtered.filter(post => {
        if (post.author?.latitude && post.author?.longitude) {
          const distance = calculateDistance(
            user.latitude,
            user.longitude,
            post.author.latitude,
            post.author.longitude
          );
          return distance !== null && distance <= radius;
        }
        return false;
      });

      // Add distance to posts for display
      filtered = filtered.map(post => {
        if (post.author?.latitude && post.author?.longitude) {
          const distance = calculateDistance(
            user.latitude,
            user.longitude,
            post.author.latitude,
            post.author.longitude
          );
          return { ...post, distance };
        }
        return post;
      });
    }

    // Sort by newest first
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setFilteredPosts(filtered);
  }, [posts, selectedType, searchQuery, showLocalOnly, radius, user]);

  const getUserLocationName = () => {
    if (!user) return '';
    
    if (user.locationName) {
      return user.locationName.split(',')[0].trim();
    }
    
    return 'your area';
  };

  const handleRadiusChange = (newRadius) => {
    setRadius(newRadius);
  };

  if (loading) {
    return (
      <div className="community-board-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading community posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="community-board-container">
      {/* Header */}
      <div className="community-board-header">
        <h1>Community Board</h1>
        <p>Connect, share, and support each other</p>
      </div>

      {/* Location Prompt - Show if user hasn't set location */}
      {!user?.locationName && !user?.latitude && (
        <div className="location-prompt">
          <div className="location-prompt-content">
            <div className="location-prompt-icon">📍</div>
            <div className="location-prompt-text">
              <h3>Enable Location Features</h3>
              <p>Set your location to see posts from your area and connect with nearby members</p>
            </div>
          </div>
          <button 
            className="location-prompt-button"
            onClick={() => navigate('/profile')}
          >
            Set Up Location
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="community-board-controls">
        <div className="controls-top-row">
          {/* Type Filter */}
          <select 
            className="control-select"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">All Posts</option>
            <option value="event">Events</option>
            <option value="support">Support</option>
            <option value="ride">Ride Share</option>
            <option value="donation">Donations</option>
            <option value="announcement">Announcements</option>
            <option value="general">General</option>
          </select>

          {/* Search */}
          <input
            type="text"
            className="control-search"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Create Post Button */}
          <button 
            className="create-post-button"
            onClick={() => navigate('/community/create')}
          >
            + Create Post
          </button>
        </div>

        {/* Location Toggle - Only show if user has location */}
        {(user?.locationName || user?.latitude) && (
          <div className="location-toggle-container">
            <label className="location-toggle-label">
              <input
                type="checkbox"
                className="location-toggle-checkbox"
                checked={showLocalOnly}
                onChange={(e) => setShowLocalOnly(e.target.checked)}
              />
              <span className="location-toggle-text">
                📍 Only show posts near {getUserLocationName()}
              </span>
            </label>

            {/* Radius Selector - Show when local filter is active */}
            {showLocalOnly && (
              <select
                className="control-select"
                value={radius}
                onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
                style={{ width: '100px', marginLeft: '10px' }}
              >
                <option value={10}>10km</option>
                <option value={25}>25km</option>
                <option value={50}>50km</option>
                <option value={100}>100km</option>
              </select>
            )}
          </div>
        )}
      </div>

      {/* Posts Grid */}
      {filteredPosts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <h3>No posts found</h3>
          <p>
            {searchQuery 
              ? 'Try adjusting your search'
              : showLocalOnly
              ? `No posts within ${radius}km of your area. Try increasing the radius.`
              : 'Be the first to create a post!'
            }
          </p>
        </div>
      ) : (
        <div className="posts-grid">
          {filteredPosts.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              currentUser={user}
              formatDistance={(distance) => {
                if (distance < 1) return `${Math.round(distance * 1000)}m away`;
                return `${distance.toFixed(1)}km away`;
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommunityBoard;