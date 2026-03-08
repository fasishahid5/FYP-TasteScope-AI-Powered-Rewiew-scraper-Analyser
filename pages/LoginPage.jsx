import React, { useState } from 'react';

const LoginPage = ({ onSignUpClick, onForgotPasswordClick, onBackClick }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    console.log('Login with:', email, password, isChecked);
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
        
        {/* Social Login Buttons */}
        <div className="space-y-3 mb-8">
          <button 
            style={styles.socialButton}
            className="w-full flex items-center justify-center gap-3 hover:bg-blue-50 transition"
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
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}
          >
            {/* Apple Icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#000000">
              <path d="M17.05 13.5c-.91 2.92.37 5.65 2.85 6.75-1.73 2.74-4.42 3.64-8.56 1.37C5.5 24 0 20 0 14 0 9 3 5 7 5c1.9 0 3.7.7 5 2 1.3-1.3 3.1-2 5-2 2.8 0 5 2.2 5 5 0 1.4-.4 2.7-1.2 3.7-.8.8-1.8 1.2-2.8 1.2 0 0 1.15-1.8 1.25-3.4z"/>
            </svg>
            <span style={{color: '#000000', fontSize: '14px', fontWeight: '500'}}> Continue with Apple</span>
          </button>
        </div>

        {/* Divider with OR */}
        <div style={styles.dividerContainer} className="mb-8 flex items-center gap-4">
          <div style={styles.dividerLine}></div>
          <span style={{color: '#718096', fontSize: '14px', fontWeight: '500'}}>OR</span>
          <div style={styles.dividerLine}></div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          
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

          {/* Password Field */}
          <div>
            <label style={styles.label}>Your password</label>
            <div style={styles.passwordContainer} className="relative mt-2">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={styles.input}
                className="w-full pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            <div className="text-right mt-2">
              <a href="#" onClick={(e) => { e.preventDefault(); onForgotPasswordClick(); }} style={{color: '#0d6b7a', fontSize: '13px', textDecoration: 'none', fontWeight: '500', cursor: 'pointer'}}>
                Forgot your password?
              </a>
            </div>
          </div>

          {/* Checkbox */}
          <div style={styles.checkboxContainer} className="flex items-center gap-3 py-2">
            <input
              type="checkbox"
              id="keepSigned"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              style={styles.checkbox}
            />
            <label htmlFor="keepSigned" style={{color: '#4a5568', fontSize: '14px', cursor: 'pointer', margin: 0}}>
              Keep me signed in until I sign out
            </label>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            style={styles.loginButton}
            className="w-full mt-6"
            onMouseEnter={(e) => e.target.style.backgroundColor = '#095062'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#0d6b7a'}
          >
            Log In
          </button>
        </form>

        {/* Divider */}
        <div style={{borderTop: '1px solid #e2e8f0', margin: '24px 0'}}></div>

        {/* Sign Up Section */}
        <div className="text-center">
          <p style={{color: '#718096', fontSize: '14px', marginBottom: '12px'}}>
            Don't have an account?
          </p>
          <button
            onClick={onSignUpClick}
            style={styles.signUpButton}
            className="w-full"
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}
          >
            Sign up
          </button>
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
              textDecoration: 'underline'
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

  socialButton: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '9999px',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#2d3748',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
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

  passwordContainer: {
    position: 'relative',
  },

  eyeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '0',
    color: '#718096',
  },

  checkboxContainer: {
    display: 'flex',
    alignItems: 'center',
  },

  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    accentColor: '#0d6b7a',
  },

  loginButton: {
    background: '#0d6b7a',
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

  signUpButton: {
    background: '#ffffff',
    color: '#0d6b7a',
    padding: '12px 24px',
    borderRadius: '9999px',
    fontSize: '15px',
    fontWeight: '600',
    border: '2px solid #0d6b7a',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: "'Poppins', sans-serif",
  },
};

export default LoginPage;
