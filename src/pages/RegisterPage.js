// src/pages/RegisterPage.js

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabase';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import Avatar from '../components/Avatar';

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
  const [showMissing, setShowMissing] = useState(false);
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
      /[!@#$%^&*(),.?":{}|<>]/.test(password)
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
        const { data: existingNickname, error: nickErr } = await supabase
          .from('users')
          .select('id')
          .ilike('nickname', nick)
          .maybeSingle();

        if (checkId !== nicknameCheckId.current) return;
        if (nickErr) {
          setNicknameStatus('invalid');
          return;
        }
        setNicknameStatus(existingNickname ? 'taken' : 'available');
      } catch {
        if (checkId === nicknameCheckId.current) setNicknameStatus('invalid');
      }
    }, 400);

    return () => clearTimeout(t);
  }, [form.nickname, nicknameError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (['phoneCode', 'phone', 'altPhoneCode', 'altPhone'].includes(name)) {
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

    if (!isNumeric(form.phoneCode)) {
      setError('Country code must contain only numbers.');
      return;
    }

    if (form.altPhoneCode && !isNumeric(form.altPhoneCode)) {
      setError('Alternative country code must contain only numbers.');
      return;
    }

    if (!acceptedTerms) {
      setError('You must accept the Terms of Use and Privacy Policy.');
      return;
    }

    const { data: existingNickname, error: nickErr } = await supabase
      .from('users')
      .select('id')
      .ilike('nickname', form.nickname) // sin comodines → igualdad case-insensitive
      .maybeSingle();

    if (nickErr) {
      console.error('Error checking nickname:', nickErr.message);
    }

    if (existingNickname) {
      setError('Nickname already taken. Please choose another.');
      return;
    }

    // Persist pending avatar locally (to upload after email confirmation)
try {
  if (avatarFile) {
    const fr = new FileReader();
    fr.onload = () => {
      try {
        localStorage.setItem(
          'pending_avatar',
          JSON.stringify({ type: 'dataurl', dataUrl: fr.result, ts: Date.now() })
        );
      } catch {}
    };
    fr.readAsDataURL(avatarFile);
  } else {
    localStorage.removeItem('pending_avatar');
  }
} catch {}

    try {
      const fullAltPhone =
        form.altPhone && form.altPhoneCode ? `+${form.altPhoneCode}${form.altPhone}` : null;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            first_name: form.firstName,
            last_name: form.lastName,
            birth_year: parseInt(form.birthYear),
            nickname: form.nickname,
            phone_code: form.phoneCode,
            phone_number: form.phone,
            alt_phone: fullAltPhone,
            alt_email: form.altEmail || null,
            is_candidate: isCandidate,
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

  const birthYears = Array.from({ length: 80 }, (_, i) => 2008 - i);

  const highlightStyle = {
    border: '1px solid #e55353',
    boxShadow: '0 0 0 2px rgba(229, 83, 83, 0.2)',
  };

  const nicknameOk =
    /^[A-Za-z0-9]{3,7}$/.test(form.nickname || '') &&
    ((form.nickname || '').match(/[A-Za-z]/g) || []).length >= 3 &&
    ((form.nickname || '').match(/\d/g) || []).length <= 3 &&
    !nicknameError &&
    nicknameStatus !== 'taken';

  const missing = {
    firstName: !form.firstName.trim(),
    lastName: !form.lastName.trim(),
    birthYear: !form.birthYear,
    nickname: !nicknameOk,
    phoneCode: !form.phoneCode.trim() || !isNumeric(form.phoneCode),
    phone: !form.phone.trim(),
    email: !form.email.trim(),
    password: !form.password || !isPasswordValid(form.password),
    confirmPassword: !form.confirmPassword || form.password !== form.confirmPassword,
    acceptedTerms: !acceptedTerms,
  };

  const shouldHighlight = (key) => showMissing && missing[key];

  const isFormComplete = () => {
    const {
      firstName,
      lastName,
      birthYear,
      phoneCode,
      phone,
      email,
      password,
      confirmPassword,
    } = form;

    return (
      firstName.trim() &&
      lastName.trim() &&
      birthYear &&
      nicknameOk &&
      phoneCode.trim() &&
      isNumeric(phoneCode) &&
      phone.trim() &&
      email.trim() &&
      password &&
      confirmPassword &&
      password === confirmPassword &&
      acceptedTerms
    );
  };
  const isComplete = isFormComplete();

  const handleCloseEmailModal = () => {
    setShowEmailConfirmModal(false);
    navigate('/');
  };

  const plusInputStyle = {
    width: '40px',
    textAlign: 'center',
    background: '#1e1e1e',
    border: '1px solid #555',
    borderRadius: '4px',
    color: '#fff',
    fontWeight: 'bold',
  };

  return (
    <div className="container">
      <div className="login-form" ref={formRef} style={{ position: 'relative' }}>
        <h2>User Registration</h2>

    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
      }}
    >
      <Avatar
        nickname={form.nickname || 'User'}
        srcUrl={avatarPreviewUrl}
        size="xl"
      />

      <div style={{ width: '100%', maxWidth: 360 }}>
        <input
          id="avatar-input"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleAvatarChange}
          style={{ width: '100%' }}
        />
        {avatarPreviewUrl ? (
          <div style={{ marginTop: 6, textAlign: 'center' }}>
            <button type="button" onClick={clearAvatar}>Remove photo</button>
          </div>
        ) : (
          <p style={{ fontSize: '0.85rem', margin: '6px 0 0 0', textAlign: 'center' }}>
            If you don’t add a photo, we’ll use your nickname inside a circle.
          </p>
        )}
      </div>
    </div>

        <label>
          Name <span style={{ color: 'red' }}>*</span>
        </label>
        <input
          name="firstName"
          placeholder="Name"
          onChange={handleChange}
          required
          style={shouldHighlight('firstName') ? highlightStyle : undefined}
        />

        <label>
          Last Name <span style={{ color: 'red' }}>*</span>
        </label>
        <input
          name="lastName"
          placeholder="Last Name"
          onChange={handleChange}
          required
          style={shouldHighlight('lastName') ? highlightStyle : undefined}
        />

        <label>
          Year of Birth <span style={{ color: 'red' }}>*</span>
        </label>
        <select
          name="birthYear"
          onChange={handleChange}
          required
          style={shouldHighlight('birthYear') ? highlightStyle : undefined}
        >
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
        <input
          name="nickname"
          placeholder="Nickname"
          value={form.nickname}
          onChange={handleNicknameChange}
          maxLength={7}
          required
          style={shouldHighlight('nickname') ? highlightStyle : undefined}
        />
        {!nicknameError && form.nickname && (
          <p
            style={{
              color:
                nicknameStatus === 'available'
                  ? '#1f7a1f'
                  : nicknameStatus === 'taken'
                  ? '#c00000'
                  : '#666',
              marginTop: -8,
              marginBottom: 8,
              fontSize: '0.9rem',
            }}
          >
            {nicknameStatus === 'checking' && 'Checking availability...'}
            {nicknameStatus === 'available' && 'Nickname available.'}
            {nicknameStatus === 'taken' && 'Nickname already taken.'}
            {nicknameStatus === 'invalid' && 'Nickname not valid.'}
          </p>
        )}
        {nicknameError ? (
          <p style={{ color: 'red', marginTop: -8, marginBottom: 8, fontSize: '0.9rem' }}>{nicknameError}</p>
        ) : (
          <p style={{ color: '#666', marginTop: -8, marginBottom: 8, fontSize: '0.9rem' }}>
            3-7 characters. At least 3 letters. Max 3 digits.
          </p>
        )}

        <label>
          Primary Phone <span style={{ color: 'red' }}>*</span>
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input type="text" value="+" disabled style={plusInputStyle} />
          <input
            name="phoneCode"
            placeholder="Code"
            onChange={handleChange}
            value={form.phoneCode}
            inputMode="numeric"
            pattern="[0-9]*"
            style={{
              width: '70px',
              ...(shouldHighlight('phoneCode') ? highlightStyle : null),
            }}
            required
          />
          <input
            name="phone"
            placeholder="Primary Phone"
            onChange={handleChange}
            value={form.phone}
            inputMode="numeric"
            pattern="[0-9]*"
            style={{
              flex: 1,
              ...(shouldHighlight('phone') ? highlightStyle : null),
            }}
            required
          />
        </div>

        <label>Alternative Phone (optional)</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input type="text" value="+" disabled style={plusInputStyle} />
          <input
            name="altPhoneCode"
            placeholder="Code"
            onChange={handleChange}
            value={form.altPhoneCode}
            inputMode="numeric"
            pattern="[0-9]*"
            style={{ width: '70px' }}
          />
          <input
            name="altPhone"
            placeholder="Alternative Phone"
            onChange={handleChange}
            value={form.altPhone}
            inputMode="numeric"
            pattern="[0-9]*"
            style={{ flex: 1 }}
          />
        </div>

        <label>
          Primary Email <span style={{ color: 'red' }}>*</span>
        </label>
        <input
          name="email"
          placeholder="Primary Email"
          onChange={handleChange}
          required
          style={shouldHighlight('email') ? highlightStyle : undefined}
        />

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
            style={{
              flex: 1,
              ...(shouldHighlight('password') ? highlightStyle : null),
            }}
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
            style={{
              flex: 1,
              ...(shouldHighlight('confirmPassword') ? highlightStyle : null),
            }}
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
            id="isCandidate"
            checked={isCandidate}
            onChange={(e) => setIsCandidate(e.target.checked)}
          />
          <label
            htmlFor="isCandidate"
            style={{
              fontSize: '0.92rem',
              lineHeight: 1.4,
              transform: 'translateY(-4px)',
            }}
          >
            Enable Candidate Profile
          </label>
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
            style={shouldHighlight('acceptedTerms') ? { outline: '2px solid #e55353', outlineOffset: 2 } : undefined}
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
          disabled={!isComplete}
          style={{
            opacity: isComplete ? 1 : 0.5,
            cursor: isComplete ? 'pointer' : 'not-allowed',
          }}
          ref={signUpButtonRef}
        >
          Sign Up
        </button>
        {!isComplete && signUpOverlayRect && (
          <div
            onClick={() => setShowMissing(true)}
            style={{
              position: 'absolute',
              top: signUpOverlayRect.top,
              left: signUpOverlayRect.left,
              width: signUpOverlayRect.width,
              height: signUpOverlayRect.height,
              cursor: 'not-allowed',
              background: 'transparent',
              zIndex: 2,
            }}
            aria-hidden="true"
          />
        )}

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
