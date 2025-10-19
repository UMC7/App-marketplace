// src/components/cv/candidate/sectionscomponents/experience/YachtFields.jsx
import React, { useMemo, useState } from 'react';
import { DEPARTMENTS, getRanksForDept } from '../../shared/rankData';
import {
  TERMS as TERMS_SRC,
  USES as USES_SRC,
  VESSEL_TYPES as VESSEL_TYPES_SRC,
  PROPULSION_TYPES as PROPULSION_TYPES_SRC,
  CREW_SIZE_BUCKETS as CREW_BUCKETS_SRC,
  REGIONS as REGIONS_SRC,
  getEngineBrandsForPropulsion,
} from '../../shared/experienceCatalogs';
import { hideTechForRole } from './helpers';
import { ymFormatOnChange, ymNormalize } from './utils';
// NUEVO: catálogo de marcas (yates ≥20 m + "Other")
import { ALL_YACHT_BRANDS } from '../../shared/yachtBrands';

/* ===========================================
   Catálogos (con fallback seguro)
=========================================== */
const TERMS = TERMS_SRC ?? [
  'Rotational',
  'Permanent',
  'Temporary',
  'Seasonal',
  'Relief',
  'Delivery',
  'Crossing',
  'DayWork',
];

const USES = USES_SRC ?? ['Private', 'Charter', 'Private/Charter'];

const VESSEL_TYPES = VESSEL_TYPES_SRC ?? [
  'Motor Yacht',
  'Sailing Yacht',
  'Catamaran',
  'Support / Shadow',
  'Expedition',
  'Chase Boat',
];

const PROPULSION_TYPES = PROPULSION_TYPES_SRC ?? [
  'Shaft Drive',
  'Waterjet',
  'Pod Drive',
  'Arneson Drive',
];

const CREW_SIZE_BUCKETS =
  CREW_BUCKETS_SRC ?? ['1', '2', '3', '4', '5-10', '10-15', '15-20', '>20'];

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

/**
 * YachtFields
 * Subformulario para experiencia de yates (idéntico al original + nuevos campos).
 *
 * Props:
 * - editing: objeto de edición
 * - setEditing: fn(next)
 */
export default function YachtFields({ editing, setEditing }) {
  // Hooks siempre al tope para cumplir la regla de hooks
  const [regionPick, setRegionPick] = useState('');

  const rankOptions = useMemo(() => {
    if (!editing?.department) return [];
    const list = getRanksForDept(editing.department) || [];
    const out = [...list];
    if (String(editing.department).toLowerCase() === 'others' && !out.includes('Other')) {
      out.push('Other');
    }
    return out;
  }, [editing?.department]);

  const hideTech = hideTechForRole(editing?.department); // Interior / Galley / Others
  const techDisabled = hideTech;

  if (!editing || editing.type !== 'yacht') return null;

  // Dropdown + Add para regiones
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

  const remarksLen = (editing?.remarks || '').length;

  return (
    <>
      {/* FILA A — Department, Rank, Vessel, Vessel type */}
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
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
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
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          {(['other', 'others'].includes(String(editing.department).toLowerCase())) &&
            editing.role === 'Other' && (
              <input
                className="cp-input"
                style={{ marginTop: 8 }}
                placeholder="Write your rank…"
                value={editing.role_other || ''}
                onChange={(e) => setEditing({ ...editing, role_other: e.target.value })}
              />
            )}
        </div>

        <div>
          <label className="cp-label">Vessel *</label>
          <input
            className="cp-input"
            placeholder="M/Y Ocean Star"
            value={editing.vessel_or_employer || ''}
            onChange={(e) => setEditing({ ...editing, vessel_or_employer: e.target.value })}
          />
        </div>

        <div>
          <label className="cp-label">Vessel type *</label>
          <select
            className="cp-input"
            value={editing.vessel_type || ''}
            onChange={(e) => setEditing({ ...editing, vessel_type: e.target.value })}
          >
            <option value="">Select...</option>
            {VESSEL_TYPES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* FILA A2 — Yacht brand, Yacht model, Management */}
      <div className="cp-row-exp-a">
        <div>
          <label className="cp-label">Yacht brand</label>
          <select
            className="cp-input"
            value={editing.yacht_brand || ''}
            onChange={(e) =>
              setEditing({
                ...editing,
                yacht_brand: e.target.value,
                yacht_brand_other: '', // reset si cambia
              })
            }
          >
            <option value="">Select...</option>
            {ALL_YACHT_BRANDS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          {editing.yacht_brand === 'Other' && (
            <input
              className="cp-input"
              style={{ marginTop: 8 }}
              placeholder="Write the brand…"
              value={editing.yacht_brand_other || ''}
              onChange={(e) => setEditing({ ...editing, yacht_brand_other: e.target.value })}
            />
          )}
        </div>

        <div>
          <label className="cp-label">Yacht model</label>
          <input
            className="cp-input"
            placeholder="e.g., 110/SL96/SD92/550 S"
            value={editing.yacht_model || ''}
            onChange={(e) => setEditing({ ...editing, yacht_model: e.target.value })}
          />
        </div>

        <div>
          <label className="cp-label">Management</label>
          <input
            className="cp-input"
            placeholder="Company name — leave blank if none"
            value={editing.management_name || ''}
            onChange={(e) => setEditing({ ...editing, management_name: e.target.value })}
          />
        </div>
      </div>

      {/* FILA B — Length, GT, Engine power, Start date, End date (+ Current) */}
      <div className="cp-row-exp-b">
        <div>
          <label className="cp-label">Length (m) *</label>
          <input
            className="cp-input"
            inputMode="numeric"
            placeholder="e.g., 55"
            value={editing.length_m || ''}
            onChange={(e) => setEditing({ ...editing, length_m: e.target.value })}
          />
        </div>

        <div className={techDisabled ? 'cp-soft-disabled' : ''}>
          <label className={`cp-label${techDisabled ? ' cp-label--disabled' : ''}`}>GT</label>
          <input
            className="cp-input"
            inputMode="numeric"
            placeholder="e.g., 750"
            value={editing.gt || ''}
            onChange={(e) => setEditing({ ...editing, gt: e.target.value })}
            disabled={techDisabled}
            aria-disabled={techDisabled}
            data-softdisabled={techDisabled ? '1' : undefined}
          />
        </div>

        <div className={techDisabled ? 'cp-soft-disabled' : ''}>
          <label className={`cp-label${techDisabled ? ' cp-label--disabled' : ''}`}>Engine power</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 8 }}>
            <input
              className="cp-input"
              inputMode="numeric"
              placeholder="e.g., 2000"
              value={editing.powerValue || ''}
              onChange={(e) => setEditing({ ...editing, powerValue: e.target.value })}
              disabled={techDisabled}
              aria-disabled={techDisabled}
              data-softdisabled={techDisabled ? '1' : undefined}
            />
            <select
              className="cp-input"
              value={editing.powerUnit || 'HP'}
              onChange={(e) => setEditing({ ...editing, powerUnit: e.target.value })}
              disabled={techDisabled}
              aria-disabled={techDisabled}
              data-softdisabled={techDisabled ? '1' : undefined}
            >
              <option value="HP">HP</option>
              <option value="kW">kW</option>
            </select>
          </div>
        </div>

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
            value={editing.is_current ? '' : (editing.end_month || '')}
            disabled={editing.is_current}
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
              id="exp-current"
              type="checkbox"
              checked={!!editing.is_current}
              onChange={(e) => setEditing({ ...editing, is_current: e.target.checked })}
            />
            <label htmlFor="exp-current">Current position</label>
          </div>
        </div>
      </div>

      {/* FILA C — Use, Terms, Regions (picker+add), Crew size */}
      <div className="cp-row-exp-c">
        <div>
          <label className="cp-label">Use *</label>
          <select
            className="cp-input"
            value={editing.use || ''}
            onChange={(e) => setEditing({ ...editing, use: e.target.value })}
          >
            <option value="">Select...</option>
            {USES.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="cp-label">Terms *</label>
          <select
            className="cp-input"
            value={editing.contract || ''}
            onChange={(e) => setEditing({ ...editing, contract: e.target.value })}
          >
            <option value="">Select...</option>
            {TERMS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="cp-label">Crew size</label>
          <select
            className="cp-input"
            value={editing.crew_bucket || ''}
            onChange={(e) => setEditing({ ...editing, crew_bucket: e.target.value })}
          >
            <option value="">Select...</option>
            {CREW_SIZE_BUCKETS.map((b) => (
              <option key={b} value={b}>{b}</option>
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
                <option key={r} value={r}>{r}</option>
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
      </div>

      {/* FILA D — Propulsion, Engine brand, Ocean crossings, Yard period */}
      <div className="cp-row-exp-d" style={{ marginTop: 10 }}>
        <div className={techDisabled ? 'cp-soft-disabled' : ''}>
          <label className={`cp-label${techDisabled ? ' cp-label--disabled' : ''}`}>Propulsion Type</label>
          <select
            className="cp-input"
            value={editing.propulsion || ''}
            onChange={(e) =>
              setEditing({
                ...editing,
                propulsion: e.target.value,
                engine_make: '',
              })
            }
            disabled={techDisabled}
            aria-disabled={techDisabled}
            data-softdisabled={techDisabled ? '1' : undefined}
          >
            <option value="">Select...</option>
            {PROPULSION_TYPES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className={techDisabled ? 'cp-soft-disabled' : ''}>
          <label className={`cp-label${techDisabled ? ' cp-label--disabled' : ''}`}>Engine brand</label>
          <select
            className="cp-input"
            value={editing.engine_make || ''}
            onChange={(e) => setEditing({ ...editing, engine_make: e.target.value })}
            disabled={techDisabled}
            aria-disabled={techDisabled}
            data-softdisabled={techDisabled ? '1' : undefined}
          >
            <option value="">Select...</option>
            {getEngineBrandsForPropulsion(editing.propulsion).map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="cp-label">Ocean crossings</label>
          <select
            className="cp-input"
            value={editing.crossings || ''}
            onChange={(e) => setEditing({ ...editing, crossings: e.target.value })}
          >
            <option value="">Select...</option>
            {['0', '1', '2', '3', '4', '5+'].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="cp-label">Yard period (months)</label>
          <select
            className="cp-input"
            value={editing.yardPeriod || ''}
            onChange={(e) => setEditing({ ...editing, yardPeriod: e.target.value })}
          >
            <option value="">Select...</option>
            {['None', '1–2', '3–5', '6–11', '12+'].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ===== NUEVO: Remarks (igual estilo que Merchant) ===== */}
      <div className="cp-row-exp-c">
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="cp-label">
            {`Remarks (${remarksLen}/200)`}
          </label>
          <textarea
            className="cp-textarea"
            rows="2"
            maxLength={200}
            placeholder="Brief notes (max ~2 lines)"
            value={editing.remarks || ''}
            onChange={(e) =>
              setEditing({
                ...editing,
                remarks: e.target.value.slice(0, 200),
              })
            }
            style={{ lineHeight: 1.3 }}
          />
        </div>
      </div>
    </>
  );
}