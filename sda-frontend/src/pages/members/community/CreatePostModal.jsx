import React, { useState } from 'react';
import { communityService } from '../../../services/communityService';
import './community.css';

const CreatePostModal = ({ onClose, onPostCreated }) => {
  const [postType, setPostType] = useState('event');
  const [formData, setFormData] = useState({
    type: 'event',
    title: '',
    description: '',
    eventDate: '',
    location: '',
    goalAmount: '',
    currentAmount: '',
    itemsNeeded: '',
    fromLocation: '',
    toLocation: '',
    departureTime: '',
    seatsAvailable: '',
    contactPhone: '',
    contactEmail: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
      type: postType,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Prepare data based on type
      const submitData = { ...formData };
      
      // Convert numeric fields
      if (submitData.goalAmount) submitData.goalAmount = parseFloat(submitData.goalAmount);
      if (submitData.currentAmount) submitData.currentAmount = parseFloat(submitData.currentAmount);
      if (submitData.seatsAvailable) submitData.seatsAvailable = parseInt(submitData.seatsAvailable);
      
      // Remove empty fields
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '') delete submitData[key];
      });

      const response = await communityService.createPost(submitData);
      onPostCreated(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const renderTypeSpecificFields = () => {
    switch(postType) {
      case 'event':
        return (
          <div className="type-specific-fields">
            <div className="form-group">
              <label className="form-label form-label-required">Event Date & Time</label>
              <input
                type="datetime-local"
                name="eventDate"
                value={formData.eventDate}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Church Hall, Zoom link, Nairobi CBD, etc."
                className="form-input"
              />
            </div>
          </div>
        );

      case 'support':
      case 'donation':
        return (
          <div className="type-specific-fields">
            <div className="form-group">
              <label className="form-label">Goal Amount (KSh)</label>
              <input
                type="number"
                name="goalAmount"
                value={formData.goalAmount}
                onChange={handleChange}
                placeholder="50000"
                min="0"
                step="0.01"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Current Amount Raised (KSh)</label>
              <input
                type="number"
                name="currentAmount"
                value={formData.currentAmount}
                onChange={handleChange}
                placeholder="25000"
                min="0"
                step="0.01"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Items Needed</label>
              <input
                type="text"
                name="itemsNeeded"
                value={formData.itemsNeeded}
                onChange={handleChange}
                placeholder="Bibles, clothes, food, school supplies..."
                className="form-input"
              />
            </div>
          </div>
        );

      case 'ride':
        return (
          <div className="type-specific-fields">
            <div className="form-group">
              <label className="form-label form-label-required">From</label>
              <input
                type="text"
                name="fromLocation"
                value={formData.fromLocation}
                onChange={handleChange}
                placeholder="Nairobi CBD"
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label form-label-required">To</label>
              <input
                type="text"
                name="toLocation"
                value={formData.toLocation}
                onChange={handleChange}
                placeholder="Mombasa"
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Departure Time</label>
              <input
                type="datetime-local"
                name="departureTime"
                value={formData.departureTime}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Seats Available</label>
              <input
                type="number"
                name="seatsAvailable"
                value={formData.seatsAvailable}
                onChange={handleChange}
                placeholder="3"
                min="1"
                className="form-input"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getTypeDescription = () => {
    const descriptions = {
      event: 'Share upcoming church events, youth gatherings, or community meetups',
      support: 'Request prayer, emotional support, or assistance from the community',
      ride: 'Offer or request rides to church events or other destinations',
      donation: 'Raise funds or collect items for a cause',
      announcement: 'Share important news or updates with the community',
      general: 'Share thoughts, questions, or general discussions'
    };
    return descriptions[postType];
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create New Post</h2>
          <button className="modal-close-button" onClick={onClose}>×</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {/* Post Type Selection */}
          <div className="form-group">
            <label className="form-label form-label-required">Post Type</label>
            <select
              value={postType}
              onChange={(e) => {
                setPostType(e.target.value);
                setFormData({ ...formData, type: e.target.value });
              }}
              className="form-select"
            >
              <option value="event">📅 Event</option>
              <option value="support">🙏 Support Needed</option>
              <option value="ride">🚗 Ride Share</option>
              <option value="donation">🎁 Donation</option>
              <option value="announcement">📢 Announcement</option>
              <option value="general">📌 General</option>
            </select>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '8px', marginBottom: 0 }}>
              {getTypeDescription()}
            </p>
          </div>

          <div className="form-section-divider" />

          {/* Basic Fields */}
          <div className="form-group">
            <label className="form-label form-label-required">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Give your post a clear, descriptive title"
              required
              className="form-input"
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label className="form-label form-label-required">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide details about your post..."
              required
              rows="4"
              className="form-textarea"
              maxLength={1000}
            />
            <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '5px', marginBottom: 0, textAlign: 'right' }}>
              {formData.description.length}/1000
            </p>
          </div>

          {/* Type-Specific Fields */}
          {renderTypeSpecificFields()}

          <div className="form-section-divider" />

          {/* Contact Information */}
          <div className="form-group">
            <label className="form-label">Contact Phone (Optional)</label>
            <input
              type="tel"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              placeholder="+254 700 000 000"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contact Email (Optional)</label>
            <input
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              placeholder="you@example.com"
              className="form-input"
            />
          </div>

          {/* Error Message */}
          {error && <div className="form-error">{error}</div>}

          {/* Action Buttons */}
          <div className="form-button-group">
            <button 
              type="button" 
              onClick={onClose}
              className="form-button-cancel"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="form-button-submit"
            >
              {loading ? 'Creating...' : '✓ Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;