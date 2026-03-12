import React, { useState } from 'react';
import { MODERATION_ACTIONS, CONTENT_TYPES } from '../../../utils/constants';

const ModerationActionModal = ({ item, onClose, onAction }) => {
  const [selectedAction, setSelectedAction] = useState('');
  const [reason, setReason] = useState('');
  const [suspensionDuration, setSuspensionDuration] = useState('7');
  const [warningMessage, setWarningMessage] = useState('');
  const [notifyUser, setNotifyUser] = useState(true);
  const [step, setStep] = useState(1); // 1: select action, 2: provide details

  const handleActionSelect = (action) => {
    setSelectedAction(action);
    setStep(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const actionData = {
      action: selectedAction,
      reason: reason || undefined,
      notifyUser,
    };

    // Add action-specific data
    if (selectedAction === 'suspend') {
      actionData.suspensionDuration = suspensionDuration;
    } else if (selectedAction === 'warn') {
      actionData.warningMessage = warningMessage;
    }

    onAction(selectedAction, actionData);
  };

  const handleBack = () => {
    setStep(1);
    setSelectedAction('');
  };

  const getContentTypeLabel = () => {
    switch (item.contentType) {
      case 'forumPost': return 'forum post';
      case 'forumReply': return 'forum reply';
      case 'prayerRequest': return 'prayer request';
      case 'testimony': return 'testimony';
      case 'groupDiscussion': return 'group discussion';
      case 'user': return 'user profile';
      default: return 'content';
    }
  };

  const getSelectedActionDetails = () => {
    return MODERATION_ACTIONS.find(a => a.value === selectedAction);
  };

  // Step 1: Select Action
  if (step === 1) {
    return (
      <div style={styles.overlay} onClick={onClose}>
        <div style={styles.modal} onClick={e => e.stopPropagation()}>
          <button style={styles.closeButton} onClick={onClose}>✕</button>
          
          <div style={styles.header}>
            <h2 style={styles.title}>Moderate {getContentTypeLabel()}</h2>
            <p style={styles.subtitle}>
              Select an action to take on this reported content.
            </p>
          </div>

          <div style={styles.contentPreview}>
            <strong>Content:</strong>
            <p>{item.contentSnippet || item.description || 'No preview available'}</p>
          </div>

          <div style={styles.actionsGrid}>
            {MODERATION_ACTIONS.map(action => (
              <button
                key={action.value}
                onClick={() => handleActionSelect(action.value)}
                style={{
                  ...styles.actionCard,
                  borderColor: action.color,
                  ...(selectedAction === action.value ? { ...styles.actionCardSelected, borderColor: action.color } : {}),
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 4px 12px ${action.color}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span style={{...styles.actionIcon, color: action.color}}>{action.icon}</span>
                <div style={styles.actionInfo}>
                  <strong style={styles.actionLabel}>{action.label}</strong>
                  <span style={styles.actionDescription}>
                    {getActionDescription(action.value)}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div style={styles.footer}>
            <button onClick={onClose} style={styles.cancelButton}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Provide Details
  const actionDetails = getSelectedActionDetails();
  
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button style={styles.closeButton} onClick={onClose}>✕</button>
        
        <div style={styles.header}>
          <button onClick={handleBack} style={styles.backButton}>←</button>
          <h2 style={styles.title}>{actionDetails?.label} Content</h2>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Reason for action */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Reason <span style={styles.required}>*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={`Why are you ${selectedAction}ing this content?`}
              required
              style={styles.textarea}
              rows="3"
            />
          </div>

          {/* Action-specific fields */}
          {selectedAction === 'suspend' && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Suspension Duration</label>
              <select
                value={suspensionDuration}
                onChange={(e) => setSuspensionDuration(e.target.value)}
                style={styles.select}
              >
                {SUSPENSION_DURATIONS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          )}

          {selectedAction === 'warn' && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Warning Message</label>
              <textarea
                value={warningMessage}
                onChange={(e) => setWarningMessage(e.target.value)}
                placeholder="Enter a custom warning message for the user..."
                style={styles.textarea}
                rows="3"
              />
            </div>
          )}

          {/* Notify user option */}
          <div style={styles.checkboxGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={notifyUser}
                onChange={(e) => setNotifyUser(e.target.checked)}
              />
              <span>Notify the user about this action</span>
            </label>
          </div>

          {/* Preview of content */}
          <div style={styles.previewBox}>
            <strong>Content being moderated:</strong>
            <p style={styles.previewText}>{item.contentSnippet}</p>
          </div>

          {/* Form buttons */}
          <div style={styles.footer}>
            <button type="button" onClick={handleBack} style={styles.backButton}>
              Back
            </button>
            <button type="submit" style={styles.submitButton}>
              Confirm {actionDetails?.label}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Helper function for action descriptions
const getActionDescription = (action) => {
  switch (action) {
    case 'approve':
      return 'Mark as approved - no further action needed';
    case 'remove':
      return 'Remove this content from the platform';
    case 'warn':
      return 'Send a warning to the user';
    case 'flag':
      return 'Flag for further review';
    case 'dismiss':
      return 'Dismiss this report (no action)';
    default:
      return '';
  }
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
    zIndex: 10000,
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
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  backButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#667eea',
    padding: '5px',
  },
  title: {
    margin: 0,
    color: '#333',
    fontSize: '22px',
    fontWeight: '600',
  },
  subtitle: {
    margin: '5px 0 0 0',
    color: '#666',
    fontSize: '14px',
  },
  contentPreview: {
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    color: '#333',
    lineHeight: '1.5',
  },
  actionsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '20px',
  },
  actionCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '15px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'left',
    width: '100%',
  },
  actionCardSelected: {
    backgroundColor: '#f8f9fa',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  actionIcon: {
    fontSize: '24px',
    width: '40px',
    textAlign: 'center',
  },
  actionInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  actionLabel: {
    fontSize: '16px',
    fontWeight: '600',
  },
  actionDescription: {
    fontSize: '13px',
    color: '#666',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
  },
  required: {
    color: '#e74c3c',
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
  select: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '2px solid #e0e0e0',
    fontSize: '14px',
    backgroundColor: 'white',
    '&:focus': {
      outline: 'none',
      borderColor: '#667eea',
    },
  },
  checkboxGroup: {
    marginBottom: '10px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#555',
  },
  previewBox: {
    padding: '15px',
    backgroundColor: '#f0f4ff',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#333',
    lineHeight: '1.5',
    border: '1px solid #d0e0ff',
  },
  previewText: {
    margin: '10px 0 0 0',
    color: '#666',
    fontStyle: 'italic',
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
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background 0.2s',
    '&:hover': {
      backgroundColor: '#5a6fd8',
    },
  },
};

export default ModerationActionModal;