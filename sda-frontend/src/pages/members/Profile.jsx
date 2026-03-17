import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getProfile, 
  updateProfile, 
  changePassword,
  updateLocation,
  getPrivacyOptions 
} from '../../services/api';
import { useProfilePicture } from '../../hooks/useProfilePicture';
import Avatar from '../../components/common/Avatar';
import { useNavigate } from 'react-router-dom';
import './members.css';

function Profile() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showLocationSettings, setShowLocationSettings] = useState(false);
  const [privacyOptions, setPrivacyOptions] = useState([]);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState({ type: '', text: '' });
  
  const { upload, remove, uploading, error: uploadError } = useProfilePicture();
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    age: '',
    gender: '',
  });

  const [locationData, setLocationData] = useState({
    locationName: '',
    locationPrivacy: 'city',
    latitude: null,
    longitude: null,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchProfile();
    fetchPrivacyOptions();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await getProfile();
      setProfile(response.data);
      setFormData({
        name: response.data.name || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        bio: response.data.bio || '',
        age: response.data.age || '',
        gender: response.data.gender || '',
      });
      setLocationData({
        locationName: response.data.locationName || '',
        
        latitude: response.data.latitude || null,
        longitude: response.data.longitude || null,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrivacyOptions = async () => {
    try {
      const response = await getPrivacyOptions();
      console.log('Privacy options response:', response.data); // Debug log
      
      // The backend returns { levels: [...], default: 'city' }
      if (response.data && Array.isArray(response.data.levels)) {
        setPrivacyOptions(response.data.levels);
      } else if (Array.isArray(response.data)) {
        // Fallback if backend returns array directly
        setPrivacyOptions(response.data);
      } else {
        // Fallback to hardcoded options if API fails
        console.warn('Privacy options not in expected format, using defaults');
        setPrivacyOptions([
          {
            value: 'exact',
            label: 'Show exact distance',
            description: 'Others can see how far away you are (e.g., "2.3km away")'
          },
          {
            value: 'city',
            label: 'Show city only',
            description: 'Others can see your city name (e.g., "Nairobi")'
          },
          {
            value: 'country',
            label: 'Show country only',
            description: 'Others can see your country (e.g., "Kenya")'
          },
          {
            value: 'none',
            label: 'Hide location',
            description: 'Your location is not visible to anyone'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching privacy options:', error);
      // Set fallback options
      setPrivacyOptions([
        {
          value: 'exact',
          label: 'Show exact distance',
          description: 'Others can see how far away you are'
        },
        {
          value: 'city',
          label: 'Show city only',
          description: 'Others can see your city name'
        },
        {
          value: 'country',
          label: 'Show country only',
          description: 'Others can see your country'
        },
        {
          value: 'none',
          label: 'Hide location',
          description: 'Your location is hidden'
        }
      ]);
    }
  };

  // ============ LOCATION DETECTION ============
  const detectMyLocation = async () => {
    setDetectingLocation(true);
    setLocationMessage({ type: '', text: '' });

    if (!navigator.geolocation) {
      setLocationMessage({ 
        type: 'error', 
        text: 'Geolocation is not supported by your browser' 
      });
      setDetectingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocoding to get location name
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
            {
              headers: {
                'User-Agent': 'YouthMinistryPlatform/1.0'
              }
            }
          );
          const data = await response.json();
          
          const address = data.address;
          const city = address.city || address.town || address.village || address.county || '';
          const country = address.country || 'Kenya';
          const locationName = city ? `${city}, ${country}` : country;
          
          // Update location data
          const newLocationData = {
            locationName,
            latitude,
            longitude,
            locationPrivacy: locationData.locationPrivacy || 'city',
          };
          
          setLocationData(newLocationData);
          
          // Auto-save to backend
          await updateLocation(newLocationData);
          
          // Update user context
          setUser({ ...user, ...newLocationData });
          
          setLocationMessage({ 
            type: 'success', 
            text: `📍 Location detected: ${locationName}` 
          });
          
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          setLocationMessage({ 
            type: 'error', 
            text: 'Could not determine your exact location. Please enter manually.' 
          });
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setDetectingLocation(false);
        
        let errorMessage = 'Could not detect your location. ';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please enable location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'Please enter your location manually.';
        }
        
        setLocationMessage({ type: 'error', text: errorMessage });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // ============ MANUAL LOCATION UPDATE ============
  const handleLocationUpdate = async () => {
    if (!locationData.locationName) {
      setLocationMessage({ type: 'error', text: 'Please enter a location name' });
      return;
    }

    setSaving(true);
    try {
      await updateLocation(locationData);
      setUser({ ...user, ...locationData });
      setLocationMessage({ type: 'success', text: '✓ Location updated successfully!' });
      setTimeout(() => setShowLocationSettings(false), 1500);
    } catch (error) {
      setLocationMessage({ type: 'error', text: 'Failed to update location' });
    } finally {
      setSaving(false);
    }
  };

  const handlePrivacyChange = async (privacyLevel) => {
    const updatedLocation = { ...locationData, locationPrivacy: privacyLevel };
    setLocationData(updatedLocation);
    
    // Only auto-save if location name exists
    if (locationData.locationName) {
      try {
        await updateLocation(updatedLocation);
        setUser({ ...user, ...updatedLocation });
        setLocationMessage({ type: 'success', text: 'Privacy setting updated!' });
      } catch (error) {
        console.error('Error updating privacy:', error);
        setLocationMessage({ type: 'error', text: 'Failed to update privacy setting' });
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('File size cannot exceed 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);

      handleUpload(file);
    }
  };

  const handleUpload = async (file) => {
    const result = await upload(file);
    if (result.success) {
      setUser({ ...user, avatarUrl: result.avatarUrl });
      setPreviewUrl(null);
      alert('Profile picture updated successfully!');
    }
  };

  const handleRemove = async () => {
    if (window.confirm('Remove profile picture?')) {
      const result = await remove();
      if (result.success) {
        setUser({ ...user, avatarUrl: null });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await updateProfile(formData);
      await fetchProfile();
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      alert('Error updating profile: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }

    setSaving(true);
    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      alert('Password changed successfully!');
    } catch (error) {
      alert('Error changing password: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const getLocationPreview = () => {
    if (!locationData.locationName) return null;
    
    switch(locationData.locationPrivacy) {
      case 'exact':
        return '📍 Exact location (distance will be shown to others)';
      case 'city':
        return `📍 ${locationData.locationName.split(',')[0].trim()}`;
      case 'country':
        return `📍 ${locationData.locationName.split(',').pop()?.trim() || locationData.locationName}`;
      case 'none':
        return '🔒 Hidden from everyone';
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="profile-loading">Loading your profile...</div>;
  }

  return (
    <div className="profile-container">
      {/* Header */}
      <div className="profile-header">
        <h2 className="profile-title">My Profile</h2>
        <div className="profile-actions">
          {!isEditing && !changingPassword && !showLocationSettings && (
            <>
              <button 
                onClick={() => setIsEditing(true)} 
                className="profile-btn profile-btn-edit"
              >
                Edit Profile
              </button>
              <button 
                onClick={() => setChangingPassword(true)} 
                className="profile-btn profile-btn-password"
              >
                Change Password
              </button>
              <button 
                onClick={() => setShowLocationSettings(true)} 
                className="profile-btn profile-btn-location"
              >
                📍 Update Location
              </button>
            </>
          )}
          {(isEditing || changingPassword || showLocationSettings) && (
            <button 
              onClick={() => {
                setIsEditing(false);
                setChangingPassword(false);
                setShowLocationSettings(false);
                setLocationMessage({ type: '', text: '' });
              }} 
              className="profile-btn profile-btn-back"
            >
              ← Back to Profile
            </button>
          )}
        </div>
      </div>

      {/* Profile Picture Section */}
      <div className="profile-picture-section">
        <Avatar user={{ ...user, avatarUrl: previewUrl || user?.avatarUrl }} size="xlarge" />
        
        <div className="profile-picture-actions">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="avatar-upload"
            disabled={uploading}
          />
          <label 
            htmlFor="avatar-upload" 
            className={`profile-upload-btn ${uploading ? 'profile-btn-disabled' : ''}`}
          >
            {uploading ? 'Uploading...' : user?.avatarUrl ? 'Change Picture' : 'Add Picture'}
          </label>
          
          {user?.avatarUrl && (
            <button 
              onClick={handleRemove} 
              className="profile-remove-btn"
              disabled={uploading}
            >
              Remove
            </button>
          )}
        </div>
        
        {uploadError && <p className="profile-upload-error">{uploadError}</p>}
      </div>

      {/* Location Settings Section */}
      {showLocationSettings && (
        <div className="location-settings-section">
          <h3 className="location-section-title">📍 Your Location</h3>
          <p className="location-section-description">
            Set your location to discover posts, events, and groups near you. Control who can see your location with privacy settings.
          </p>

          {/* Auto-detect button */}
          <button
            onClick={detectMyLocation}
            disabled={detectingLocation}
            className="location-detect-btn"
          >
            {detectingLocation ? '🔄 Detecting...' : '📍 Auto-Detect My Location'}
          </button>

          {/* Location message */}
          {locationMessage.text && (
            <div className={`location-message ${
              locationMessage.type === 'success' 
                ? 'location-message-success' 
                : 'location-message-error'
            }`}>
              {locationMessage.text}
            </div>
          )}

          {/* Manual entry */}
          <div className="profile-form-group">
            <label className="profile-form-label">Location Name</label>
            <input
              type="text"
              value={locationData.locationName}
              onChange={(e) => setLocationData({ ...locationData, locationName: e.target.value })}
              placeholder="e.g., Nairobi, Kenya"
              className="profile-form-input"
            />
          </div>

          {/* Privacy Level Selection */}
          <div className="profile-form-group">
            <label className="profile-form-label">Who Can See Your Location?</label>
            <select
              value={locationData.locationPrivacy}
              onChange={(e) => handlePrivacyChange(e.target.value)}
              className="privacy-select"
            >
              {privacyOptions.length > 0 ? (
                privacyOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label} — {option.description}
                  </option>
                ))
              ) : (
                <option value="city">Loading options...</option>
              )}
            </select>
          </div>

          {/* Preview of what others see */}
          {locationData.locationName && (
            <div className="location-preview-box">
              <strong>Others will see:</strong> {getLocationPreview()}
            </div>
          )}

          {/* Action buttons */}
          <div className="location-buttons">
            <button
              onClick={handleLocationUpdate}
              disabled={saving || !locationData.locationName}
              className="location-save-btn"
            >
              {saving ? 'Saving...' : '✓ Save Location'}
            </button>
          </div>
        </div>
      )}

      {/* Edit Profile Form */}
      {isEditing && !showLocationSettings && (
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="profile-form-group">
            <label className="profile-form-label">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              className="profile-form-input"
            />
          </div>

          <div className="profile-form-group">
            <label className="profile-form-label">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              className="profile-form-input"
            />
          </div>

          <div className="profile-form-group">
            <label className="profile-form-label">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="profile-form-input"
              placeholder="+254 700 000 000"
            />
          </div>

          <div className="profile-form-group">
            <label className="profile-form-label">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              placeholder="Tell us a bit about yourself..."
              className="profile-form-textarea"
              rows="3"
            />
          </div>

          <div className="profile-form-row">
            <div className="profile-form-group">
              <label className="profile-form-label">Age</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: e.target.value})}
                className="profile-form-input"
                min="13"
                max="120"
              />
            </div>

            <div className="profile-form-group">
              <label className="profile-form-label">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                className="profile-form-select"
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div className="profile-form-buttons">
            <button type="submit" disabled={saving} className="profile-form-save-btn">
              {saving ? 'Saving...' : '✓ Save Changes'}
            </button>
            <button 
              type="button" 
              onClick={() => setIsEditing(false)} 
              className="profile-form-cancel-btn"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Change Password Form */}
      {changingPassword && !showLocationSettings && (
        <form onSubmit={handlePasswordChange} className="profile-form">
          <div className="profile-form-group">
            <label className="profile-form-label">Current Password</label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
              required
              className="profile-form-input"
            />
          </div>

          <div className="profile-form-group">
            <label className="profile-form-label">New Password</label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
              required
              className="profile-form-input"
              minLength="8"
            />
            <small style={{ color: '#6b7280', fontSize: '0.85rem' }}>
              Minimum 8 characters
            </small>
          </div>

          <div className="profile-form-group">
            <label className="profile-form-label">Confirm New Password</label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
              required
              className="profile-form-input"
            />
          </div>

          <div className="profile-form-buttons">
            <button type="submit" disabled={saving} className="profile-form-save-btn">
              {saving ? 'Changing...' : '✓ Change Password'}
            </button>
            <button 
              type="button" 
              onClick={() => setChangingPassword(false)} 
              className="profile-form-cancel-btn"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Profile Info View */}
      {!isEditing && !changingPassword && !showLocationSettings && (
        <div className="profile-info-section">
          <div className="profile-info-row">
            <strong>Name:</strong> {profile?.name}
          </div>
          <div className="profile-info-row">
            <strong>Email:</strong> {profile?.email}
          </div>
          {profile?.phone && (
            <div className="profile-info-row">
              <strong>Phone:</strong> {profile.phone}
            </div>
          )}
          {profile?.bio && (
            <div className="profile-info-row">
              <strong>Bio:</strong> {profile.bio}
            </div>
          )}
          {profile?.age && (
            <div className="profile-info-row">
              <strong>Age:</strong> {profile.age}
            </div>
          )}
          {profile?.gender && (
            <div className="profile-info-row">
              <strong>Gender:</strong> {profile.gender}
            </div>
          )}
          <div className="profile-info-row">
            <strong>Location:</strong>{' '}
            {profile?.locationName ? (
              <>
                {profile.locationName}
                {profile.locationPrivacy && (
                  <span className="profile-privacy-badge">
                    {profile.locationPrivacy}
                  </span>
                )}
              </>
            ) : (
              <span className="profile-info-not-set">Not set</span>
            )}
          </div>
          <div className="profile-info-row">
            <strong>Member Since:</strong> {new Date(profile?.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;