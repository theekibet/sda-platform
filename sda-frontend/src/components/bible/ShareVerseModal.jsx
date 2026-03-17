// src/components/bible/ShareVerseModal.jsx
import React, { useState } from 'react';
import { useBible } from '../../hooks/useBible';
import { useAuth } from '../../contexts/AuthContext';

const ShareVerseModal = ({ verse, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { shareVerse, loading } = useBible();
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [queuePosition, setQueuePosition] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('You must be logged in to share a verse');
      return;
    }

    const result = await shareVerse(verse.id, comment);
    
    if (result.success) {
      setQueuePosition(result.data?.queuePosition);
      setSubmitted(true);
      // Don't auto-close - let user see success message and click Done
    } else {
      setError(result.error || 'Failed to share verse');
    }
  };

  const handleDone = () => {
    if (onSuccess) {
      onSuccess({ queuePosition });
    }
    onClose();
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button style={styles.closeButton} onClick={onClose}>✕</button>
        
        <h2 style={styles.title}>📖 Share This Verse</h2>
        
        {!submitted ? (
          <>
            <div style={styles.versePreview}>
              <strong style={styles.verseRef}>{verse.reference}</strong>
              <p style={styles.verseText}>"{verse.text}"</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Your Reflection (Optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Why does this verse speak to you? How has it impacted your life?"
                  style={styles.textarea}
                  rows="4"
                />
              </div>

              {error && <div style={styles.error}>{error}</div>}

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
                  style={{
                    ...styles.submitButton,
                    ...(loading ? styles.buttonDisabled : {}),
                  }}
                >
                  {loading ? 'Adding...' : 'Add to Queue'}
                </button>
              </div>
            </form>

            <p style={styles.note}>
              Your verse will be reviewed by admins before being scheduled.
              When approved, it will appear as Verse of the Day!
            </p>
          </>
        ) : (
          <div style={styles.successContainer}>
            <div style={styles.successIcon}>✅</div>
            <h3 style={styles.successTitle}>Verse Added to Queue!</h3>
            <p style={styles.successMessage}>
              Your verse is now in position <strong>#{queuePosition}</strong> in the queue.
            </p>
            <p style={styles.successNote}>
              You'll be notified when it's approved and scheduled.
            </p>
            <button onClick={handleDone} style={styles.doneButton}>
              Done
            </button>
          </div>
        )}
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '20px',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    position: 'relative',
    padding: '30px',
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
  },
  title: {
    margin: '0 0 20px 0',
    color: '#333',
    fontSize: '22px',
  },
  versePreview: {
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  verseRef: {
    fontSize: '16px',
    color: '#667eea',
    marginBottom: '10px',
    display: 'block',
  },
  verseText: {
    margin: '10px 0 0 0',
    color: '#666',
    fontStyle: 'italic',
    lineHeight: '1.6',
    fontSize: '15px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    color: '#333',
    fontWeight: '500',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  error: {
    padding: '10px',
    backgroundColor: '#fee',
    color: '#c33',
    borderRadius: '5px',
    marginBottom: '15px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#f0f0f0',
    color: '#666',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  note: {
    margin: '15px 0 0 0',
    fontSize: '12px',
    color: '#999',
    textAlign: 'center',
  },
  successContainer: {
    textAlign: 'center',
    padding: '20px 0',
  },
  successIcon: {
    fontSize: '48px',
    marginBottom: '20px',
  },
  successTitle: {
    color: '#27ae60',
    fontSize: '20px',
    marginBottom: '10px',
  },
  successMessage: {
    color: '#666',
    fontSize: '16px',
    marginBottom: '10px',
  },
  successNote: {
    color: '#999',
    fontSize: '14px',
    marginBottom: '20px',
  },
  doneButton: {
    padding: '10px 30px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
  },
};

export default ShareVerseModal;