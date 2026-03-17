// src/components/auth/PasswordInput.jsx
import React, { useState } from 'react';

const PasswordInput = ({ 
  name, 
  value, 
  onChange, 
  placeholder, 
  label,
  required = false,
  showStrength = false,
  strength = 0,
  errors = [],
  showMatch = false,
  matchValue = '',
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const getStrengthInfo = () => {
    if (strength < 25) return { color: '#e74c3c', text: 'Very Weak' };
    if (strength < 50) return { color: '#f39c12', text: 'Weak' };
    if (strength < 75) return { color: '#3498db', text: 'Good' };
    return { color: '#27ae60', text: 'Strong' };
  };

  const strengthInfo = getStrengthInfo();

  return (
    <div style={styles.container}>
      <label style={styles.label}>
        {label} {required && <span style={styles.required}>*</span>}
      </label>
      <div style={styles.passwordContainer}>
        <input
          type={showPassword ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          style={styles.passwordInput}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          style={styles.eyeButton}
        >
          {showPassword ? '👁️' : '👁️‍🗨️'}
        </button>
      </div>

      {/* Password Strength Indicator */}
      {showStrength && value && (
        <div style={styles.strengthContainer}>
          <div style={styles.strengthBarContainer}>
            <div style={{
              ...styles.strengthBar,
              width: `${strength}%`,
              backgroundColor: strengthInfo.color,
            }} />
          </div>
          <span style={{ ...styles.strengthText, color: strengthInfo.color }}>
            {strengthInfo.text}
          </span>
        </div>
      )}

      {/* Password Match Indicator */}
      {showMatch && value && matchValue && (
        <div style={styles.matchIndicator}>
          {value === matchValue ? (
            <span style={{ color: '#27ae60' }}>✅ Passwords match</span>
          ) : (
            <span style={{ color: '#e74c3c' }}>❌ Passwords do not match</span>
          )}
        </div>
      )}

      {/* Error List */}
      {errors.length > 0 && (
        <div style={styles.requirements}>
          {errors.map((err, index) => (
            <div key={index} style={styles.requirementItem}>
              <span style={styles.requirementBullet}>•</span>
              <span style={styles.requirementText}>{err}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    color: '#555',
    fontSize: '14px',
    fontWeight: '500',
  },
  required: {
    color: '#e74c3c',
    fontSize: '16px',
    marginLeft: '2px',
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
  },
  passwordInput: {
    width: '100%',
    padding: '12px',
    paddingRight: '45px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '16px',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
    ':focus': {
      outline: 'none',
      borderColor: '#667eea',
    },
  },
  eyeButton: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '20px',
    padding: '5px',
    color: '#666',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  strengthContainer: {
    marginTop: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  strengthBarContainer: {
    flex: 1,
    height: '6px',
    backgroundColor: '#e0e0e0',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  strengthBar: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
  strengthText: {
    fontSize: '12px',
    fontWeight: '600',
    minWidth: '60px',
  },
  matchIndicator: {
    marginTop: '8px',
    fontSize: '13px',
    fontWeight: '500',
  },
  requirements: {
    marginTop: '8px',
    padding: '10px',
    backgroundColor: '#f9f9f9',
    borderRadius: '6px',
  },
  requirementItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#666',
    marginBottom: '4px',
  },
  requirementBullet: {
    color: '#e74c3c',
    fontSize: '14px',
  },
  requirementText: {
    color: '#666',
  },
};

export default PasswordInput;