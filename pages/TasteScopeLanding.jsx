import React from 'react';

const TasteScopeLanding = ({ onLoginClick, onSignUpClick }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-8" style={styles.container}>
      
      {/* Logo Section */}
      <div className="flex flex-col items-center mb-20">
        
        {/* Logo Graphics Container */}
        <div style={styles.logoContainer} className="mb-8">
          <div style={styles.verticalLine}></div>
          
          {/* Stacked Ovals */}
          <div className="flex flex-col items-center gap-3 relative z-10">
            <div style={{...styles.oval, ...styles.ovalSmall, animationDelay: '0.1s'}}></div>
            <div style={{...styles.oval, ...styles.ovalLarge, animationDelay: '0.2s'}}></div>
            <div style={{...styles.oval, ...styles.ovalMedium, animationDelay: '0.3s'}}></div>
            <div style={{...styles.oval, ...styles.ovalSmall, animationDelay: '0.4s'}}></div>
          </div>
        </div>
        
        {/* Brand Name */}
        <h1 style={styles.brandName}>Taste Scope</h1>
        
        {/* Subtitle */}
        <p style={styles.subtitle}>Discover flavors. Share experiences.</p>
      </div>

      {/* Buttons Section */}
      <div style={styles.buttonContainer} className="w-full max-w-sm space-y-3 mt-12">
        <button 
          onClick={onLoginClick}
          style={styles.button}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#095062'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#0d6b7a'}
          className="button-hover"
        >
          Login
        </button>
        
        <button 
          onClick={onSignUpClick}
          style={styles.button}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#095062'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#0d6b7a'}
          className="button-hover"
        >
          Sign Up
        </button>
      </div>

      {/* Footer Text */}
      <p style={styles.footerText}>© 2026 Taste Scope. All rights reserved.</p>
      
      <style>{keyframes}</style>
    </div>
  );
};

const styles = {
  container: {
    background: 'linear-gradient(180deg, #b9e5f3 0%, #ffffff 100%)',
    fontFamily: "'Poppins', sans-serif",
    margin: 0,
    padding: 0,
    minHeight: '100vh',
  },
  
  logoContainer: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '140px',
    marginBottom: '24px',
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
    height: '12px',
    backgroundColor: '#0d6b7a',
    borderRadius: '50%',
    animation: 'fadeInScale 0.6s ease-out forwards',
  },
  
  ovalSmall: {
    width: '48px',
  },
  
  ovalMedium: {
    width: '56px',
  },
  
  ovalLarge: {
    width: '64px',
  },
  
  brandName: {
    color: '#0d6b7a',
    fontSize: '48px',
    fontWeight: '700',
    letterSpacing: '-0.5px',
    textAlign: 'center',
    marginBottom: '8px',
    margin: 0,
    padding: 0,
  },
  
  subtitle: {
    color: '#4a5568',
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: '300',
    marginTop: '12px',
    margin: '12px 0 0 0',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  
  buttonContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  
  button: {
    width: '100%',
    backgroundColor: '#0d6b7a',
    color: 'white',
    padding: '14px 24px',
    borderRadius: '9999px',
    fontSize: '16px',
    fontWeight: '600',
    border: 'none',
    boxShadow: '0 4px 6px rgba(13, 107, 122, 0.1)',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: "'Poppins', sans-serif",
  },
  
  footerText: {
    color: '#718096',
    fontSize: '12px',
    textAlign: 'center',
    marginTop: '64px',
    margin: '64px 0 0 0',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
  },
};

const keyframes = `
  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .button-hover {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .button-hover:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(13, 107, 122, 0.3) !important;
  }
  
  .button-hover:active {
    transform: translateY(0);
  }
`;

export default TasteScopeLanding;
