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

  return (
    <div className="login-page-wrapper">
      <div className="login-form">
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
        <button onClick={handleLogin} disabled={!isLoginFormComplete()}>
          Sign In
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div style={{ marginTop: '12px' }}>
          <button
            onClick={() => setShowRecovery(!showRecovery)}
            className="forgot-password-btn"
          >
            {showRecovery ? 'Hide recovery' : '¿Forgot your password?'}
          </button>
        </div>

        {showRecovery && (
          <div style={{ marginTop: '12px' }}>
            <button onClick={handlePasswordRecovery}>Send recovery link</button>
            {recoveryMessage && <p style={{ color: 'green' }}>{recoveryMessage}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginPage;