import React, { useState } from 'react';

const ForgotPasswordPage = ({ onBackClick }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      console.log('Password reset requested for:', email);
      // Here you would typically make an API call to send reset email
    }
  };

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
        <h2 style={styles.title} className="text-center mb-2">Forgot Password?</h2>
        <p style={styles.subtitle} className="text-center mb-8">Not worry! Enter your email to reset your password</p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Email Field */}
          <div>
            <label style={styles.label}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              style={styles.input}
              className="w-full mt-2"
              required
            />
          </div>

          {/* Send Reset Link Button */}
          <button
            type="submit"
            style={styles.submitButton}
            className="w-full mt-6"
            onMouseEnter={(e) => e.target.style.backgroundColor = '#095062'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#0d6b7a'}
          >
            Send Reset Link
          </button>
        </form>

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
              textDecoration: 'underline'
            }}
          >
            Back to Login
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
    background: 'rgba(255, 255, 255, 0.9)',
    padding: '48px 32px',
    borderRadius: '20px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(8px)',
  },

  title: {
    color: '#1a202c',
    fontSize: '28px',
    fontWeight: '600',
    letterSpacing: '-0.5px',
    marginBottom: '8px',
  },

  subtitle: {
    color: '#718096',
    fontSize: '14px',
    fontWeight: '400',
  },

  label: {
    display: 'block',
    color: '#4a5568',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '8px',
  },

  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    fontFamily: "'Poppins', sans-serif",
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    color: '#1a202c',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
    outline: 'none',
  },

  submitButton: {
    padding: '14px 24px',
    fontSize: '16px',
    fontWeight: '600',
    fontFamily: "'Poppins', sans-serif",
    color: '#ffffff',
    backgroundColor: '#0d6b7a',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(13, 107, 122, 0.3)',
  },
};

export default ForgotPasswordPage;