import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../lib/auth';

const VerifyEmail = () => {
  // This reads verification token from URL.
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  // These states control status message and success style.
  const [message, setMessage] = useState('Verifying...');
  const [isSuccess, setIsSuccess] = useState(false);
  const hasRequestedRef = useRef(false);

  // This effect verifies email once when token is available.
  useEffect(() => {
    if (!token) {
      setMessage('Invalid verification link. Token is missing.');
      return;
    }
    if (hasRequestedRef.current) {
      return;
    }
    hasRequestedRef.current = true;

    let redirectTimer;

    const verify = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/auth/verify-email?token=${token}`
        );

        // This shows success and redirects user to login.
        setMessage(response.data.msg || 'Email verified successfully.');
        setIsSuccess(true);
        redirectTimer = setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error) {
        // This shows backend error if verification fails.
        setMessage(
          error.response?.data?.msg || 'Email verification failed. Please try again.'
        );
        setIsSuccess(false);
      }
    };

    verify();

    return () => {
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [navigate, token]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow p-8 text-center">
        <h1 className="text-2xl font-semibold mb-4">Email Verification</h1>
        <p className={isSuccess ? 'text-green-600' : 'text-red-600'}>{message}</p>
        {isSuccess && (
          <p className="text-sm text-gray-500 mt-3">Redirecting to login in 3 seconds...</p>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
