import React, { useState } from 'react';
import TasteScopeLanding from './pages/TasteScopeLanding';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

const App = () => {
  const [currentPage, setCurrentPage] = useState('landing'); // 'landing', 'login', 'signup', 'forgot-password'

  const handleLoginClick = () => {
    setCurrentPage('login');
  };

  const handleSignUpClick = () => {
    setCurrentPage('signup');
  };

  const handleForgotPasswordClick = () => {
    setCurrentPage('forgot-password');
  };

  const handleBackClick = () => {
    setCurrentPage('landing');
  };

  return (
    <div>
      {currentPage === 'landing' && (
        <TasteScopeLanding onLoginClick={handleLoginClick} onSignUpClick={handleSignUpClick} />
      )}
      {currentPage === 'login' && (
        <LoginPage onSignUpClick={handleSignUpClick} onForgotPasswordClick={handleForgotPasswordClick} onBackClick={handleBackClick} />
      )}
      {currentPage === 'signup' && (
        <SignUpPage onLoginClick={handleLoginClick} onBackClick={handleBackClick} />
      )}
      {currentPage === 'forgot-password' && (
        <ForgotPasswordPage onBackClick={() => setCurrentPage('login')} />
      )}
    </div>
  );
};

export default App;
