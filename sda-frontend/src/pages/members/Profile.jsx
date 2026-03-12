// src/pages/members/Profile.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getProfile, updateProfile, changePassword } from '../../services/api';
import { useProfilePicture } from '../../hooks/useProfilePicture';
import Avatar from '../../components/common/Avatar';

function Profile() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
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

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchProfile();
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
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size cannot exceed 5MB');
        return;
      }

      // Preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload
      handleUpload(file);
    }
  };

  const handleUpload = async (file) => {
    const result = await upload(file);
    if (result.success) {
      // Update user in context
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

  if (loading) {
    return <div style={styles.loading}>Loading profile...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>My Profile</h2>
        {!isEditing && !changingPassword && (
          <div>
            <button 
              onClick={() => setIsEditing(true)} 
              style={styles.editButton}
            >
              Edit Profile
            </button>
            <button 
              onClick={() => setChangingPassword(true)} 
              style={styles.passwordButton}
            >
              Change Password
            </button>
          </div>
        )}
      </div>

      {/* Profile Picture Section */}
      <div style={styles.pictureSection}>
        <Avatar user={{ ...user, avatarUrl: previewUrl || user?.avatarUrl }} size="xlarge" />
        
        <div style={styles.pictureActions}>
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
            style={{
              ...styles.uploadButton,
              ...(uploading ? styles.disabledButton : {}),
            }}
          >
            {uploading ? 'Uploading...' : user?.avatarUrl ? 'Change Picture' : 'Add Picture'}
          </label>
          
          {user?.avatarUrl && (
            <button 
              onClick={handleRemove} 
              style={styles.removeButton}
              disabled={uploading}
            >
              Remove
            </button>
          )}
        </div>
        
        {uploadError && <p style={styles.error}>{uploadError}</p>}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              placeholder="Tell us a bit about yourself..."
              style={styles.textarea}
              rows="3"
            />
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Age</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: e.target.value})}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                style={styles.input}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div style={styles.buttonGroup}>
            <button type="submit" disabled={saving} style={styles.saveButton}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button 
              type="button" 
              onClick={() => setIsEditing(false)} 
              style={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : changingPassword ? (
        <form onSubmit={handlePasswordChange} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Current Password</label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>New Password</label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Confirm New Password</label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.buttonGroup}>
            <button type="submit" disabled={saving} style={styles.saveButton}>
              {saving ? 'Changing...' : 'Change Password'}
            </button>
            <button 
              type="button" 
              onClick={() => setChangingPassword(false)} 
              style={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div style={styles.profileInfo}>
          <div style={styles.infoRow}>
            <strong>Name:</strong> {profile?.name}
          </div>
          <div style={styles.infoRow}>
            <strong>Email:</strong> {profile?.email}
          </div>
          {profile?.phone && (
            <div style={styles.infoRow}>
              <strong>Phone:</strong> {profile.phone}
            </div>
          )}
          {profile?.bio && (
            <div style={styles.infoRow}>
              <strong>Bio:</strong> {profile.bio}
            </div>
          )}
          {profile?.age && (
            <div style={styles.infoRow}>
              <strong>Age:</strong> {profile.age}
            </div>
          )}
          {profile?.gender && (
            <div style={styles.infoRow}>
              <strong>Gender:</strong> {profile.gender}
            </div>
          )}
          <div style={styles.infoRow}>
            <strong>Location:</strong> {profile?.city || 'Not set'}
          </div>
          <div style={styles.infoRow}>
            <strong>Member Since:</strong> {new Date(profile?.createdAt).toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '30px',
    marginBottom: '30px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    margin: 0,
    color: '#333',
  },
  editButton: {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '5px',
    cursor: 'pointer',
    marginRight: '10px',
  },
  passwordButton: {
    backgroundColor: '#17a2b8',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  pictureSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    flexWrap: 'wrap',
  },
  pictureActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  uploadButton: {
    padding: '8px 16px',
    backgroundColor: '#667eea',
    color: 'white',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    border: 'none',
    display: 'inline-block',
  },
  removeButton: {
    padding: '8px 16px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  disabledButton: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  error: {
    color: '#e74c3c',
    fontSize: '14px',
    marginLeft: '10px',
  },
  profileInfo: {
    lineHeight: '1.8',
  },
  infoRow: {
    padding: '10px 0',
    borderBottom: '1px solid #eee',
  },
  form: {
    maxWidth: '600px',
  },
  formGroup: {
    marginBottom: '15px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#555',
  },
  input: {
    width: '100%',
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    fontSize: '16px',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    fontSize: '16px',
    fontFamily: 'inherit',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px',
  },
  saveButton: {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
  },
};

export default Profile;