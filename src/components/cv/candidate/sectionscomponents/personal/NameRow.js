// src/components/cv/candidate/sectionscomponents/personal/NameRow.js
import React from 'react';

export default function NameRow({
  firstName = '',
  lastName = '',
  onChangeFirstName,
  onChangeLastName,
}) {
  // No contenedor grid aquí: el grid lo aporta el padre con rowTwoCols
  return (
    <>
      <div>
        <label className="cp-label">First name</label>
        <input
          className="cp-input"
          value={firstName}
          onChange={(e) => onChangeFirstName && onChangeFirstName(e.target.value)}
        />
      </div>

      <div>
        <label className="cp-label">Last name</label>
        <input
          className="cp-input"
          value={lastName}
          onChange={(e) => onChangeLastName && onChangeLastName(e.target.value)}
        />
      </div>
    </>
  );
}