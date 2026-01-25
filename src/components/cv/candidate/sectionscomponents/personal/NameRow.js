// src/components/cv/candidate/sectionscomponents/personal/NameRow.js
import React from 'react';

export default function NameRow({
  firstName = '',
  lastName = '',
  onChangeFirstName,
  onChangeLastName,
  showRequiredMark = true,
}) {
  // No contenedor grid aquí: el grid lo aporta el padre con rowTwoCols
  return (
    <>
      <div>
        <label className="cp-label" htmlFor="pd-first-name">
          First name {showRequiredMark ? <span aria-hidden="true">*</span> : null}
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
          Last name {showRequiredMark ? <span aria-hidden="true">*</span> : null}
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
