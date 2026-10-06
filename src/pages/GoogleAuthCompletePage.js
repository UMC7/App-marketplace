import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import supabase from '../supabase';
import '../styles/login.css';
import '../styles/float.css';

function GoogleAuthCompletePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isLocalPreview =
    process.env.NODE_ENV !== 'production' && searchParams.get('preview') === '1';

  const [loading, setLoading] = useState(!isLocalPreview);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [authUser, setAuthUser] = useState(null);
  const [nicknameStatus, setNicknameStatus] = useState(isLocalPreview ? 'available' : 'idle');
  const [form, setForm] = useState({
    firstName: isLocalPreview ? 'Google' : '',
    lastName: isLocalPreview ? 'User' : '',
    birthYear: isLocalPreview ? '1990' : '',
    nickname: isLocalPreview ? 'Google1' : '',
    phoneCode: isLocalPreview ? '34' : '',
    phoneNumber: isLocalPreview ? '600000000' : '',
    isCandidate: true,
    acceptedTerms: false,
  });

  const birthYears = useMemo(() => Array.from({ length: 80 }, (_, i) => 2008 - i), []);

  useEffect(() => {
    if (isLocalPreview) return undefined;

    let active = true;
    let timeoutId;

    const finishWithSession = async (session) => {
      const user = session?.user;
      if (!active || !user) return false;

      setAuthUser(user);

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('first_name,last_name,birth_year,nickname,phone_code,phone_number,is_candidate,accepted_terms')
        .eq('id', user.id)
        .single();

      if (!active) return true;
      if (profileError) {
        setError('Your YachtDayWork profile could not be loaded.');
        setLoading(false);
        return true;
      }

      const complete =
        profile?.first_name &&
        profile?.last_name &&
        profile?.birth_year &&
        profile?.nickname &&
        profile?.phone_code &&
        profile?.phone_number &&
        profile?.accepted_terms === true;

      if (complete) {
        navigate('/profile', { replace: true });
        return true;
      }

      const meta = user.user_metadata || {};
      const fullName = (meta.full_name || meta.name || '').trim().split(/\s+/);
      setForm({
        firstName: profile?.first_name || meta.first_name || meta.given_name || fullName[0] || '',
        lastName:
          profile?.last_name ||
          meta.last_name ||
          meta.family_name ||
          (fullName.length > 1 ? fullName.slice(1).join(' ') : ''),
        birthYear: profile?.birth_year ? String(profile.birth_year) : '',
        nickname: profile?.nickname || '',
        phoneCode: profile?.phone_code || '',
        phoneNumber: profile?.phone_number || '',
        isCandidate: profile?.is_candidate ?? true,
        acceptedTerms: profile?.accepted_terms === true,
      });
      setError('');
      setLoading(false);
      return true;
    };

    const bootstrap = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (await finishWithSession(session)) return;

      timeoutId = setTimeout(() => {
        if (!active) return;
        setError('Google authentication could not be completed.');
        setLoading(false);
      }, 8000);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) return;
      if (timeoutId) clearTimeout(timeoutId);
      await finishWithSession(session);
    });

    bootstrap();

    return () => {
      active = false;
      if (timeoutId) clearTimeout(timeoutId);
      authListener?.subscription?.unsubscribe();
    };
  }, [isLocalPreview, navigate]);

  useEffect(() => {
    const nick = form.nickname.trim();
    if (!/^[A-Za-z0-9]{3,7}$/.test(nick) ||
        (nick.match(/[A-Za-z]/g) || []).length < 3 ||
        (nick.match(/\d/g) || []).length > 3) {
      setNicknameStatus(nick ? 'invalid' : 'idle');
      return;
    }

    if (isLocalPreview) {
      setNicknameStatus('available');
      return;
    }

    let active = true;
    setNicknameStatus('checking');
    const timer = setTimeout(async () => {
      const { data, error: nickError } = await supabase.rpc('rpc_nickname_is_available', {
        p_nickname: nick,
      });
      if (active) setNicknameStatus(nickError ? 'invalid' : data ? 'available' : 'taken');
    }, 350);
    return () => { active = false; clearTimeout(timer); };
  }, [form.nickname, isLocalPreview]);

  const change = (name, value) => {
    if (name === 'nickname') value = value.replace(/[^A-Za-z0-9]/g, '').slice(0, 7);
    if (name === 'phoneCode') value = value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 3);
    if (name === 'phoneNumber') value = value.replace(/\D/g, '');
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const firstNameMissing = !form.firstName.trim();
  const lastNameMissing = !form.lastName.trim();
  const birthYearMissing = !form.birthYear;
  const nicknameMissing = nicknameStatus !== 'available';
  const phoneCodeMissing = !form.phoneCode;
  const phoneNumberMissing = !form.phoneNumber;

  const canSave =
    !firstNameMissing &&
    !lastNameMissing &&
    !birthYearMissing &&
    !nicknameMissing &&
    !phoneCodeMissing &&
    !phoneNumberMissing &&
    form.acceptedTerms;

  const withTimeout = (promise, ms, message) =>
    Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
    ]);

  const save = async () => {
    if (!canSave || saving) return;

    if (isLocalPreview) {
      toast.success('Local preview completed. No data was saved.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const user = authUser || (await withTimeout(
        supabase.auth.getUser(),
        8000,
        'Authentication timed out. Please try again.'
      )).data?.user;
      if (!user) throw new Error('No authenticated user.');

      const payload = {
        email: user.email,
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        birth_year: Number(form.birthYear),
        nickname: form.nickname.trim(),
        phone_code: form.phoneCode,
        phone_number: form.phoneNumber,
        phone: `+${form.phoneCode}${form.phoneNumber}`,
        is_candidate: form.isCandidate,
        accepted_terms: true,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await withTimeout(
        supabase.from('users').update(payload).eq('id', user.id),
        10000,
        'Profile save timed out. Please try again.'
      );
      if (updateError) throw updateError;

      toast.success('Registration completed.');
      navigate('/profile', { replace: true });

      supabase.auth.updateUser({
        data: {
          first_name: payload.first_name,
          last_name: payload.last_name,
          birth_year: payload.birth_year,
          nickname: payload.nickname,
          phone_code: payload.phone_code,
          phone_number: payload.phone_number,
          is_candidate: payload.is_candidate,
          accepted_terms: true,
        },
      }).then(({ error: metadataError }) => {
        if (metadataError) {
          console.warn('Profile saved but auth metadata was not updated:', metadataError.message);
        }
      }).catch((metadataError) => {
        console.warn('Profile saved but auth metadata update failed:', metadataError?.message || metadataError);
      });
    } catch (e) {
      console.error('Google registration completion failed:', e);
      setError(e?.message || 'Registration could not be completed.');
      setSaving(false);
    }
  };

  if (loading) return <div className="login-page-wrapper"><div className="login-form"><p>Loading...</p></div></div>;

  const checkboxRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    margin: '16px 0',
  };

  const checkboxStyle = {
    width: 18,
    height: 18,
    minWidth: 18,
    minHeight: 18,
    margin: 0,
    padding: 0,
    flex: '0 0 18px',
    alignSelf: 'flex-start',
    boxSizing: 'border-box',
  };

  const checkboxLabelStyle = {
    margin: 0,
    lineHeight: 1.35,
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-form">
        <h2>Complete your registration</h2>
        {isLocalPreview ? (
          <p>Local preview mode. No Google login is required and no data will be saved.</p>
        ) : (
          <p>Google has verified your account. Please complete the required YachtDayWork details.</p>
        )}

        <label>Name *</label>
        <input
          value={form.firstName}
          onChange={(e) => change('firstName', e.target.value)}
          className={firstNameMissing ? 'missing-required' : ''}
        />

        <label>Last Name *</label>
        <input
          value={form.lastName}
          onChange={(e) => change('lastName', e.target.value)}
          className={lastNameMissing ? 'missing-required' : ''}
        />

        <label>Year of Birth *</label>
        <select
          value={form.birthYear}
          onChange={(e) => change('birthYear', e.target.value)}
          className={birthYearMissing ? 'missing-required' : ''}
        >
          <option value="">Year of Birth</option>
          {birthYears.map((year) => <option key={year} value={year}>{year}</option>)}
        </select>

        <label>Nickname *</label>
        <input
          value={form.nickname}
          maxLength={7}
          onChange={(e) => change('nickname', e.target.value)}
          className={nicknameMissing ? 'missing-required' : ''}
        />
        <p style={{ fontSize: '0.85rem', marginTop: -8 }}>
          {nicknameStatus === 'checking' && 'Checking availability...'}
          {nicknameStatus === 'available' && 'Nickname available.'}
          {nicknameStatus === 'taken' && 'Nickname already taken.'}
          {nicknameStatus === 'invalid' && '3-7 characters, at least 3 letters, maximum 3 digits.'}
        </p>

        <label>Primary Phone *</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value="+" disabled style={{ width: 40, textAlign: 'center' }} />
          <input
            value={form.phoneCode}
            placeholder="Code"
            inputMode="numeric"
            onChange={(e) => change('phoneCode', e.target.value)}
            className={phoneCodeMissing ? 'missing-required' : ''}
            style={{ width: 70 }}
          />
          <input
            value={form.phoneNumber}
            placeholder="Primary Phone"
            inputMode="numeric"
            onChange={(e) => change('phoneNumber', e.target.value)}
            className={phoneNumberMissing ? 'missing-required' : ''}
            style={{ flex: 1 }}
          />
        </div>

        <div style={checkboxRowStyle}>
          <input
            type="checkbox"
            id="googleCandidate"
            checked={form.isCandidate}
            onChange={(e) => change('isCandidate', e.target.checked)}
            style={checkboxStyle}
          />
          <label htmlFor="googleCandidate" style={checkboxLabelStyle}>Enable Candidate Profile</label>
        </div>

        <div style={checkboxRowStyle}>
          <input
            type="checkbox"
            id="googleTerms"
            checked={form.acceptedTerms}
            onChange={(e) => change('acceptedTerms', e.target.checked)}
            className={!form.acceptedTerms ? 'missing-required' : ''}
            style={checkboxStyle}
          />
          <label htmlFor="googleTerms" style={checkboxLabelStyle}>
            I accept the <a href="/legal" target="_blank" rel="noopener noreferrer">Terms of Use</a> and{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
          </label>
        </div>

        <button type="button" onClick={save} disabled={!canSave || saving}>
          {saving ? 'Saving...' : isLocalPreview ? 'Test Complete Registration' : 'Complete Registration'}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    </div>
  );
}

export default GoogleAuthCompletePage;
