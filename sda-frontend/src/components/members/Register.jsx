// src/pages/members/Register.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';  // ✅ Fixed: ../context -> ../../contexts

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',           // ✅ Now required
    dateOfBirth: '',     // ✅ Now required
    gender: '',          // ✅ Still optional
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();

  // Calculate min date (13 years ago) and max date (120 years ago)
  const today = new Date();
  const minDate = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate()).toISOString().split('T')[0];
  const maxDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate()).toISOString().split('T')[0];

  // Password strength checker
  const checkPasswordStrength = (password) => {
    const errors = [];
    let strength = 0;

    if (password.length < 8) {
      errors.push('At least 8 characters');
    } else {
      strength += 25;
    }

    if (/[A-Z]/.test(password)) {
      strength += 25;
    } else {
      errors.push('At least one uppercase letter');
    }

    if (/[a-z]/.test(password)) {
      strength += 25;
    } else {
      errors.push('At least one lowercase letter');
    }

    if (/[0-9]/.test(password)) {
      strength += 25;
    } else {
      errors.push('At least one number');
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      strength += 25;
    }

    setPasswordStrength(Math.min(strength, 100));
    setPasswordErrors(errors);
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setFormData({ ...formData, password: newPassword });
    checkPasswordStrength(newPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Frontend validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordStrength < 50) {
      setError('Password is too weak. Please follow the requirements.');
      return;
    }

    setLoading(true);
    setError('');
    
    // Remove confirmPassword (frontend only)
    const { confirmPassword, ...dataToSend } = formData;
    
    // ✅ Build submission data (phone and DOB are now always included)
    const submissionData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,                 // ✅ Always included (required)
      dateOfBirth: formData.dateOfBirth,     // ✅ Always included (required)
    };
    
    // ✅ Add gender only if it has a value (optional)
    if (formData.gender && formData.gender.trim() !== '') {
      submissionData.gender = formData.gender;
    }
    
    const result = await register(submissionData);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Registration failed');
    }
    
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Get strength color and text
  const getStrengthInfo = () => {
    if (passwordStrength < 25) return { color: '#e74c3c', text: 'Very Weak' };
    if (passwordStrength < 50) return { color: '#f39c12', text: 'Weak' };
    if (passwordStrength < 75) return { color: '#3498db', text: 'Good' };
    return { color: '#27ae60', text: 'Strong' };
  };

  const strengthInfo = getStrengthInfo();

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <button onClick={() => navigate('/')} style={styles.backButton}>
          ← Back to Home
        </button>

        <h2 style={styles.title}>Join the Community 🙏</h2>
        <p style={styles.subtitle}>Connect with youth who share your faith</p>
        
        {error && <div style={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                First Name <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="firstName"
                placeholder="Enter your first name"
                value={formData.firstName}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Last Name <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="lastName"
                placeholder="Enter your last name"
                value={formData.lastName}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Email <span style={styles.required}>*</span>
            </label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          {/* Phone - Now Required */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Phone Number <span style={styles.required}>*</span>
            </label>
            <input
              type="tel"
              name="phone"
              placeholder="e.g., 0712345678"
              value={formData.phone}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          {/* Date of Birth - Now Required */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Date of Birth <span style={styles.required}>*</span>
            </label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              required
              min={maxDate}
              max={minDate}
              style={styles.input}
            />
          </div>

          {/* Password Field with Eye Icon */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Password <span style={styles.required}>*</span>
            </label>
            <div style={styles.passwordContainer}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handlePasswordChange}
                required
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
            {formData.password && (
              <div style={styles.strengthContainer}>
                <div style={styles.strengthBarContainer}>
                  <div style={{
                    ...styles.strengthBar,
                    width: `${passwordStrength}%`,
                    backgroundColor: strengthInfo.color,
                  }} />
                </div>
                <span style={{ ...styles.strengthText, color: strengthInfo.color }}>
                  {strengthInfo.text}
                </span>
              </div>
            )}

            {/* Password Requirements */}
            {passwordErrors.length > 0 && (
              <div style={styles.requirements}>
                {passwordErrors.map((err, index) => (
                  <div key={index} style={styles.requirementItem}>
                    <span style={styles.requirementBullet}>•</span>
                    <span style={styles.requirementText}>{err}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password Field with Eye Icon */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Confirm Password <span style={styles.required}>*</span>
            </label>
            <div style={styles.passwordContainer}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                style={styles.passwordInput}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            
            {/* Match Indicator */}
            {formData.confirmPassword && (
              <div style={styles.matchIndicator}>
                {formData.password === formData.confirmPassword ? (
                  <span style={{ color: '#27ae60' }}>✅ Passwords match</span>
                ) : (
                  <span style={{ color: '#e74c3c' }}>❌ Passwords do not match</span>
                )}
              </div>
            )}
          </div>

          {/* Gender - Still Optional (no asterisk) */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Gender (optional)</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="">Select gender (optional)</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={styles.button}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p style={styles.switchText}>
          Already have an account?{' '}
          <button onClick={() => navigate('/login')} style={styles.switchButton}>
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
  },
  card: {
    maxWidth: '550px',
    width: '100%',
    padding: '40px',
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: '#667eea',
    fontSize: '14px',
    cursor: 'pointer',
    marginBottom: '20px',
    padding: '5px 0',
    fontWeight: '500',
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '10px',
    fontSize: '28px',
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: '30px',
  },
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center',
    fontSize: '14px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  formGroup: {
    marginBottom: '15px',
    flex: 1,
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginBottom: '5px',
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
  input: {
    width: '100%',
    padding: '12px',
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
  matchIndicator: {
    marginTop: '8px',
    fontSize: '13px',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '10px',
    fontWeight: '600',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#5a6fd8',
    },
  },
  switchText: {
    textAlign: 'center',
    marginTop: '20px',
    color: '#666',
  },
  switchButton: {
    background: 'none',
    border: 'none',
    color: '#667eea',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontSize: '16px',
    fontWeight: '500',
  },
};

export default Register;