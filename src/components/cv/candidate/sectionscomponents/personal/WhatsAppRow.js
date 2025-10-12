// src/components/cv/candidate/sectionscomponents/personal/WhatsAppRow.jsx
import React from 'react';

/**
 * WhatsAppRow
 * - "full" (default): mismo comportamiento que antes (título + toggle y, si aplica, CC/Number).
 * - "inline-toggle": SOLO el checkbox “same as phone” (sin título), para ubicarlo al final de la fila de Mobile/Number.
 * - "extra-fields": SOLO los inputs de CC y Number cuando waSame === false, para mostrarlos en la fila siguiente.
 */
export default function WhatsAppRow({
  waSame = true,
  onChangeWaSame,
  waCC = '',
  onChangeWaCC,
  waNum = '',
  onChangeWaNum,

  // NUEVO (opcional)
  variant = 'full', // 'full' | 'inline-toggle' | 'extra-fields'
}) {
  // --- Variante: solo el toggle inline (sin label "WhatsApp") ---
  if (variant === 'inline-toggle') {
    return (
      <label className="cp-wa-same">
        <input
          type="checkbox"
          checked={!!waSame}
          onChange={(e) => onChangeWaSame && onChangeWaSame(e.target.checked)}
        />
        <span className="cp-muted">same as phone</span>
      </label>
    );
  }

  // --- Variante: solo los campos extra debajo (si waSame === false) ---
  if (variant === 'extra-fields') {
    if (waSame) return null;
    return (
      <div className="cp-row-wa-extra">
        <div className="cp-field-cc">
          <span className="cp-prefix">+</span>
          <input
            className="cp-input"
            placeholder="34"
            value={waCC}
            onChange={(e) =>
              onChangeWaCC && onChangeWaCC(e.target.value.replace(/[^\d]/g, ''))
            }
            inputMode="numeric"
          />
        </div>

        <input
          className="cp-input"
          placeholder="612345678"
          value={waNum}
          onChange={(e) => onChangeWaNum && onChangeWaNum(e.target.value)}
        />
      </div>
    );
  }

  // --- Variante por defecto: comportamiento original (completo) ---
  return (
    <div>
      <label className="cp-label">WhatsApp</label>
      <div className="cp-row-wa">
        <label className="cp-wa-same">
          <input
            type="checkbox"
            checked={!!waSame}
            onChange={(e) => onChangeWaSame && onChangeWaSame(e.target.checked)}
          />
          <span className="cp-muted">same as phone</span>
        </label>

        {!waSame && (
          <>
            <div className="cp-field-cc">
              <span className="cp-prefix">+</span>
              <input
                className="cp-input"
                placeholder="34"
                value={waCC}
                onChange={(e) =>
                  onChangeWaCC && onChangeWaCC(e.target.value.replace(/[^\d]/g, ''))
                }
                inputMode="numeric"
              />
            </div>

            <input
              className="cp-input"
              placeholder="612345678"
              value={waNum}
              onChange={(e) => onChangeWaNum && onChangeWaNum(e.target.value)}
            />
          </>
        )}
      </div>
    </div>
  );
}