// src/pages/RegisterPage.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabase';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';

function RegisterPage() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    birthYear: '',
    nickname: '',
    phone: '',
    altPhone: '',
    altEmail: '',
  });

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [showEmailConfirmModal, setShowEmailConfirmModal] = useState(false);

  const navigate = useNavigate();

  const isPasswordValid = (password) => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(password)
    );
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // 🔒 Validación de contraseña segura
    const password = form.password;
    const passwordRequirements = [];

    if (password.length < 8) {
      passwordRequirements.push('at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      passwordRequirements.push('one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      passwordRequirements.push('one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      passwordRequirements.push('one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      passwordRequirements.push('one special character');
    }

    if (passwordRequirements.length > 0) {
      setError(`Password must contain ${passwordRequirements.join(', ')}.`);
      return;
    }

    if (!acceptedTerms) {
      setError('You must accept the Terms of Use and Privacy Policy.');
      return;
    }

    // 🔒 Validar que el nickname no esté en uso
    const { data: existingNickname, error: nicknameError } = await supabase
      .from('users')
      .select('id')
      .eq('nickname', form.nickname)
      .maybeSingle();

    if (nicknameError) {
      console.error('Error checking nickname:', nicknameError.message);
    }

    if (existingNickname) {
      setError('Nickname already taken. Please choose another.');
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            first_name: form.firstName,
            last_name: form.lastName,
            birth_year: parseInt(form.birthYear),
            nickname: form.nickname,
            phone: form.phone,
            alt_phone: form.altPhone || null,
            alt_email: form.altEmail || null,
            accepted_terms: true,
            updated_at: new Date().toISOString(),
          },
        },
      });

      if (signUpError || !data?.user) {
        toast.error('Registration failed. Please check your information.');
        return;
      }

      toast.success('Registration successful! Please check your email to confirm your account.');
      setShowEmailConfirmModal(true);
    } catch (err) {
      setError('Something went wrong.');
    }
  };

  const birthYears = Array.from({ length: 80 }, (_, i) => 2025 - i);

  const isFormComplete = () => {
    const {
      firstName,
      lastName,
      birthYear,
      nickname,
      phone,
      email,
      password,
      confirmPassword,
    } = form;

    return (
      firstName.trim() &&
      lastName.trim() &&
      birthYear &&
      nickname.trim() &&
      phone.trim() &&
      email.trim() &&
      password &&
      confirmPassword &&
      password === confirmPassword &&
      acceptedTerms
    );
  };

  const handleCloseEmailModal = () => {
    setShowEmailConfirmModal(false);
    navigate('/');
  };

  return (
    <div className="container">
      <div className="login-form">
        <h2>User Registration</h2>

        <label>
          Name <span style={{ color: 'red' }}>*</span>
        </label>
        <input name="firstName" placeholder="Name" onChange={handleChange} required />

        <label>
          Last Name <span style={{ color: 'red' }}>*</span>
        </label>
        <input name="lastName" placeholder="Last Name" onChange={handleChange} required />

        <label>
          Year of Birth <span style={{ color: 'red' }}>*</span>
        </label>
        <select name="birthYear" onChange={handleChange} required>
          <option value="">Year of Birth</option>
          {birthYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        <label>
          Nickname <span style={{ color: 'red' }}>*</span>
        </label>
        <input name="nickname" placeholder="Nickname" onChange={handleChange} required />

        <label>
          Primary Phone <span style={{ color: 'red' }}>*</span>
        </label>
        <input name="phone" placeholder="Primary Phone" onChange={handleChange} required />

        <label>Alternative Phone (optional)</label>
        <input name="altPhone" placeholder="Alternative Phone" onChange={handleChange} />

        <label>
          Primary Email <span style={{ color: 'red' }}>*</span>
        </label>
        <input name="email" placeholder="Primary Email" onChange={handleChange} required />

        <label>Alternative Email (optional)</label>
        <input name="altEmail" placeholder="Alternative Email" onChange={handleChange} />

        <label>
          Password <span style={{ color: 'red' }}>*</span>
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            value={form.password}
            required
            style={{ flex: 1 }}
          />
          {form.password && isPasswordValid(form.password) && (
            <span style={{ color: 'green', fontSize: '1.2rem' }}>✔️</span>
          )}
        </div>
        <p style={{ fontSize: '0.85rem', marginBottom: '8px' }}>
          Password must be at least 8 characters and include one uppercase letter, one lowercase letter,
          one number, and one special character.
        </p>

        <label>
          Confirm Password <span style={{ color: 'red' }}>*</span>
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            onChange={handleChange}
            value={form.confirmPassword}
            required
            style={{ flex: 1 }}
          />
          {form.confirmPassword &&
            form.confirmPassword === form.password && (
              <span style={{ color: 'green', fontSize: '1.2rem' }}>✔️</span>
            )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '20px auto',
            columnGap: '10px',
            margin: '16px 0',
          }}
        >
          <input
            type="checkbox"
            id="terms"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            required
          />
          <label
            htmlFor="terms"
            style={{
              fontSize: '0.92rem',
              lineHeight: 1.4,
              transform: 'translateY(-4px)',
            }}
          >
            I accept the{' '}
            <a href="/legal" target="_blank" rel="noopener noreferrer">
              Terms of Use
            </a>{' '}
            and{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>.
          </label>
        </div>

        <button
          onClick={handleRegister}
          disabled={!isFormComplete()}
          style={{
            opacity: isFormComplete() ? 1 : 0.5,
            cursor: isFormComplete() ? 'pointer' : 'not-allowed',
          }}
        >
          Sign Up
        </button>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>
          <span style={{ color: 'red' }}>*</span> Required fields
        </p>
      </div>

      {showEmailConfirmModal && (
        <Modal onClose={handleCloseEmailModal}>
          <h3 style={{ marginTop: 0 }}>🎉 You’re almost there!</h3>
          <p>
            We have sent a confirmation email to <strong>{form.email || 'your email'}</strong>.
          </p>
          <ul style={{ margin: '8px 0 12px 18px' }}>
            <li>Please check your <strong>Inbox</strong>.</li>
            <li>If it is not there, look in <strong>Spam/Junk</strong> or <strong>Promotions</strong>.</li>
            <li>Open the link to activate your account.</li>
          </ul>
          <button
            className="landing-button"
            onClick={handleCloseEmailModal}
            style={{ width: '100%' }}
          >
            I will check my email
          </button>
        </Modal>
      )}
    </div>
  );
}

export default RegisterPage;