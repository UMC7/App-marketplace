// src/components/cv/candidate/sectionscomponents/experience/ShoreFields.js
import React from 'react';
import { ymFormatOnChange, ymNormalize } from './utils';
import { TERMS as TERMS_SRC } from '../../shared/experienceCatalogs';

const Opt = ({ value }) => <option value={value}>{value}</option>;

const SHORE_TERMS = (TERMS_SRC || []).filter(
  (t) => !/^crossing$/i.test(t) && !/^delivery$/i.test(t)
);

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

export default function ShoreFields({ editing, setEditing, mode = 'professional', showAllFields = false }) {
  const isLite = mode === 'lite';
  const isProfessional = mode === 'professional';
  const showRequired = !isProfessional;
  const showOptional = showAllFields ? true : !isLite;
  const showLiteLabels = mode === 'lite';
  const reqLabel = (text) => (showLiteLabels ? text : `${text} *`);
  const optLabel = (text) => (showLiteLabels ? `${text} (Optional)` : text);
  if (!editing || editing.type !== 'shore') return null;

  const missEmployer = !String(editing.vessel_or_employer || '').trim();
  const missRole = !String(editing.role || '').trim();
  const missContract = !String(editing.contract || '').trim();
  const missIndustry = !String(editing.vessel_type || '').trim();
  const missLocation = !String(editing.location_country || '').trim();
  const missStart = !String(editing.start_month || '').trim();
  const missEnd = !editing.is_current && !String(editing.end_month || '').trim();

  const remarksLen = (editing?.remarks || '').length;
  const remarksLabel = showLiteLabels
    ? `Remarks (${remarksLen}/200) (Optional)`
    : `Remarks (${remarksLen}/200)`;

  return (
    <>
      {showRequired ? (
        <>
          <div className="cp-row-exp-a">
            <div className={missEmployer ? 'cp-missing' : ''}>
              <label className="cp-label">{reqLabel('Employer / Company')}</label>
              <input
                className="cp-input"
                placeholder="e.g., Four Seasons, Nobu"
                value={editing.vessel_or_employer || ''}
                onChange={(e) => setEditing({ ...editing, vessel_or_employer: e.target.value })}
              />
            </div>

            <div className={missRole ? 'cp-missing' : ''}>
              <label className="cp-label">{reqLabel('Role / Rank')}</label>
              <input
                className="cp-input"
                placeholder="e.g., Head Chef, Front Desk Supervisor"
                value={editing.role || ''}
                onChange={(e) => setEditing({ ...editing, role: e.target.value })}
              />
            </div>

            <div className={missContract ? 'cp-missing' : ''}>
              <label className="cp-label">{reqLabel('Contract')}</label>
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

            <div className={missIndustry ? 'cp-missing' : ''}>
              <label className="cp-label">{reqLabel('Industry')}</label>
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

          <div className="cp-row-exp-a">
            <div className={missLocation ? 'cp-missing' : ''}>
              <label className="cp-label">{reqLabel('Location (country)')}</label>
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

            <div className={missStart ? 'cp-missing' : ''}>
              <label className="cp-label">{reqLabel('Start date')}</label>
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

            <div className={missEnd ? 'cp-missing' : ''}>
              <label className="cp-label">{reqLabel('End date')}</label>
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
      ) : null}

      {showOptional ? (
        <div className="cp-row-exp-a">
          <div>
            <label className="cp-label">{optLabel('Employees supervised')}</label>
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
        </div>
      ) : null}

      {showOptional ? (
        <div className="cp-row-exp-c">
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="cp-label">{remarksLabel}</label>
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
      ) : null}
    </>
  );
}
