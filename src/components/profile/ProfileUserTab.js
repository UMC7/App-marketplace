import React from 'react';
import Avatar from '../Avatar';

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
}) => (
  <div className="user-info-form">
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
          style={{ width: '70px' }}
          required
        />
        <input
          name="phone"
          placeholder="Phone Number"
          value={userForm.phone}
          onChange={onChange}
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
          style={{ width: '70px' }}
        />
        <input
          name="altPhone"
          placeholder="Alternative Number"
          value={userForm.altPhone}
          onChange={onChange}
          style={{ flex: 1 }}
        />
      </div>

      <label htmlFor="email">Main Email</label>
      <input id="email" name="email" value={userForm.email} onChange={onChange} />

      <label htmlFor="altEmail">Alternative Email</label>
      <input
        id="altEmail"
        name="altEmail"
        value={userForm.altEmail}
        onChange={onChange}
      />

      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        name="password"
        value={userForm.password}
        onChange={onChange}
      />

      <label htmlFor="confirmPassword">Confirm Password</label>
      <input
        id="confirmPassword"
        type="password"
        name="confirmPassword"
        value={userForm.confirmPassword}
        onChange={onChange}
      />

      <button type="submit">Update Information</button>
      {updateMessage && (
        <p style={{ marginTop: '10px', color: '#007700' }}>{updateMessage}</p>
      )}
    </form>
  </div>
);

export default ProfileUserTab;
