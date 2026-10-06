// src/pages/RegisterPage.js

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabase';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import Avatar from '../components/Avatar';
import '../styles/float.css';

function RegisterPage() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    birthYear: '',
    nickname: '',
    phoneCode: '',
    phone: '',
    altPhoneCode: '',
    altPhone: '',
    altEmail: '',
  });

  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isCandidate, setIsCandidate] = useState(true);
  const [, setShowMissing] = useState(false);
  const [error, setError] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [nicknameStatus, setNicknameStatus] = useState('idle'); // idle | checking | available | taken | invalid
  const [showEmailConfirmModal, setShowEmailConfirmModal] = useState(false);
  const formRef = useRef(null);
  const signUpButtonRef = useRef(null);
  const nicknameCheckId = useRef(0);
  const [signUpOverlayRect, setSignUpOverlayRect] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    setShowEmailConfirmModal(false);
    setError('');
  }, []);

  useEffect(() => {
    const updateRect = () => {
      const formEl = formRef.current;
      const btnEl = signUpButtonRef.current;
      if (!formEl || !btnEl) return;
      const formBox = formEl.getBoundingClientRect();
      const btnBox = btnEl.getBoundingClientRect();
      setSignUpOverlayRect({
        top: btnBox.top - formBox.top,
        left: btnBox.left - formBox.left,
        width: btnBox.width,
        height: btnBox.height,
      });
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, []);

  const isPasswordValid = (password) => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[!@#$%^&*(),.?\":{}|<>]/.test(password)
    );
  };

  const isNumeric = (value) => /^\d+$/.test(value);

  // Valida reglas de nickname: máx 7, solo A-Z/a-z/0-9, ≤ 3 dígitos
const handleNicknameChange = (e) => {
  let v = e.target.value || '';
  // solo alfanumérico ASCII y tope 7
  v = v.replace(/[^A-Za-z0-9]/g, '').slice(0, 7);

  const digits = (v.match(/\d/g) || []).length;
  const letters = (v.match(/[A-Za-z]/g) || []).length;

  setForm((prev) => ({ ...prev, nickname: v }));

  if (!v) {
    setNicknameError('Nickname is required.');
    setNicknameStatus('invalid');
  } else if (!/^[A-Za-z0-9]{3,7}$/.test(v)) {
    setNicknameError('Only letters and numbers, 3-7 chars.');
    setNicknameStatus('invalid');
  } else if (letters < 3) {
    setNicknameError('At least 3 letters required.');
    setNicknameStatus('invalid');
  } else if (digits > 3) {
    setNicknameError('Maximum of 3 digits allowed.');
    setNicknameStatus('invalid');
  } else {
    setNicknameError('');
    setNicknameStatus('checking');
  }
};

  useEffect(() => {
    const nick = form.nickname || '';
    if (!nick || nicknameError) return;
    const checkId = ++nicknameCheckId.current;
    const t = setTimeout(async () => {
      try {
        const { data: nicknameAvailable, error: nickErr } = await supabase
          .rpc('rpc_nickname_is_available', { p_nickname: nick });

        if (checkId !== nicknameCheckId.current) return;
        if (nickErr) {
          setNicknameStatus('invalid');
          return;
        }
        setNicknameStatus(nicknameAvailable ? 'available' : 'taken');
      } catch {
        if (checkId === nicknameCheckId.current) setNicknameStatus('invalid');
      }
    }, 400);

    return () => clearTimeout(t);
  }, [form.nickname, nicknameError]);

  const normalizePhoneCode = (val) => {
    const digits = (val || '').replace(/\D/g, '').replace(/^0+/, '');
    return digits.slice(0, 3);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (['phoneCode', 'altPhoneCode'].includes(name)) {
      setForm({ ...form, [name]: normalizePhoneCode(value) });
      return;
    }
    if (['phone', 'altPhone'].includes(name)) {
      const digitsOnly = value.replace(/\D/g, '');
      setForm({ ...form, [name]: digitsOnly });
      return;
    }
    setForm({ ...form, [name]: value });
  };

  const handleAvatarChange = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const okTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!okTypes.includes(file.type)) {
    toast.error('Invalid image type. Use JPG, PNG, or WEBP.');
    e.target.value = '';
    return;
  }
  const maxBytes = 5 * 1024 * 1024; // 5MB
  if (file.size > maxBytes) {
    toast.error('Image too large. Max 5MB.');
    e.target.value = '';
    return;
  }

  if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
  setAvatarFile(file);
  const url = URL.createObjectURL(file);
  setAvatarPreviewUrl(url);
};

const clearAvatar = () => {
  setAvatarFile(null);
  if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
  setAvatarPreviewUrl(null);
  const input = document.getElementById('avatar-input');
  if (input) input.value = '';
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
      console.error('Google sign-up failed:', err.message);
      setError('Google sign-up failed. Please try again.');
    }
  };

  const handleRegister = async () => {
    setError('');

    if (!/^[A-Za-z0-9]{3,7}$/.test(form.nickname || '')) {
      setError('Nickname must be 3-7 characters, letters and numbers only.');
      return;
    }
    if (((form.nickname || '').match(/[A-Za-z]/g) || []).length < 3) {
      setError('Nickname must include at least 3 letters.');
      return;
    }
    if (((form.nickname || '').match(/\d/g) || []).length > 3) {
      setError('Nickname can contain at most 3 digits.');
      return;
    }
    if (nicknameError) {
      setError(nicknameError);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const password = form.password;
    const passwordRequirements = [];

    if (password.length < 8) passwordRequirements.push('at least 8 characters');
    if (!/[A-Z]/.test(password)) passwordRequirements.push('one uppercase letter');
    if (!/[a-z]/.test(password)) passwordRequirements.push('one lowercase letter');
    if (!/[0-9]/.test(password)) passwordRequirements.push('one number');
    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) passwordRequirements.push('one special character');

    if (passwordRequirements.length > 0) {
      setError(`Password must contain ${passwordRequirements.join(', ')}.`);
      return;
    }

    if (!acceptedTerms) {
      setError('You must accept the Terms of Use and Privacy Policy.');
      return;
    }

    if (!form.firstName || !form.lastName || !form.birthYear || !form.phoneCode || !form.phone) {
      setShowMissing(true);
      setError('Please complete all required fields.');
      return;
    }

    if (!isNumeric(form.birthYear) || Number(form.birthYear) < 1900 || Number(form.birthYear) > 2008) {
      setError('Please enter a valid year of birth.');
      return;
    }

    try {
      const { data: nicknameAvailable, error: nickCheckError } = await supabase
        .rpc('rpc_nickname_is_available', { p_nickname: form.nickname });

      if (nickCheckError) {
        setError('Could not validate nickname availability.');
        return;
      }
      if (!nicknameAvailable) {
        setNicknameStatus('taken');
        setError('Nickname is already taken.');
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            first_name: form.firstName,
            last_name: form.lastName,
            birth_year: Number(form.birthYear),
            nickname: form.nickname,
            phone_code: form.phoneCode,
            phone_number: form.phone,
            phone: `+${form.phoneCode}${form.phone}`,
            alt_phone: form.altPhoneCode && form.altPhone ? `+${form.altPhoneCode}${form.altPhone}` : null,
            alt_email: form.altEmail || null,
            is_candidate: isCandidate,
            accepted_terms: acceptedTerms,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data?.user) {
        if (avatarFile) {
          const reader = new FileReader();
          reader.onload = () => {
            localStorage.setItem('pending_avatar', JSON.stringify({ dataUrl: reader.result }));
          };
          reader.readAsDataURL(avatarFile);
        }
        setShowEmailConfirmModal(true);
      }
    } catch (err) {
      console.error('Registration failed:', err.message);
      setError('Registration failed. Please try again.');
    }
  };

  const missing = {
    email: !form.email.trim(),
    password: !form.password,
    confirmPassword: !form.confirmPassword,
    firstName: !form.firstName.trim(),
    lastName: !form.lastName.trim(),
    birthYear: !form.birthYear,
    nickname: nicknameStatus !== 'available',
    phoneCode: !form.phoneCode,
    phone: !form.phone,
    acceptedTerms: !acceptedTerms,
  };

  const highlightClass = (key) => missing[key] ? 'missing-required' : '';

  return (
    <div className="login-page-wrapper">
      <div className="login-form" ref={formRef} style={{ position: 'relative' }}>
        <h2>Create Account</h2>

        <button type="button" onClick={handleGoogleSignIn}>
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}>
          <div style={{ height: 1, background: '#777', flex: 1 }} />
          <span style={{ fontSize: '0.85rem' }}>or</span>
          <div style={{ height: 1, background: '#777', flex: 1 }} />
        </div>

        <input
          name="email"
          type="email"
          placeholder="Email *"
          value={form.email}
          onChange={handleChange}
          className={highlightClass('email')}
        />
        <input
          name="password"
          type="password"
          placeholder="Password *"
          value={form.password}
          onChange={handleChange}
          className={highlightClass('password')}
        />
        <input
          name="confirmPassword"
          type="password"
          placeholder="Confirm Password *"
          value={form.confirmPassword}
          onChange={handleChange}
          className={highlightClass('confirmPassword')}
        />
        <input
          name="firstName"
          placeholder="First Name *"
          value={form.firstName}
          onChange={handleChange}
          className={highlightClass('firstName')}
        />
        <input
          name="lastName"
          placeholder="Last Name *"
          value={form.lastName}
          onChange={handleChange}
          className={highlightClass('lastName')}
        />
        <input
          name="birthYear"
          placeholder="Year of Birth *"
          value={form.birthYear}
          onChange={handleChange}
          className={highlightClass('birthYear')}
        />
        <input
          name="nickname"
          placeholder="Nickname *"
          value={form.nickname}
          onChange={handleNicknameChange}
          maxLength={7}
          className={highlightClass('nickname')}
        />
        {nicknameStatus === 'checking' && <p>Checking nickname...</p>}
        {nicknameStatus === 'available' && <p>Nickname available.</p>}
        {nicknameStatus === 'taken' && <p>Nickname already taken.</p>}
        {nicknameError && <p>{nicknameError}</p>}

        <div style={{ display: 'flex', gap: 8 }}>
          <input value="+" disabled style={{ width: 40, textAlign: 'center' }} />
          <input
            name="phoneCode"
            placeholder="Code *"
            value={form.phoneCode}
            onChange={handleChange}
            style={{ width: 70 }}
            className={highlightClass('phoneCode')}
          />
          <input
            name="phone"
            placeholder="Primary Phone *"
            value={form.phone}
            onChange={handleChange}
            style={{ flex: 1 }}
            className={highlightClass('phone')}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <input value="+" disabled style={{ width: 40, textAlign: 'center' }} />
          <input
            name="altPhoneCode"
            placeholder="Code"
            value={form.altPhoneCode}
            onChange={handleChange}
            style={{ width: 70 }}
          />
          <input
            name="altPhone"
            placeholder="Alternative Phone"
            value={form.altPhone}
            onChange={handleChange}
            style={{ flex: 1 }}
          />
        </div>

        <input
          name="altEmail"
          type="email"
          placeholder="Alternative Email"
          value={form.altEmail}
          onChange={handleChange}
        />

        <Avatar src={avatarPreviewUrl} />
        <input id="avatar-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} />
        {avatarPreviewUrl && <button type="button" onClick={clearAvatar}>Remove image</button>}

        <label>
          <input
            type="checkbox"
            checked={isCandidate}
            onChange={(e) => setIsCandidate(e.target.checked)}
          />
          Enable Candidate Profile
        </label>

        <label>
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className={highlightClass('acceptedTerms')}
          />
          I accept the Terms of Use and Privacy Policy
        </label>

        <button ref={signUpButtonRef} type="button" onClick={handleRegister}>
          Sign Up
        </button>

        {signUpOverlayRect && (
          <div
            style={{
              position: 'absolute',
              top: signUpOverlayRect.top,
              left: signUpOverlayRect.left,
              width: signUpOverlayRect.width,
              height: signUpOverlayRect.height,
              pointerEvents: 'none',
            }}
          />
        )}

        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>

      <Modal isOpen={showEmailConfirmModal} onClose={() => { setShowEmailConfirmModal(false); navigate('/login'); }}>
        <p>Please check your email to confirm your account.</p>
      </Modal>
    </div>
  );
}

export default RegisterPage;