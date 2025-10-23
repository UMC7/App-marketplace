// src/components/cv/candidate/sectionscomponents/personal/EmailPhoneRow.js
import React from 'react';

export default function EmailPhoneRow({
  gender = '',
  onChangeGender,

  email = '',
  onChangeEmail,
  phoneCC = '',
  onChangePhoneCC,
  phoneNum = '',
  onChangePhoneNum,

  rightInline = null,
  rightBelow = null,
}) {
  return (
    <div className="cp-row-email">
      <div className="cp-col-left">
        <div className="cp-left-row">
          <div className="cp-cell-gender">
            <label className="cp-label" htmlFor="pd-gender">Gender</label>
            <select
              id="pd-gender"
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
            <label className="cp-label" htmlFor="pd-email">
              Email <span aria-hidden="true">*</span>
            </label>
            <input
              id="pd-email"
              className="cp-input"
              value={email}
              onChange={(e) => onChangeEmail && onChangeEmail(e.target.value)}
              placeholder="you@domain.com"
              aria-required="true"
            />
          </div>
        </div>
      </div>

      <div className="cp-col-right">
        <div className="cp-right-phone-row">
          <div className="cp-cell-cc">
            <label className="cp-label cp-nowrap" htmlFor="pd-phone-cc">
              Mobile <span className="cp-cc-sub">(code) <span aria-hidden="true">*</span></span>
            </label>
            <div className="cp-field-cc">
              <span className="cp-prefix">+</span>
              <input
                id="pd-phone-cc"
                className="cp-input"
                value={phoneCC}
                onChange={(e) =>
                  onChangePhoneCC && onChangePhoneCC(e.target.value.replace(/[^\d]/g, ''))
                }
                inputMode="numeric"
                placeholder="34"
                aria-required="true"
              />
            </div>
          </div>

          <div className="cp-cell-num">
            <label className="cp-label" htmlFor="pd-phone-num">
              Number <span aria-hidden="true">*</span>
            </label>
            <input
              id="pd-phone-num"
              className="cp-input"
              value={phoneNum}
              onChange={(e) => onChangePhoneNum && onChangePhoneNum(e.target.value)}
              placeholder="612345678"
              aria-required="true"
            />
          </div>

          {rightInline ? (
            <div className="cp-right-inline">
              <span className="cp-label-inline">WhatsApp</span>
              {rightInline}
            </div>
          ) : null}
        </div>

        {rightBelow ? <div className="cp-right-below">{rightBelow}</div> : null}
      </div>
    </div>
  );
}