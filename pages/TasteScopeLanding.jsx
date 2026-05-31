import React from 'react';
import Logo from '../components/Logo';

const TasteScopeLanding = ({ onLoginClick, onSignUpClick }) => {
  // This helper updates button color on mouse hover.
  const handleButtonHover = (event, color) => {
    event.target.style.backgroundColor = color;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-8" style={styles.container}>
      
      {/* Logo Section */}
      <div className="flex flex-col items-center mb-20">
        <Logo animated={true} />
        {/* Subtitle */}
        <p style={styles.subtitle}>Discover flavors. Share experiences.</p>
      </div>

      {/* Buttons Section */}
      <div style={styles.buttonContainer} className="w-full max-w-sm space-y-3 mt-12">
        <button 
          onClick={onLoginClick}
          style={styles.button}
          onMouseEnter={(e) => handleButtonHover(e, '#095062')}
          onMouseLeave={(e) => handleButtonHover(e, '#0d6b7a')}
          className="button-hover"
        >
          Login
        </button>
        
        <button 
          onClick={onSignUpClick}
          style={styles.button}
          onMouseEnter={(e) => handleButtonHover(e, '#095062')}
          onMouseLeave={(e) => handleButtonHover(e, '#0d6b7a')}
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
  // This is the main page background style.
  container: {
    background: 'linear-gradient(180deg, #b9e5f3 0%, #ffffff 100%)',
    fontFamily: "'Poppins', sans-serif",
    margin: 0,
    padding: 0,
    minHeight: '100vh',
  },
  
  // This styles the subtitle below the logo.
  subtitle: {
    color: '#4a5568',
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: '300',
    marginTop: '12px',
    margin: '12px 0 0 0',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  
  // This keeps action buttons in a vertical stack.
  buttonContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  
  // This is the shared button style for login and signup.
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
  
  // This styles the bottom copyright text.
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
