import React, { useState } from 'react';

const SignUpPage = ({ onLoginClick, onBackClick }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [isChecked, setIsChecked] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSignUp = (e) => {
    e.preventDefault();
    if (isChecked) {
      console.log('Sign up with:', formData);
    }
  };

  const isFormValid = formData.firstName && formData.lastName && formData.email && formData.password && isChecked;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-8" style={styles.container}>
      
      {/* Logo at Top */}
      <div style={styles.topLogo} className="w-full flex justify-center items-center mb-6">
        <div className="flex flex-col items-center">
          <div style={styles.logoContainer}>
            <div style={styles.verticalLine}></div>
            <div className="flex flex-col items-center gap-2">
              <div style={{...styles.oval, width: '40px'}}></div>
              <div style={{...styles.oval, width: '52px'}}></div>
              <div style={{...styles.oval, width: '46px'}}></div>
              <div style={{...styles.oval, width: '40px'}}></div>
            </div>
          </div>
          <h1 style={styles.logoTitle}>Taste Scope</h1>
        </div>
      </div>

      {/* Blue Header Area */}
      <div style={styles.header} className="w-full mb-8"></div>

      {/* Top Left Logo - Smaller Version */}
      <div className="absolute top-6 left-6 flex flex-col items-center">
        <div style={styles.smallLogoContainer} className="mb-2">
          <div style={styles.smallVerticalLine}></div>
          <div className="flex flex-col items-center gap-1">
            <div style={{...styles.smallOval, width: '28px'}}></div>
            <div style={{...styles.smallOval, width: '36px'}}></div>
            <div style={{...styles.smallOval, width: '32px'}}></div>
          </div>
        </div>
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
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Create a password"
              style={styles.input}
              className="w-full mt-2"
              required
            />
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

        {/* Google Sign Up Button */}
        <button 
          style={styles.socialButton}
          className="w-full flex items-center justify-center gap-3 hover:bg-red-50 transition"
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
    height: '60px',
    borderRadius: '0 0 20px 20px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },

  topLogo: {
    paddingTop: '20px',
  },

  logoTitle: {
    color: '#0d6b7a',
    fontSize: '32px',
    fontWeight: '700',
    letterSpacing: '-0.5px',
    textAlign: 'center',
    margin: '16px 0 0 0',
    padding: 0,
  },

  logoContainer: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '120px',
  },

  verticalLine: {
    position: 'absolute',
    width: '2px',
    height: '100%',
    backgroundColor: '#0d6b7a',
    left: '50%',
    transform: 'translateX(-50%)',
  },

  oval: {
    height: '10px',
    backgroundColor: '#0d6b7a',
    borderRadius: '50%',
  },

  smallLogoContainer: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60px',
  },

  smallVerticalLine: {
    position: 'absolute',
    width: '1px',
    height: '100%',
    backgroundColor: '#0d6b7a',
    left: '50%',
    transform: 'translateX(-50%)',
  },

  smallOval: {
    height: '8px',
    backgroundColor: '#0d6b7a',
    borderRadius: '50%',
  },

  formContainer: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '16px',
    padding: '32px 28px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
    backdropFilter: 'blur(10px)',
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
