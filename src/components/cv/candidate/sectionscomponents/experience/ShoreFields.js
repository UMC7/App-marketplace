// src/components/cv/candidate/sectionscomponents/experience/ShoreFields.jsx
import React from 'react';
import { ymFormatOnChange, ymNormalize } from './utils';
import { TERMS as TERMS_SRC } from '../../shared/experienceCatalogs';

const Opt = ({ value }) => <option value={value}>{value}</option>;

/* ========= Catálogos locales (idénticos al original) ========= */
// SHORE_TERMS = TERMS sin “Crossing” ni “Delivery”
const SHORE_TERMS = (TERMS_SRC || []).filter(
  (t) => !/^crossing$/i.test(t) && !/^delivery$/i.test(t)
);

// Lista acotada de industrias relevantes para transición a yates
const INDUSTRIES = [
  'Hospitality',
  'Recreation & Tourism',
  'Catering / F&B',
  'Facilities / Maintenance',
  'Engineering',
  'Logistics',
  'Administration',
  'Security',
  'Retail',
  'IT / Systems',
  'Aviation',
  'Maritime Services',
  'Other',
];

// Lista de países (concisa pero útil)
const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina',
  'Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados',
  'Belarus','Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina',
  'Botswana','Brazil','Brunei','Bulgaria','Burkina Faso','Burundi','Cambodia','Cameroon',
  'Canada','Cape Verde','Central African Republic','Chad','Chile','China','Colombia',
  'Comoros','Congo, Democratic Republic of the','Congo, Republic of the','Costa Rica',
  "Cote d'Ivoire",'Croatia','Cuba','Cyprus','Czech Republic','Denmark','Djibouti',
  'Dominica','Dominican Republic','Ecuador','Egypt','El Salvador','Equatorial Guinea',
  'Eritrea','Estonia','Eswatini','Ethiopia','Fiji','Finland','France','Gabon','Gambia',
  'Georgia','Germany','Ghana','Greece','Grenada','Guatemala','Guinea','Guinea-Bissau',
  'Guyana','Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq',
  'Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kiribati',
  'Kosovo','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho','Liberia','Libya',
  'Liechtenstein','Lithuania','Luxembourg','Madagascar','Malawi','Malaysia','Maldives',
  'Mali','Malta','Marshall Islands','Mauritania','Mauritius','Mexico','Micronesia',
  'Moldova','Monaco','Mongolia','Montenegro','Morocco','Mozambique','Myanmar','Namibia',
  'Nauru','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Korea',
  'North Macedonia','Norway','Oman','Pakistan','Palau','Palestine','Panama',
  'Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal','Qatar',
  'Romania','Russia','Rwanda','Saint Kitts and Nevis','Saint Lucia',
  'Saint Vincent and the Grenadines','Samoa','San Marino','Sao Tome and Principe',
  'Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone','Singapore','Slovakia',
  'Slovenia','Solomon Islands','Somalia','South Africa','South Korea','South Sudan',
  'Spain','Sri Lanka','Sudan','Suriname','Sweden','Switzerland','Syria','Taiwan',
  'Tajikistan','Tanzania','Thailand','Timor-Leste','Togo','Tonga','Trinidad and Tobago',
  'Tunisia','Turkey','Turkmenistan','Tuvalu','Uganda','Ukraine','United Arab Emirates',
  'United Kingdom','United States','Uruguay','Uzbekistan','Vanuatu','Vatican City',
  'Venezuela','Vietnam','Yemen','Zambia','Zimbabwe'
];

/**
 * ShoreFields
 * Subformulario para experiencia "shore" (idéntico al original).
 *
 * Props:
 * - editing: objeto de edición
 * - setEditing: fn(next)
 */
export default function ShoreFields({ editing, setEditing }) {
  if (!editing || editing.type !== 'shore') return null;

  // Fila 1: Employer / Role / Contract / Industry
  // Fila 2: Employees supervised / Location (country) / Start / End (+ Current)
  return (
    <>
      {/* Fila 1 */}
      <div className="cp-row-exp-a">
        <div>
          <label className="cp-label">Employer / Company *</label>
          <input
            className="cp-input"
            placeholder="e.g., Four Seasons, Nobu"
            value={editing.vessel_or_employer || ''}
            onChange={(e) => setEditing({ ...editing, vessel_or_employer: e.target.value })}
          />
        </div>

        <div>
          <label className="cp-label">Role / Rank *</label>
          <input
            className="cp-input"
            placeholder="e.g., Head Chef, Front Desk Supervisor"
            value={editing.role || ''}
            onChange={(e) => setEditing({ ...editing, role: e.target.value })}
          />
        </div>

        <div>
          <label className="cp-label">Contract</label>
          <select
            className="cp-input"
            value={editing.contract || ''}
            onChange={(e) => setEditing({ ...editing, contract: e.target.value })}
          >
            <option value="">—</option>
            {SHORE_TERMS.map((c) => (
              <Opt key={c} value={c} />
            ))}
          </select>
        </div>

        <div>
          <label className="cp-label">Industry</label>
          <select
            className="cp-input"
            value={editing.vessel_type || ''}
            onChange={(e) => setEditing({ ...editing, vessel_type: e.target.value })}
          >
            <option value="">—</option>
            {INDUSTRIES.map((i) => (
              <Opt key={i} value={i} />
            ))}
          </select>
        </div>
      </div>

      {/* Fila 2 */}
      <div className="cp-row-exp-a">
        <div>
          <label className="cp-label">Employees supervised</label>
          <select
            className="cp-input"
            value={editing.supervisedBucket || ''}
            onChange={(e) => setEditing({ ...editing, supervisedBucket: e.target.value })}
          >
            <option value="">—</option>
            {['0', '<5', '<10', '10+'].map((v) => (
              <Opt key={v} value={v} />
            ))}
          </select>
        </div>

        <div>
          <label className="cp-label">Location (country)</label>
          <select
            className="cp-input"
            value={editing.location_country || ''}
            onChange={(e) => setEditing({ ...editing, location_country: e.target.value })}
          >
            <option value="">— Select country —</option>
            {COUNTRIES.map((c) => (
              <Opt key={c} value={c} />
            ))}
          </select>
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
          <label className="cp-label">End date</label>
          <input
            className="cp-input"
            placeholder="YYYY-MM"
            inputMode="numeric"
            maxLength={7}
            value={editing.is_current ? '' : editing.end_month || ''}
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
              id="exp-current-shore"
              type="checkbox"
              checked={!!editing.is_current}
              onChange={(e) => setEditing({ ...editing, is_current: e.target.checked })}
            />
            <label htmlFor="exp-current-shore">Current position</label>
          </div>
        </div>
      </div>
    </>
  );
}