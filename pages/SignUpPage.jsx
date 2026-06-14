import React, { useState } from 'react';
import { API_BASE_URL } from '../lib/auth';
import Logo from '../components/Logo';

const SignUpPage = ({ onLoginClick, onBackClick }) => {
  // This state controls whether password text is visible.
  const [showPassword, setShowPassword] = useState(false);
  // This state stores all signup form values.
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    role: 'customer',
    email: '',
    password: '',
  });
  // This state stores whether terms checkbox is checked.
  const [isChecked, setIsChecked] = useState(false);
  // This state stores any signup error message.
  const [error, setError] = useState('');
  const signupUrl = `${API_BASE_URL}/api/auth/signup`;

  // This function updates form fields when user types.
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // This function handles signup form submit.
  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!isChecked) return;
    if (!formData.role) {
      setError('Please select an account type');
      return;
    }

    try {
      const response = await fetch(signupUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      });

      if (response.ok) {
        // This shows success and sends user to login page without a hard reload.
        alert('Registration successful! Please check your email to verify your account.');
        onLoginClick();
      } else {
        const data = await response.json();
        setError(data.msg || 'Sign up failed');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('Unable to connect to server');
    }
  };

  const isFormValid = formData.firstName && formData.lastName && formData.role && formData.email && formData.password && isChecked;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-8" style={styles.container}>
      
      {/* Blue Header Area */}
      <div style={styles.header} className="w-full mb-8"></div>

      {/* Top Left Logo - Smaller Version */}
      <div className="absolute top-6 left-6 flex flex-col items-center mb-2">
        <Logo  />
      </div>

      {/* Main Content */}
      <div style={styles.formContainer} className="w-full max-w-md">
        
        {/* Header */}
        <h2 style={styles.title} className="text-center mb-2">Create Account</h2>
        <p style={styles.subtitle} className="text-center mb-8">Join Taste Scope today</p>

        {/* Sign Up Form */}
        <form onSubmit={handleSignUp} className="space-y-4">
          
          {/* First Name */}
          <div>
            <label style={styles.label}>First name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="Enter your first name"
              style={styles.input}
              className="w-full mt-2"
              required
            />
          </div>

          {/* Last Name */}
          <div>
            <label style={styles.label}>Last name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Enter your last name"
              style={styles.input}
              className="w-full mt-2"
              required
            />
          </div>

          {/* Role */}
          <div>
            <label style={styles.label}>I am a:</label>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                style={{
                  ...styles.roleOption,
                  borderColor: formData.role === 'customer' ? '#0d6b7a' : '#e2e8f0',
                  backgroundColor: formData.role === 'customer' ? '#eef9fc' : '#ffffff',
                }}
              >
                <input
                  type="radio"
                  name="role"
                  value="customer"
                  checked={formData.role === 'customer'}
                  onChange={handleInputChange}
                  style={styles.roleRadio}
                  required
                />
                <div>
                  <p style={styles.roleTitle}>Customer</p>
                  <p style={styles.roleHint}>Search and analyze restaurants</p>
                </div>
              </label>

              <label
                style={{
                  ...styles.roleOption,
                  borderColor: formData.role === 'owner' ? '#0d6b7a' : '#e2e8f0',
                  backgroundColor: formData.role === 'owner' ? '#eef9fc' : '#ffffff',
                }}
              >
                <input
                  type="radio"
                  name="role"
                  value="owner"
                  checked={formData.role === 'owner'}
                  onChange={handleInputChange}
                  style={styles.roleRadio}
                  required
                />
                <div>
                  <p style={styles.roleTitle}>Business Owner</p>
                  <p style={styles.roleHint}>Request access (approval required)</p>
                </div>
              </label>
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              style={styles.input}
              className="w-full mt-2"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label style={styles.label}>Password</label>
            <div style={styles.passwordContainer} className="relative mt-2">
              {/* paddingRight: 44px makes room for the eye button on the right */}
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a password"
                style={{ ...styles.input, paddingRight: '44px' }}
                className="w-full"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((previousValue) => !previousValue)}
                style={styles.eyeButton}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                  <circle cx="12" cy="12" r="3" />
                  {!showPassword && <line x1="3" y1="3" x2="21" y2="21" />}
                </svg>
              </button>
            </div>
          </div>

          {/* Terms Checkbox */}
          <div style={styles.checkboxContainer} className="flex items-start gap-3 py-4">
            <input
              type="checkbox"
              id="terms"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              style={styles.checkbox}
              className="mt-1"
            />
            <label htmlFor="terms" style={{color: '#4a5568', fontSize: '13px', cursor: 'pointer', margin: 0, lineHeight: '1.5'}}>
              By creating an account, I agree to our{' '}
              <a href="#" style={{color: '#0d6b7a', textDecoration: 'underline', cursor: 'pointer'}}>Terms of use</a>
              {' '}and{' '}
              <a href="#" style={{color: '#0d6b7a', textDecoration: 'underline', cursor: 'pointer'}}>Privacy Policy</a>.
            </label>
          </div>

          {/* Create Account Button */}
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <button
            type="submit"
            style={{
              ...styles.createButton,
              backgroundColor: isFormValid ? '#0d6b7a' : '#cccccc',
              cursor: isFormValid ? 'pointer' : 'not-allowed',
              opacity: isFormValid ? 1 : 0.7,
            }}
            className="w-full mt-6 transition-all"
            disabled={!isFormValid}
            onMouseEnter={(e) => {
              if (isFormValid) {
                e.target.style.backgroundColor = '#095062';
              }
            }}
            onMouseLeave={(e) => {
              if (isFormValid) {
                e.target.style.backgroundColor = '#0d6b7a';
              }
            }}
          >
            Create an account
          </button>
        </form>

        {/* Divider with OR */}
        <div style={styles.dividerContainer} className="my-6 flex items-center gap-4">
          <div style={styles.dividerLine}></div>
          <span style={{color: '#718096', fontSize: '13px', fontWeight: '500'}}>OR</span>
          <div style={styles.dividerLine}></div>
        </div>

        {/* Social Sign Up Buttons */}
        <button 
          style={styles.socialButton}
          className="w-full flex items-center justify-center gap-3 hover:bg-blue-50 transition"
          onClick={() => window.location.href = `${API_BASE_URL}/api/auth/facebook`}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f4f8'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}
        >
          {/* Facebook Icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          <span style={{color: '#1877F2', fontSize: '14px', fontWeight: '500'}}> Continue with Facebook</span>
        </button>
        <button 
          style={styles.socialButton}
          className="w-full flex items-center justify-center gap-3 hover:bg-red-50 transition"
          onClick={() => window.location.href = `${API_BASE_URL}/api/auth/google`}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#fef3f2'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}
        >
          {/* Google Icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span style={{color: '#1f2937', fontSize: '14px', fontWeight: '500'}}> Continue with Google</span>
        </button>
        <button 
          style={styles.socialButton}
          className="w-full flex items-center justify-center gap-3 hover:bg-gray-50 transition"
          onClick={() => window.location.href = `${API_BASE_URL}/api/auth/apple`}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}
        >
          {/* Apple Icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#000000">
            <path d="M17.05 13.5c-.91 2.92.37 5.65 2.85 6.75-1.73 2.74-4.42 3.64-8.56 1.37C5.5 24 0 20 0 14 0 9 3 5 7 5c1.9 0 3.7.7 5 2 1.3-1.3 3.1-2 5-2 2.8 0 5 2.2 5 5 0 1.4-.4 2.7-1.2 3.7-.8.8-1.8 1.2-2.8 1.2 0 0 1.15-1.8 1.25-3.4z"/>
          </svg>
          <span style={{color: '#000000', fontSize: '14px', fontWeight: '500'}}> Continue with Apple</span>
        </button>

        {/* Login Link */}
        <div className="text-center mt-8">
          <p style={{color: '#718096', fontSize: '14px', marginBottom: '8px'}}>
            Already have an account?{' '}
            <button
              onClick={onLoginClick}
              style={{
                background: 'none',
                border: 'none',
                color: '#0d6b7a',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: '600',
                textDecoration: 'underline',
                fontFamily: "'Poppins', sans-serif"
              }}
            >
              Log in
            </button>
          </p>
        </div>

        {/* Back Link */}
        <div className="text-center mt-4">
          <button
            onClick={onBackClick}
            style={{
              background: 'none',
              border: 'none',
              color: '#718096',
              fontSize: '13px',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontFamily: "'Poppins', sans-serif"
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    background: 'linear-gradient(180deg, #b9e5f3 0%, #ffffff 100%)',
    fontFamily: "'Poppins', sans-serif",
    position: 'relative',
  },

  header: {
    background: 'linear-gradient(180deg, #87ceeb 0%, #b9e5f3 100%)',
    height: '80px',
    borderRadius: '0 0 20px 20px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },

  formContainer: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '16px',
    padding: '32px 28px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
    backdropFilter: 'blur(10px)',
     marginTop: '50px',
     width: '100%',
    minWidth: '650px',
  },

  title: {
    color: '#0d6b7a',
    fontSize: '24px',
    fontWeight: '700',
    margin: 0,
  },

  subtitle: {
    color: '#718096',
    fontSize: '13px',
    margin: 0,
  },

  label: {
    display: 'block',
    color: '#2d3748',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '6px',
  },

  roleOption: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    padding: '12px 14px',
    borderRadius: '12px',
    border: '2px solid #e2e8f0',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'all 0.2s ease',
    fontFamily: "'Poppins', sans-serif",
  },

  roleRadio: {
    marginTop: '3px',
    accentColor: '#0d6b7a',
  },

  roleTitle: {
    margin: 0,
    color: '#2d3748',
    fontSize: '14px',
    fontWeight: '700',
    lineHeight: 1.2,
  },

  roleHint: {
    margin: '4px 0 0 0',
    color: '#718096',
    fontSize: '12px',
    lineHeight: 1.3,
  },

  input: {
    width: '100%',
    padding: '10px 14px',
    fontSize: '14px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontFamily: "'Poppins', sans-serif",
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
  },

  passwordContainer: {
    position: 'relative',
  },

  eyeButton: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0',
    color: '#718096',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  },

  checkboxContainer: {
    display: 'flex',
    alignItems: 'flex-start',
  },

  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    accentColor: '#0d6b7a',
    marginTop: '2px',
    flexShrink: 0,
  },

  createButton: {
    color: 'white',
    padding: '12px 24px',
    borderRadius: '9999px',
    fontSize: '15px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: "'Poppins', sans-serif",
  },

  dividerContainer: {
    display: 'flex',
    alignItems: 'center',
  },

  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#e2e8f0',
  },

  socialButton: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '14px 16px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#2d3748',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: "'Poppins', sans-serif",
  },
};

export default SignUpPage;

