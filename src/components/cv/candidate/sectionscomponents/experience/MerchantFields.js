// src/components/cv/candidate/sectionscomponents/experience/MerchantFields.js
import React, { useMemo, useState } from 'react';
import {
  MERCHANT_DEPARTMENTS,
  getMerchantRanksForDept,
} from '../../shared/merchantRankData';
import {
  TERMS as TERMS_SRC,
  MERCHANT_VESSEL_TYPES as VESSEL_TYPES_SRC,
  REGIONS as REGIONS_SRC,
  shouldShowEnginePower,
} from '../../shared/merchantCatalogs';
import { ymFormatOnChange, ymNormalize } from './utils';

const TERMS = TERMS_SRC ?? [
  'Permanent',
  'Rotational',
  'Temporary',
  'Seasonal',
  'Relief',
  'Voyage / Project',
  'Cadetship / Training',
];

const VESSEL_TYPES = VESSEL_TYPES_SRC ?? [
  'Passenger / Ferry (Ro-Pax)',
  'Cargo (Container / Bulk / Tanker)',
  'Offshore / Supply / DP',
  'Tug',
  'Dredger',
  'Research / Survey',
  'Training / School Ship',
  'Government / Patrol',
  'Other',
];

const REGION_OPTIONS =
  REGIONS_SRC ??
  [
    'Worldwide',
    'Mediterranean',
    'Caribbean',
    'Atlantic',
    'Pacific',
    'Indian Ocean',
    'Red Sea',
    'Baltic',
    'North Sea',
    'Arctic',
    'Antarctic',
    'Middle East',
    'Southeast Asia',
    'US East Coast',
    'US West Coast',
    'Bahamas',
    'South Pacific',
    'Australia',
    'New Zealand',
    'Central America',
    'South America',
  ];

export default function MerchantFields({ editing, setEditing }) {
  // Hooks siempre arriba (regla de hooks)
  const [regionPick, setRegionPick] = useState('');
  const [remarksCount, setRemarksCount] = useState(
    () => (editing?.remarks ? String(editing.remarks).length : 0)
  );
  const MAX_REMARKS = 200;

  // NO condicionar hooks; solo el render
  const isActive = !!(editing && editing.type === 'merchant');

  const rankOptions = useMemo(() => {
    if (!editing?.department) return [];
    const list = getMerchantRanksForDept(editing.department) || [];
    const out = [...list];
    if (String(editing.department).toLowerCase() === 'other' && !out.includes('Other')) {
      out.push('Other');
    }
    return out;
  }, [editing?.department]);

  const techPowerVisible = shouldShowEnginePower(editing?.department);

  // Regions: add/remove
  const addRegion = () => {
    const r = regionPick;
    if (!r) return;
    if (r === 'Worldwide') {
      setEditing({ ...editing, regionsArr: ['Worldwide'] });
    } else {
      const set = new Set(editing.regionsArr || []);
      set.delete('Worldwide');
      set.add(r);
      setEditing({ ...editing, regionsArr: Array.from(set) });
    }
    setRegionPick('');
  };

  const removeRegion = (r) => {
    const set = new Set(editing.regionsArr || []);
    set.delete(r);
    setEditing({ ...editing, regionsArr: Array.from(set) });
  };

  // ---- Render (solo si es merchant) ----
  return isActive ? (
    <>
      {/* ROW A — Department, Rank (+other), Vessel, Vessel type */}
      <div className="cp-row-exp-a">
        <div>
          <label className="cp-label">Department *</label>
          <select
            className="cp-input"
            value={editing.department || ''}
            onChange={(e) =>
              setEditing({
                ...editing,
                department: e.target.value,
                role: '',
                role_other: '',
              })
            }
          >
            <option value="">Select...</option>
            {MERCHANT_DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="cp-label">Rank *</label>
          <select
            className="cp-input"
            value={editing.role || ''}
            disabled={!editing.department}
            onChange={(e) => setEditing({ ...editing, role: e.target.value })}
          >
            <option value="">Select...</option>
            {rankOptions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {String(editing.department).toLowerCase() === 'other' &&
            editing.role === 'Other' && (
              <input
                className="cp-input"
                style={{ marginTop: 8 }}
                placeholder="Write your rank…"
                value={editing.role_other || ''}
                onChange={(e) =>
                  setEditing({ ...editing, role_other: e.target.value })
                }
              />
            )}
        </div>

        <div>
          <label className="cp-label">Vessel *</label>
          <input
            className="cp-input"
            placeholder="M/V, R/V, Tug name…"
            value={editing.vessel_or_employer || ''}
            onChange={(e) =>
              setEditing({ ...editing, vessel_or_employer: e.target.value })
            }
          />
        </div>

        <div>
          <label className="cp-label">Vessel type *</label>
          <select
            className="cp-input"
            value={editing.vessel_type || ''}
            onChange={(e) =>
              setEditing({ ...editing, vessel_type: e.target.value })
            }
          >
            <option value="">Select...</option>
            {VESSEL_TYPES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ROW B — Length (m), GT, Engine power (solo Eng/Elect), Start date, End date + Current */}
      <div className="cp-row-exp-b">
        <div>
          <label className="cp-label">Company / Employer</label>
          <input
            className="cp-input"
            placeholder="Company or employer name"
            value={editing.employer_name || ''}
            onChange={(e) =>
              setEditing({ ...editing, employer_name: e.target.value })
            }
          />
        </div>
        <div>
          <label className="cp-label">Length (m)</label>
          <input
            className="cp-input"
            inputMode="numeric"
            placeholder="e.g., 120"
            value={editing.loa_m || editing.length_m || ''}
            onChange={(e) =>
              setEditing({ ...editing, loa_m: e.target.value, length_m: e.target.value })
            }
          />
        </div>

        <div>
          <label className="cp-label">GT</label>
          <input
            className="cp-input"
            inputMode="numeric"
            placeholder="e.g., 5000"
            value={editing.gt || ''}
            onChange={(e) => setEditing({ ...editing, gt: e.target.value })}
          />
        </div>

        {techPowerVisible && (
          <div>
            <label className="cp-label">Engine power</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 8 }}>
              <input
                className="cp-input"
                inputMode="numeric"
                placeholder="e.g., 20000"
                value={editing.powerValue || ''}
                onChange={(e) =>
                  setEditing({ ...editing, powerValue: e.target.value })
                }
              />
              <select
                className="cp-input"
                value={editing.powerUnit || 'HP'}
                onChange={(e) =>
                  setEditing({ ...editing, powerUnit: e.target.value })
                }
              >
                <option value="HP">HP</option>
                <option value="kW">kW</option>
              </select>
            </div>
          </div>
        )}

        <div>
          <label className="cp-label">Start date *</label>
          <input
            className="cp-input"
            placeholder="YYYY-MM"
            inputMode="numeric"
            maxLength={7}
            value={editing.start_month || ''}
            onChange={(e) => {
              const v = ymFormatOnChange(e.target.value);
              setEditing({ ...editing, start_month: v });
            }}
            onBlur={(e) => {
              const v = ymNormalize(e.target.value);
              setEditing({ ...editing, start_month: v });
            }}
          />
        </div>

        <div>
          <label className="cp-label">End date *</label>
          <input
            className="cp-input"
            placeholder="YYYY-MM"
            inputMode="numeric"
            maxLength={7}
            value={editing.is_current ? '' : editing.end_month || ''}
            disabled={!!editing.is_current}
            onChange={(e) => {
              const v = ymFormatOnChange(e.target.value);
              setEditing({ ...editing, end_month: v });
            }}
            onBlur={(e) => {
              if (editing.is_current) return;
              const v = ymNormalize(e.target.value);
              setEditing({ ...editing, end_month: v });
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <input
              id="merchant-current"
              type="checkbox"
              checked={!!editing.is_current}
              onChange={(e) =>
                setEditing({ ...editing, is_current: e.target.checked })
              }
            />
            <label htmlFor="merchant-current">Current position</label>
          </div>
        </div>
      </div>

      {/* ROW C — Terms, Regions, Remarks */}
      <div className="cp-row-exp-c">
        <div>
          <label className="cp-label">Terms *</label>
          <select
            className="cp-input"
            value={editing.contract || ''}
            onChange={(e) => setEditing({ ...editing, contract: e.target.value })}
          >
            <option value="">Select...</option>
            {TERMS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="cp-label">Regions *</label>
          <div className="cp-row-exp-c__regions">
            <select
              className="cp-input"
              value={regionPick}
              onChange={(e) => setRegionPick(e.target.value)}
            >
              <option value="">Select region...</option>
              {REGION_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <button type="button" className="cp-btn-add" onClick={addRegion}>
              Add
            </button>
          </div>

          {(editing.regionsArr || []).length > 0 && (
            <div className="cp-chips" style={{ marginTop: 8 }}>
              {(editing.regionsArr || []).map((r) => (
                <span key={r} className="cp-chip cp-chip--active">
                  {r}
                  <button
                    type="button"
                    className="cp-chip-x"
                    onClick={() => removeRegion(r)}
                    title="Remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Remarks ocupa toda la fila */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="cp-label">
            Remarks <span style={{ color: 'var(--muted)' }}>({remarksCount}/{MAX_REMARKS})</span>
          </label>
          <textarea
            className="cp-textarea"
            rows={2}
            maxLength={MAX_REMARKS}
            placeholder="Brief notes (max ~2 lines)"
            value={editing.remarks || ''}
            onChange={(e) => {
              const val = e.target.value ?? '';
              setRemarksCount(val.length);
              setEditing({ ...editing, remarks: val });
            }}
            style={{ lineHeight: 1.3 }}
          />
        </div>
      </div>
    </>
  ) : null;
}