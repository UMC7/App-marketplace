import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabase';
import '../styles/login.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else if (data.user) {
        navigate('/');
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err) {
      console.error('An unexpected error occurred while signing in:', err.message);
      setError('An unexpected error occurred while signing in.');
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/google/callback`,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });
      if (oauthError) setError(oauthError.message);
    } catch (err) {
      console.error('Google sign-in failed:', err.message);
      setError('Google sign-in failed. Please try again.');
    }
  };

  const handlePasswordRecovery = async () => {
    setRecoveryMessage('');
    if (!email) {
      setRecoveryMessage('Please enter your email address.');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/profile?tab=usuario`
      });
      if (error) {
        setRecoveryMessage(error.message);
      } else {
        setRecoveryMessage('We sent you a reset link. Please check your Inbox (and Spam/Promotions).');
      }
    } catch (err) {
      console.error('Failed to send recovery link:', err.message);
      setRecoveryMessage('An unexpected error occurred while sending the link.');
    }
  };

  const isLoginFormComplete = () => {
    return email.trim() !== '' && password !== '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (showRecovery) {
      handlePasswordRecovery();
    } else if (isLoginFormComplete()) {
      handleLogin();
    }
  };

  return (
    <div className="login-page-wrapper">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Welcome Back</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={!isLoginFormComplete()}>
          Sign In
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div className="login-divider" aria-hidden="true">
          <span>or</span>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="google-signin-btn"
          aria-label="Continue with Google"
        >
          <span className="google-signin-icon" aria-hidden="true">
            <svg viewBox="0 0 18 18" role="img" focusable="false">
              <path fill="#4285F4" d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.482h4.844a4.14 4.14 0 0 1-1.797 2.716v2.258h2.908c1.702-1.567 2.685-3.878 2.685-6.615Z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.258c-.806.54-1.836.859-3.048.859-2.344 0-4.328-1.585-5.037-3.714H.957v2.333A9 9 0 0 0 9 18Z" />
              <path fill="#FBBC05" d="M3.963 10.707A5.42 5.42 0 0 1 3.682 9c0-.592.102-1.168.281-1.707V4.96H.957A9 9 0 0 0 0 9c0 1.453.348 2.828.957 4.04l3.006-2.333Z" />
              <path fill="#EA4335" d="M9 3.58c1.322 0 2.508.454 3.441 1.345l2.582-2.582C13.463.891 11.426 0 9 0A9 9 0 0 0 .957 4.96l3.006 2.333C4.672 5.164 6.656 3.58 9 3.58Z" />
            </svg>
          </span>
          <span className="google-signin-label">Continue with Google</span>
        </button>

        <div style={{ marginTop: '12px' }}>
          <button
            type="button"
            onClick={() => setShowRecovery(!showRecovery)}
            className="forgot-password-btn"
          >
            {showRecovery ? 'Hide recovery' : 'Forgot your password?'}
          </button>
        </div>

        {showRecovery && (
          <div style={{ marginTop: '12px' }}>
            <button type="submit">Send recovery link</button>
            {recoveryMessage && <p style={{ color: 'green' }}>{recoveryMessage}</p>}
          </div>
        )}
      </form>
    </div>
  );
}

export default LoginPage;