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
        <label className="cp-label" htmlFor="pd-first-name">
          First name <span aria-hidden="true">*</span>
        </label>
        <input
          id="pd-first-name"
          className="cp-input"
          value={firstName}
          onChange={(e) => onChangeFirstName && onChangeFirstName(e.target.value)}
          aria-required="true"
        />
      </div>

      <div>
        <label className="cp-label" htmlFor="pd-last-name">
          Last name <span aria-hidden="true">*</span>
        </label>
        <input
          id="pd-last-name"
          className="cp-input"
          value={lastName}
          onChange={(e) => onChangeLastName && onChangeLastName(e.target.value)}
          aria-required="true"
        />
      </div>
    </>
  );
}