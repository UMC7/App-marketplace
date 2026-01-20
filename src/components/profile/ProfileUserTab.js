import React from 'react';
import Avatar from '../Avatar';

const isPasswordValid = (value) => {
  if (!value) return false;
  if (value.length < 8) return false;
  if (!/[A-Z]/.test(value)) return false;
  if (!/[a-z]/.test(value)) return false;
  if (!/[0-9]/.test(value)) return false;
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return false;
  return true;
};

const ProfileUserTab = ({
  nickname,
  localAvatarUrl,
  onChangeAvatar,
  onRemoveAvatar,
  candidateEnabled,
  onCandidateToggle,
  onSubmit,
  userDetails,
  userForm,
  onChange,
  updateMessage,
}) => {
  const highlightStyle = {
    border: '1px solid #e55353',
    boxShadow: '0 0 0 2px rgba(229, 83, 83, 0.2)',
  };

  const normalizeEmail = (email) => (email || '').trim().toLowerCase();
  const primaryEmailValue = normalizeEmail(userForm.email);
  const altEmailValue = normalizeEmail(userForm.altEmail);
  const primaryPhoneValue =
    userForm.phoneCode && userForm.phone ? `${userForm.phoneCode}${userForm.phone}` : '';
  const altPhoneValue =
    userForm.altPhoneCode && userForm.altPhone
      ? `${userForm.altPhoneCode}${userForm.altPhone}`
      : '';

  const isAltEmailDuplicate =
    !!userForm.altEmail?.trim() && !!primaryEmailValue && altEmailValue === primaryEmailValue;
  const isAltPhoneDuplicate =
    !!altPhoneValue && !!primaryPhoneValue && altPhoneValue === primaryPhoneValue;

  return (
    <div className="user-info-form" style={{ maxWidth: 460 }}>
    <h2>User Information</h2>
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        margin: '12px 0 16px',
      }}
    >
      <Avatar nickname={nickname} srcUrl={localAvatarUrl} size="xl" />

      <div style={{ width: '100%', maxWidth: 360 }}>
        <input
          id="avatar-upload-input"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={onChangeAvatar}
          style={{ width: '100%' }}
        />
        {localAvatarUrl ? (
          <div style={{ marginTop: 6, textAlign: 'center' }}>
            <button type="button" onClick={onRemoveAvatar}>
              Remove photo
            </button>
          </div>
        ) : (
          <p style={{ fontSize: '0.85rem', margin: '6px 0 0 0', textAlign: 'center' }}>
            No photo: your nickname will be shown inside a circle.
          </p>
        )}
      </div>
    </div>
    <div
      style={{
        margin: '8px 0 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      <input
        type="checkbox"
        id="enable-candidate"
        checked={candidateEnabled}
        onChange={onCandidateToggle}
        style={{ width: '18px', height: '18px', margin: 0, alignSelf: 'center' }}
      />
      <label
        htmlFor="enable-candidate"
        style={{ margin: 0, lineHeight: '1', alignSelf: 'center' }}
      >
        Enable Candidate Profile
      </label>
    </div>
    <form onSubmit={onSubmit}>
      <div className="static-info">
        <strong>Name:</strong> {userDetails.first_name || ''}
      </div>
      <div className="static-info">
        <strong>Last Name:</strong> {userDetails.last_name || ''}
      </div>
      <div className="static-info">
        <strong>Date of Birth:</strong> {userDetails.birth_year || ''}
      </div>
      <div className="static-info">
        <strong>Nickname:</strong> {userDetails.nickname || ''}
      </div>

      <label>Main Phone</label>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value="+"
          disabled
          style={{
            width: '40px',
            textAlign: 'center',
            background: '#1e1e1e',
            border: '1px solid #555',
            borderRadius: '4px',
            color: '#fff',
            fontWeight: 'bold',
          }}
        />
        <input
          name="phoneCode"
          placeholder="Code"
          value={userForm.phoneCode}
          onChange={onChange}
          inputMode="numeric"
          pattern="[0-9]*"
          style={{ width: '70px' }}
          required
        />
        <input
          name="phone"
          placeholder="Phone Number"
          value={userForm.phone}
          onChange={onChange}
          inputMode="numeric"
          pattern="[0-9]*"
          style={{ flex: 1 }}
          required
        />
      </div>

      <label>Alternative Phone</label>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value="+"
          disabled
          style={{
            width: '40px',
            textAlign: 'center',
            background: '#1e1e1e',
            border: '1px solid #555',
            borderRadius: '4px',
            color: '#fff',
            fontWeight: 'bold',
          }}
        />
        <input
          name="altPhoneCode"
          placeholder="Code"
          value={userForm.altPhoneCode}
          onChange={onChange}
          inputMode="numeric"
          pattern="[0-9]*"
          style={{
            width: '70px',
            ...(isAltPhoneDuplicate ? highlightStyle : null),
          }}
        />
        <input
          name="altPhone"
          placeholder="Alternative Number"
          value={userForm.altPhone}
          onChange={onChange}
          inputMode="numeric"
          pattern="[0-9]*"
          style={{
            flex: 1,
            ...(isAltPhoneDuplicate ? highlightStyle : null),
          }}
        />
      </div>
      {isAltPhoneDuplicate && (
        <p style={{ color: '#b00020', marginTop: 6, marginBottom: 8, fontSize: '0.9rem' }}>
          Alternative phone must be different from main phone.
        </p>
      )}

      <label htmlFor="email">Main Email</label>
      <input id="email" name="email" value={userForm.email} onChange={onChange} />

      <label htmlFor="altEmail">Alternative Email</label>
      <input
        id="altEmail"
        name="altEmail"
        value={userForm.altEmail}
        onChange={onChange}
        style={isAltEmailDuplicate ? highlightStyle : undefined}
      />
      {isAltEmailDuplicate && (
        <p style={{ color: '#b00020', marginTop: 6, marginBottom: 8, fontSize: '0.9rem' }}>
          Alternative email must be different from main email.
        </p>
      )}

      <label htmlFor="password">Password</label>
      <div>
        <input
          id="password"
          type="password"
          name="password"
          value={userForm.password}
          onChange={onChange}
        />
      </div>
      <p style={{ fontSize: '0.85rem', marginBottom: '8px' }}>
        Password must be at least 8 characters and include one uppercase letter, one lowercase letter,
        one number, and one special character.
      </p>

      <label htmlFor="confirmPassword">Confirm Password</label>
      <div>
        <input
          id="confirmPassword"
          type="password"
          name="confirmPassword"
          value={userForm.confirmPassword}
          onChange={onChange}
        />
      </div>
      {userForm.confirmPassword &&
        userForm.confirmPassword === userForm.password && (
          <p style={{ fontSize: '0.85rem', color: 'green', marginBottom: '8px' }}>
            Passwords match.
          </p>
        )}
      {userForm.confirmPassword &&
        userForm.confirmPassword !== userForm.password && (
          <p style={{ fontSize: '0.85rem', color: '#b00020', marginBottom: '8px' }}>
            Passwords do not match.
          </p>
        )}

      <button type="submit">Update Information</button>
      {updateMessage && (
        <p style={{ marginTop: '10px', color: '#007700' }}>{updateMessage}</p>
      )}
    </form>
  </div>
  );
};

export default ProfileUserTab;
