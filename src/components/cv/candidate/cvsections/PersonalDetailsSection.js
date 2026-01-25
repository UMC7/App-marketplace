// src/components/cv/candidate/cvsections/PersonalDetailsSection.js
import React, { useEffect, useMemo, useState } from 'react';
import supabase from '../../../../supabase';
import { toast } from 'react-toastify';

// UI components & helpers from personal/
import {
  WhatsAppRow,
  SocialLinksRow,
  VisibilityTogglesRow,
  buildYears,
  normalizePhone,
  normalizeUrl,
  calcAgeYears,
  rowTwoCols,
  MONTHS,
  COMM_PREFS,
  COUNTRIES,
  NATIONALITIES,
} from '../sectionscomponents/personal';

export default function PersonalDetailsSection({ profile, onSaved, mode = 'professional' }) {
  const [saving, setSaving] = useState(false);
  const isLite = mode === 'lite';
  const isProfessional = mode === 'professional';
  const showRequired = !isProfessional;
  const showOptional = !isLite;
  const showRequiredMark = !isLite;
  const reqLabel = (text) => (showRequiredMark ? `${text} *` : text);

  // Obligatorios
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [phoneCC, setPhoneCC]     = useState(''); // digits only
  const [phoneNum, setPhoneNum]   = useState('');

  // NEW: Gender
  const [gender, setGender]       = useState(''); // 'female' | 'male' | ''

  // Ubicación & comunicación
  const [residenceCountry, setResidenceCountry] = useState(''); // Permanent residence (opcional)
  const [country, setCountry]     = useState('');               // Current country
  const [cityPort, setCityPort]   = useState('');               // Current city/port
  const [commPref, setCommPref]   = useState('');               // Contact preference

  // Otros datos personales
  const [nationalities, setNationalities] = useState([]);
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear,  setBirthYear]  = useState('');

  // WhatsApp
  const [waSame, setWaSame]       = useState(true);
  const [waCC, setWaCC]           = useState(''); // digits only
  const [waNum, setWaNum]         = useState('');

  // Visibilidad (forzados SIEMPRE a true)
  const [showEmail, setShowEmail] = useState(true);
  const [showPhone, setShowPhone] = useState(true);
  const [showAge,   setShowAge]   = useState(true);

  // Sociales
  const [linkedin, setLinkedin]   = useState('');
  const [instagram, setInstagram] = useState(''); // handle
  const [facebook, setFacebook]   = useState('');
  const [website,  setWebsite]    = useState('');

  // UI auxiliar
  const [natToAdd, setNatToAdd]   = useState('');

  const years = useMemo(buildYears, []);
  const ageLabel = useMemo(() => calcAgeYears(birthMonth, birthYear), [birthMonth, birthYear]);

  useEffect(() => {
    if (!profile) return;

    // mapear desde DB (usando nombres REALES de columnas)
    setFirstName(profile.first_name || '');
    setLastName(profile.last_name || '');
    setEmail(profile.email_public || '');

    // guardamos solo dígitos en los CC; el "+" lo muestra el UI
    setPhoneCC(String(profile.phone_cc || '').replace(/[^\d]/g, ''));
    setPhoneNum(profile.phone_number || '');

    // NEW: gender from profile
    setGender(profile.gender || '');

    setWaSame(!!profile.whatsapp_same);
    setWaCC(String(profile.whatsapp_cc || '').replace(/[^\d]/g, ''));
    setWaNum(profile.whatsapp_number || '');

    // ubicación & comunicación
    setResidenceCountry(profile.residence_country || '');
    setCountry(profile.country || '');
    setCityPort(profile.city_port || '');
    setCommPref(profile.contact_pref || '');

    // nacionalidades y nacimiento
    const nats = Array.isArray(profile.nationalities) ? profile.nationalities : [];
    setNationalities([...new Set(nats)]); // evita claves duplicadas en chips
    setBirthMonth(profile.birth_month || '');
    setBirthYear(profile.birth_year || '');

    // visibilidad (FORZAR a true)
    setShowEmail(true);
    setShowPhone(true);
    setShowAge(true);

    // redes
    setLinkedin(profile.linkedin || '');
    setInstagram(profile.instagram || '');
    setFacebook(profile.facebook || '');
    setWebsite(profile.website || '');
  }, [profile]);

  function addNationality() {
    if (!natToAdd) return;
    if (nationalities.includes(natToAdd)) return;
    setNationalities([...nationalities, natToAdd]);
    setNatToAdd('');
  }
  function removeNationality(n) {
    setNationalities(nationalities.filter((x) => x !== n));
  }

  const isEmailValid = useMemo(
    () => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test((email || '').trim()),
    [email]
  );
  const hasPhoneCC = useMemo(
    () => String(phoneCC || '').replace(/\D/g, '').length > 0,
    [phoneCC]
  );
  const hasPhoneNum = useMemo(
    () => String(phoneNum || '').trim().length > 0,
    [phoneNum]
  );
  const isSectionComplete = useMemo(() => {
    if (!showRequired) return true;
    return Boolean(
      (firstName || '').trim() &&
      (lastName || '').trim() &&
      isEmailValid &&
      hasPhoneCC &&
      hasPhoneNum &&
      country &&
      (cityPort || '').trim() &&
      birthMonth &&
      birthYear &&
      Array.isArray(nationalities) &&
      nationalities.length > 0
    );
  }, [
    showRequired,
    firstName,
    lastName,
    isEmailValid,
    hasPhoneCC,
    hasPhoneNum,
    country,
    cityPort,
    birthMonth,
    birthYear,
    nationalities,
  ]);
  // ────────────────────────────────────────────────────────────────────────────

  async function save(e) {
    e.preventDefault();
    if (!profile?.id) return;

    // validaciones mínimas (mismo criterio que deshabilita el botón)
    if (showRequired) {
      if (!(firstName || '').trim()) return toast.error('First name is required');
      if (!(lastName || '').trim())  return toast.error('Last name is required');
      if (!isEmailValid) return toast.error('Valid email is required');
      if (!hasPhoneCC || !hasPhoneNum) return toast.error('Mobile phone (country code and number) is required');
      if (!country)  return toast.error('Current country is required');
      if (!(cityPort || '').trim()) return toast.error('Current city / port is required');
      if (!birthMonth) return toast.error('Birth month is required');
      if (!birthYear)  return toast.error('Birth year is required');
      if (!Array.isArray(nationalities) || nationalities.length === 0) {
        return toast.error('At least one nationality is required');
      }
    }

    const { cc: pcc, num: pnum } = normalizePhone(phoneCC, phoneNum);
    let wcc = waCC, wnum = waNum;
    if (waSame) {
      wcc = pcc;
      wnum = pnum;
    } else {
      const norm = normalizePhone(waCC, waNum);
      wcc = norm.cc; wnum = norm.num;
    }

    const payload = {
      first_name: firstName.trim() || null,
      last_name: lastName.trim() || null,
      email_public: email.trim() || null,
      phone_cc: pcc || null,
      phone_number: pnum || null,

      // NEW: gender persisted
      gender: gender || null,

      whatsapp_same: !!waSame,
      whatsapp_cc: wcc || null,
      whatsapp_number: wnum || null,

      residence_country: residenceCountry || null,       // permanent residence
      country: country || null,                           // current country
      city_port: (cityPort || '').trim() || null,        // current city/port
      nationalities: nationalities.length ? nationalities : null,

      birth_month: birthMonth ? Number(birthMonth) : null,
      birth_year:  birthYear ? Number(birthYear)  : null,
      show_age_public: true,        // 🔒 forzado

      contact_pref: commPref || null,
      show_email_public: true,      // 🔒 forzado
      show_phone_public: true,      // 🔒 forzado

      linkedin:  linkedin ? normalizeUrl(linkedin) : null,
      instagram: (instagram || '').trim() || null,
      facebook:  facebook ? normalizeUrl(facebook) : null,
      website:   website ? normalizeUrl(website)   : null,

      updated_at: new Date().toISOString(),
    };

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('public_profiles')
        .update(payload)
        .eq('id', profile.id)
        .select()
        .single();
      if (error) throw error;
      toast.success('Personal details saved');
      onSaved && onSaved(data);
    } catch (err) {
      toast.error(err.message || 'Could not save personal details');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="cp-form">
      {showRequired ? (
        <div className="cp-row-personal-1">
          <div>
            <label className="cp-label" htmlFor="pd-first-name">
              First name {showRequiredMark ? <span aria-hidden="true">*</span> : null}
            </label>
            <input
              id="pd-first-name"
              className="cp-input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
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
              onChange={(e) => setLastName(e.target.value)}
              aria-required="true"
            />
          </div>

          <div>
            <label className="cp-label" htmlFor="pd-email">
              Email {showRequiredMark ? <span aria-hidden="true">*</span> : null}
            </label>
            <input
              id="pd-email"
              className="cp-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              aria-required="true"
            />
          </div>
        </div>
      ) : null}

      {/* Desktop: name/email row, then phone + birth, then country/city/nationalities. */}
      {showRequired ? (
        <>
          <div className="cp-row-personal-2-wrap">
            <div className="cp-personal-phone">
              <div className="cp-phone-block">
                <div className="cp-right-phone-row cp-right-phone-row--inline">
                <div className="cp-cell-cc">
                  <label className="cp-label cp-nowrap" htmlFor="pd-phone-cc">
                    Mobile <span className="cp-cc-sub">(code) {showRequiredMark ? <span aria-hidden="true">*</span> : null}</span>
                  </label>
                  <div className="cp-field-cc">
                    <span className="cp-prefix">+</span>
                    <input
                      id="pd-phone-cc"
                      className="cp-input"
                      value={phoneCC}
                      onChange={(e) => setPhoneCC(e.target.value.replace(/[^\d]/g, ''))}
                      inputMode="numeric"
                      placeholder="34"
                      aria-required="true"
                    />
                  </div>
                </div>

                <div className="cp-cell-num">
                  <label className="cp-label" htmlFor="pd-phone-num">
                    Number {showRequiredMark ? <span aria-hidden="true">*</span> : null}
                  </label>
                  <input
                    id="pd-phone-num"
                    className="cp-input"
                    value={phoneNum}
                    onChange={(e) => setPhoneNum(e.target.value.replace(/[^\d]/g, ''))}
                    placeholder="612345678"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    aria-required="true"
                  />
                </div>

                <div className="cp-right-inline">
                  <span className="cp-label-inline">WhatsApp</span>
                  <WhatsAppRow
                    waSame={waSame}
                    onChangeWaSame={setWaSame}
                    variant="inline-toggle"
                  />
                </div>
                </div>
              </div>
            </div>

            {!waSame && (
              <div className="cp-personal-extra">
                <div className="cp-phone-block">
                  <WhatsAppRow
                    waSame={waSame}
                    onChangeWaSame={setWaSame}
                    waCC={waCC}
                    onChangeWaCC={setWaCC}
                    waNum={waNum}
                    onChangeWaNum={setWaNum}
                    variant="extra-fields"
                  />
                </div>
              </div>
            )}

            <div className="cp-personal-birth">
              <div className="cp-birth-block">
                <div>
                  <label className="cp-label" htmlFor="pd-birth-month">
                    Birth month {showRequiredMark ? <span aria-hidden="true">*</span> : null}
                  </label>
                  <select
                    id="pd-birth-month"
                    className="cp-input"
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(e.target.value)}
                    aria-required="true"
                  >
                    <option value="">—</option>
                    {MONTHS.map((m) => (
                      <option key={m.v} value={m.v}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="cp-label" htmlFor="pd-birth-year">
                    Birth year {showRequiredMark ? <span aria-hidden="true">*</span> : null}
                  </label>
                  <select
                    id="pd-birth-year"
                    className="cp-input"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    aria-required="true"
                  >
                    <option value="">—</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="cp-age-under-birth">
                  <span className="cp-muted">Age (auto): {ageLabel || '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
      {showRequired ? (
        <>
          <div className="cp-row-personal-3">
            <div>
              <label className="cp-label">{reqLabel('Current country')}</label>
              <select
                className="cp-input"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                <option value="">Select…</option>
                {COUNTRIES.map((c, idx) => (
                  <option key={`${c}-${idx}`} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="cp-label">{reqLabel('Current city / port')}</label>
              <input
                className="cp-input"
                value={cityPort}
                onChange={(e) => setCityPort(e.target.value)}
                placeholder="Palma de Mallorca"
              />
            </div>

            <div>
              <label className="cp-label" htmlFor="pd-nat-select">
                Nationalities {showRequiredMark ? <span aria-hidden="true">*</span> : null}
              </label>
              <div className="cp-row-add">
                <select
                  id="pd-nat-select"
                  className="cp-input"
                  value={natToAdd}
                  onChange={(e) => setNatToAdd(e.target.value)}
                  aria-required="true"
                >
                  <option value="">Select nationality…</option>
                  {NATIONALITIES.map((n, idx) => (
                    <option key={`${n}-${idx}`} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <button type="button" className="cp-btn-add" onClick={addNationality}>
                  Add
                </button>
              </div>
            </div>
          </div>

          {Array.isArray(nationalities) && nationalities.length > 0 && (
            <div className="cp-chips">
              {nationalities.map((n, idx) => (
                <span key={`${n}-${idx}`} className="cp-chip cp-chip--active">
                  {n}
                  <button
                    type="button"
                    className="cp-chip-x"
                    onClick={() => removeNationality(n)}
                  >
                    ✖
                  </button>
                </span>
              ))}
            </div>
          )}
        </>
      ) : null}

      {isLite ? (
        <>
          <div className="cp-subtitle" style={{ marginTop: 6 }}>
            Optionals
          </div>
          <div style={{ marginTop: 12 }}>
            <SocialLinksRow
              facebook={facebook}
              onChangeFacebook={setFacebook}
              instagram={instagram}
              onChangeInstagram={setInstagram}
              linkedin={linkedin}
              onChangeLinkedin={setLinkedin}
              website={website}
              onChangeWebsite={setWebsite}
            />
          </div>
          <VisibilityTogglesRow
            showAge={true}
            showEmail={true}
            showPhone={true}
          />
        </>
      ) : null}

      {showOptional ? (
        <>
          <div className="cp-row-personal-4">
            <div>
              <label className="cp-label" htmlFor="pd-gender-pro">Sex</label>
              <select
                id="pd-gender-pro"
                className="cp-input"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">Select…</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </div>

            <div>
              <label className="cp-label">Permanent residence (country)</label>
              <select
                className="cp-input"
                value={residenceCountry}
                onChange={(e) => setResidenceCountry(e.target.value)}
              >
                <option value="">Select…</option>
                {COUNTRIES.map((c, idx) => (
                  <option key={`${c}-${idx}`} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="cp-label">Communication preference</label>
              <select
                className="cp-input"
                value={commPref}
                onChange={(e) => setCommPref(e.target.value)}
              >
                <option value="">—</option>
                {COMM_PREFS.map((p, idx) => (
                  <option key={`${p}-${idx}`} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

        </>
      ) : null}

      {/* Actions */}
      <div className="cp-actions" style={{ marginTop: 12 }}>
        <button type="submit" disabled={saving || !isSectionComplete}>Save</button>
      </div>
    </form>
  );
}


