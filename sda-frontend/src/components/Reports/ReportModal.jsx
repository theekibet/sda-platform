import React, { useState } from 'react';
import { useReports } from '../../hooks/useReports';
import { REPORT_CATEGORIES } from '../../utils/constants';

const ReportModal = ({ 
  contentType, 
  contentId, 
  authorId,
  onClose, 
  onSubmit 
}) => {
  const { submitReport, loading } = useReports();
  
  const [formData, setFormData] = useState({
    category: '',
    description: '',
  });
  
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.category) {
      setError('Please select a reason for reporting');
      return;
    }

    const result = await submitReport({
      contentType,
      contentId,
      category: formData.category,
      description: formData.description.trim() || undefined,
    });

    if (result.success) {
      setSubmitted(true);
      if (onSubmit) {
        onSubmit(result);
      }
    } else {
      setError(result.error);
    }
  };

  // Get content type label
  const getContentTypeLabel = () => {
    switch (contentType) {
      case 'forumPost': return 'post';
      case 'forumReply': return 'reply';
      case 'prayerRequest': return 'prayer request';
      case 'testimony': return 'testimony';
      case 'groupDiscussion': return 'discussion';
      case 'user': return 'user';
      default: return 'content';
    }
  };

  // Success view
  if (submitted) {
    return (
      <div style={styles.overlay} onClick={onClose}>
        <div style={styles.modal} onClick={e => e.stopPropagation()}>
          <button style={styles.closeButton} onClick={onClose}>✕</button>
          
          <div style={styles.successContent}>
            <div style={styles.successIcon}>✅</div>
            <h2 style={styles.successTitle}>Thank You for Reporting</h2>
            <p style={styles.successMessage}>
              Your report has been submitted successfully. Our moderation team will review it as soon as possible.
            </p>
            <button style={styles.doneButton} onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Report form
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button style={styles.closeButton} onClick={onClose}>✕</button>
        
        <div style={styles.header}>
          <h2 style={styles.title}>Report {getContentTypeLabel()}</h2>
          <p style={styles.subtitle}>
            Help us keep the community safe. Your report will be reviewed by our moderation team.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Reason for reporting <span style={styles.required}>*</span>
            </label>
            <div style={styles.optionsGrid}>
              {REPORT_CATEGORIES.map(cat => (
                <label
                  key={cat.value}
                  style={{
                    ...styles.option,
                    ...(formData.category === cat.value ? styles.optionSelected : {}),
                  }}
                >
                  <input
                    type="radio"
                    name="category"
                    value={cat.value}
                    checked={formData.category === cat.value}
                    onChange={handleChange}
                    style={styles.radio}
                  />
                  <span style={styles.optionIcon}>{cat.icon}</span>
                  <div style={styles.optionText}>
                    <strong>{cat.label}</strong>
                    <span style={styles.optionDescription}>{cat.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Additional details (optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Please provide any additional context that might help our review..."
              style={styles.textarea}
              rows="4"
            />
          </div>

          {error && (
            <div style={styles.error}>
              <span style={styles.errorIcon}>⚠️</span>
              {error}
            </div>
          )}

          <div style={styles.footer}>
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
              style={{
                ...styles.submitButton,
                ...(loading ? styles.submitButtonDisabled : {}),
              }}
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>

          <p style={styles.note}>
            Note: Your report will be anonymous. The content you're reporting will remain visible until reviewed.
          </p>
        </form>
      </div>
    </div>
  );
};

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
    zIndex: 9999,
    padding: '20px',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    position: 'relative',
    padding: '30px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  closeButton: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#999',
    padding: '5px',
    lineHeight: 1,
    '&:hover': {
      color: '#333',
    },
  },
  header: {
    marginBottom: '25px',
  },
  title: {
    margin: '0 0 10px 0',
    color: '#333',
    fontSize: '24px',
    fontWeight: '600',
  },
  subtitle: {
    margin: 0,
    color: '#666',
    fontSize: '14px',
    lineHeight: '1.5',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
  },
  required: {
    color: '#e74c3c',
  },
  optionsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  option: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px',
    borderRadius: '8px',
    border: '2px solid #e0e0e0',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  optionSelected: {
    borderColor: '#667eea',
    backgroundColor: '#f0f4ff',
  },
  radio: {
    marginTop: '2px',
    cursor: 'pointer',
  },
  optionIcon: {
    fontSize: '20px',
  },
  optionText: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  optionDescription: {
    fontSize: '12px',
    color: '#666',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '2px solid #e0e0e0',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
    '&:focus': {
      outline: 'none',
      borderColor: '#667eea',
    },
  },
  error: {
    padding: '12px',
    backgroundColor: '#fee',
    color: '#c33',
    borderRadius: '8px',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  errorIcon: {
    fontSize: '16px',
  },
  footer: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '10px',
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#f0f0f0',
    color: '#666',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background 0.2s',
    '&:hover': {
      backgroundColor: '#e0e0e0',
    },
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background 0.2s',
    '&:hover': {
      backgroundColor: '#c0392b',
    },
  },
  submitButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  note: {
    margin: '10px 0 0 0',
    fontSize: '12px',
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  successContent: {
    textAlign: 'center',
    padding: '20px 0',
  },
  successIcon: {
    fontSize: '48px',
    marginBottom: '20px',
  },
  successTitle: {
    margin: '0 0 10px 0',
    color: '#27ae60',
    fontSize: '24px',
    fontWeight: '600',
  },
  successMessage: {
    margin: '0 0 30px 0',
    color: '#666',
    fontSize: '16px',
    lineHeight: '1.6',
  },
  doneButton: {
    padding: '12px 30px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background 0.2s',
    '&:hover': {
      backgroundColor: '#219a52',
    },
  },
};

export default ReportModal;