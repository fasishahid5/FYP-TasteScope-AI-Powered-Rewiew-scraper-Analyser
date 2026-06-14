import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../lib/auth';
import Logo from '../components/Logo';

const ResetPasswordPage = ({ onBackClick }) => {
  const navigate = useNavigate();
  // This state stores reset token from URL.
  const [token, setToken] = useState('');
  // These states store new password form values.
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // This state stores status messages.
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const resetPasswordUrl = `${API_BASE_URL}/api/auth/reset-password`;

  // This reads the token from query string once page loads.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (t) {
      setToken(t);
    }
  }, []);

  // This function validates and submits the new password.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await fetch(resetPasswordUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.msg);
        // Redirect to the login route without forcing a browser reload.
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      } else {
        setError(data.msg || 'Reset failed');
      }
    } catch (err) {
      console.error('reset password error', err);
      setError('Unable to connect to server');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-8" style={styles.container}>
      

      <div style={styles.header} className="w-full mb-8"></div>
      <div className="absolute top-6 left-6 flex flex-col items-center mb-2">
        <Logo  />
      </div>

      <div style={styles.formContainer} className="w-full max-w-md">
        <h2 style={styles.title} className="text-center mb-2">Reset Password</h2>
        <p style={styles.subtitle} className="text-center mb-8">Enter a new password below</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          {message && <p className="text-green-600 text-sm">{message}</p>}
          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div>
            <label style={styles.label}>New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              style={styles.input}
              className="w-full mt-2"
              required
            />
          </div>

          <div>
            <label style={styles.label}>Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              style={styles.input}
              className="w-full mt-2"
              required
            />
          </div>

          <button
            type="submit"
            style={styles.submitButton}
            className="w-full mt-6"
            onMouseEnter={(e) => e.target.style.backgroundColor = '#095062'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#0d6b7a'}
          >
            Change Password
          </button>
        </form>

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
            Back
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
     width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  formContainer: { background: 'rgba(255, 255, 255, 0.9)', padding: '48px 32px', borderRadius: '20px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)', backdropFilter: 'blur(8px)' },
  title: { color: '#1a202c', fontSize: '28px', fontWeight: '600', letterSpacing: '-0.5px', marginBottom: '8px' },
  subtitle: { color: '#718096', fontSize: '14px', fontWeight: '400' },
  label: { display: 'block', color: '#4a5568', fontSize: '14px', fontWeight: '600', marginBottom: '8px' },
  input: { width: '100%', padding: '12px 16px', fontSize: '14px', fontFamily: "'Poppins', sans-serif", border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: '#ffffff', color: '#1a202c', boxSizing: 'border-box', transition: 'all 0.2s ease', outline: 'none' },
  submitButton: { padding: '14px 24px', fontSize: '16px', fontWeight: '600', fontFamily: "'Poppins', sans-serif", color: '#ffffff', backgroundColor: '#0d6b7a', border: 'none', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: '0 4px 12px rgba(13, 107, 122, 0.3)' },
};

export default ResetPasswordPage;
