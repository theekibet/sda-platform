// src/pages/members/groups/CreateGroup.jsx
import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { createGroup } from '../../../services/api';
import { GROUP_CATEGORIES } from '../../../utils/groupCategories';
import { useNavigate } from 'react-router-dom';
import './Group.css';

function CreateGroup({ onClose, onGroupCreated }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'BIBLE_STUDY',
    location: '',
    isPrivate: false,
    requireApproval: true,
    rules: '',
    // NEW FIELDS
    isLocationBased: false,
    meetingType: 'online',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await createGroup(formData);
      console.log('✅ Group created:', response.data);
      
      // Extract the group ID from the response
      let groupId = null;
      if (response.data?.id) {
        groupId = response.data.id;
      } else if (response.data?.data?.id) {
        groupId = response.data.data.id;
      }
      
      if (groupId) {
        console.log('Navigating to group:', groupId);
        
        // Call onGroupCreated if provided
        if (onGroupCreated) {
          onGroupCreated(response.data.data || response.data);
        }
        
        // Close the modal first
        onClose();
        
        // Use setTimeout to ensure modal is closed before navigation
        setTimeout(() => {
          // Navigate to the new group
          navigate(`/groups/${groupId}`, { replace: true });
        }, 100);
      } else {
        console.error('No group ID in response:', response.data);
        setError('Failed to get group ID from response');
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Error creating group:', error);
      setError(error.response?.data?.message || 'Failed to create group');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  return (
    <div className="groups-container" style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Create a New Group</h2>
          <button onClick={onClose} style={styles.closeButton}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.formGroup}>
            <label style={styles.label}>Group Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Young Professionals Prayer Circle"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="What is this group about? Who is it for?"
              style={styles.textarea}
              rows="4"
            />
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                style={styles.select}
              >
                {GROUP_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* NEW: Meeting Type Field */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Meeting Type *</label>
              <select
                name="meetingType"
                value={formData.meetingType}
                onChange={handleChange}
                required
                style={styles.select}
              >
                <option value="online">💻 Online</option>
                <option value="in-person">🤝 In-Person</option>
                <option value="hybrid">🔄 Hybrid (Both)</option>
              </select>
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Location (Optional)
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder={
                formData.meetingType === 'online' 
                  ? 'e.g., "Online" or leave blank' 
                  : 'e.g., "Nairobi CBD" or "Kenya"'
              }
              style={styles.input}
            />
            <p style={styles.helpText}>
              {formData.meetingType === 'online' 
                ? 'For online groups, you can leave this blank or type "Online"'
                : 'Where does this group primarily meet? (City, Region, or Country)'}
            </p>
          </div>

          {/* NEW: Location-Based Checkbox (only show for in-person/hybrid) */}
          {(formData.meetingType === 'in-person' || formData.meetingType === 'hybrid') && (
            <div style={styles.checkboxGroup}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="isLocationBased"
                  checked={formData.isLocationBased}
                  onChange={handleChange}
                />
                <span style={styles.checkboxText}>
                  <strong>This group serves a specific geographic area</strong>
                  <br />
                  <small style={{ color: '#999' }}>
                    Check this only if your group is truly location-specific (e.g., "Nairobi CBD Young Professionals"). 
                    Don't check for interest-based groups that happen to meet in person.
                  </small>
                </span>
              </label>
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>Group Rules (Optional)</label>
            <textarea
              name="rules"
              value={formData.rules}
              onChange={handleChange}
              placeholder="Any rules members should follow?"
              style={styles.textarea}
              rows="3"
            />
          </div>

          <div style={styles.checkboxGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="isPrivate"
                checked={formData.isPrivate}
                onChange={handleChange}
              />
              <span style={styles.checkboxText}>
                <strong>Private Group</strong> - Only members can see posts and members
              </span>
            </label>
          </div>

          <div style={styles.checkboxGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="requireApproval"
                checked={formData.requireApproval}
                onChange={handleChange}
              />
              <span style={styles.checkboxText}>
                <strong>Require Approval</strong> - New members need admin approval to join
              </span>
            </label>
          </div>

          <div style={styles.buttonGroup}>
            <button
              type="button"
              onClick={onClose}
              style={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={styles.submitButton}
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Updated styles
const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '30px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto',
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
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#999',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '10px',
    borderRadius: '5px',
    fontSize: '14px',
  },
  formGroup: {
    flex: 1,
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    color: '#555',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    fontSize: '14px',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    fontSize: '14px',
    fontFamily: 'inherit',
  },
  select: {
    width: '100%',
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    fontSize: '14px',
    backgroundColor: 'white',
  },
  helpText: {
    fontSize: '12px',
    color: '#999',
    marginTop: '5px',
    marginBottom: 0,
  },
  checkboxGroup: {
    marginBottom: '10px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    cursor: 'pointer',
  },
  checkboxText: {
    fontSize: '14px',
    color: '#555',
    lineHeight: '1.4',
  },
  buttonGroup: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginTop: '20px',
  },
  cancelButton: {
    padding: '12px',
    backgroundColor: '#f0f0f0',
    color: '#666',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  submitButton: {
    padding: '12px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
  },
};

export default CreateGroup;