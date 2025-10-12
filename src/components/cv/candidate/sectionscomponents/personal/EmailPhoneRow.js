// src/components/cv/candidate/sectionscomponents/personal/EmailPhoneRow.js
import React from 'react';

/**
 * EmailPhoneRow
 * Visual layout:
 * - LEFT column: a single row with Gender + Email (side by side).
 * - RIGHT column: a single row with Mobile (CC) + Number + an inline area at the end
 *   (e.g., “WhatsApp same as phone”), plus an optional row **below** for extra fields.
 *
 * Backwards compatible: if `rightInline` / `rightBelow` are not provided, it behaves like before.
 */
export default function EmailPhoneRow({
  // NEW: gender
  gender = '', // 'male' | 'female' | ''
  onChangeGender,

  // Existing props (unchanged behavior)
  email = '',
  onChangeEmail,
  phoneCC = '',
  onChangePhoneCC,
  phoneNum = '',
  onChangePhoneNum,

  // NEW (optional) inline content at the end of the phone row (e.g., WhatsApp toggle)
  rightInline = null,
  // NEW (optional) content below the phone row (e.g., extra WhatsApp fields)
  rightBelow = null,
}) {
  const labelNowrap = { whiteSpace: 'nowrap' };

  return (
    <div className="cp-row-email">
      {/* LEFT COLUMN: one row with Gender + Email */}
      <div className="cp-col-left">
        <div className="cp-left-row">
          <div className="cp-cell-gender">
            <label className="cp-label">Gender</label>
            <select
              className="cp-input"
              value={gender}
              onChange={(e) => onChangeGender && onChangeGender(e.target.value)}
            >
              <option value="">Select…</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>

          <div className="cp-cell-email">
            <label className="cp-label">Email</label>
            <input
              className="cp-input"
              value={email}
              onChange={(e) => onChangeEmail && onChangeEmail(e.target.value)}
              placeholder="you@domain.com"
            />
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: one row with CC + Number + (inline area at end) */}
      <div className="cp-col-right">
        <div className="cp-right-phone-row">
          <div className="cp-cell-cc">
            <label className="cp-label" style={labelNowrap}>
              Mobile (country code)
            </label>
            <div className="cp-field-cc">
              <span className="cp-prefix">+</span>
              <input
                className="cp-input"
                value={phoneCC}
                onChange={(e) =>
                  onChangePhoneCC && onChangePhoneCC(e.target.value.replace(/[^\d]/g, ''))
                }
                inputMode="numeric"
                placeholder="34"
              />
            </div>
          </div>

          <div className="cp-cell-num">
            <label className="cp-label">Number</label>
            <input
              className="cp-input"
              value={phoneNum}
              onChange={(e) => onChangePhoneNum && onChangePhoneNum(e.target.value)}
              placeholder="612345678"
            />
          </div>

          {/* Inline area at the end of the row (e.g., “WhatsApp same as phone”) */}
          {rightInline ? (
            <div className="cp-right-inline">
              <span className="cp-label-inline">WhatsApp</span>
              {rightInline}
            </div>
          ) : null}
        </div>

        {/* Optional area below (e.g., extra WA fields when same=false) */}
        {rightBelow ? <div className="cp-right-below">{rightBelow}</div> : null}
      </div>
    </div>
  );
}