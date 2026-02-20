// src/pages/ResetPasswordPage.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabase';

function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Verifica que estamos en modo recovery (opcional)
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    if (type !== 'recovery') {
      setMessage('Invalid password reset link.');
    }
  }, []);

  const handleResetPassword = async () => {
    setMessage('');
    if (!password || !confirmPassword) {
      setMessage('Please fill in both password fields.');
      return;
    }
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage('Password updated successfully. Redirecting to login...');
        setTimeout(() => navigate('/login'), 2500);
      }
    } catch (err) {
      console.error('Unexpected error updating password:', err.message);
      setMessage('Unexpected error while updating the password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container reset-password-form">
      <h2>Reset Your Password</h2>
      <input
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        type="password"
        placeholder="Confirm new password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      <button onClick={handleResetPassword} disabled={loading}>
        {loading ? 'Updating...' : 'Update Password'}
      </button>
      {message && <p style={{ marginTop: '10px', color: 'red' }}>{message}</p>}
    </div>
  );
}

export default ResetPasswordPage;