// src/components/cv/candidate/cvsections/PersonalDetailsSection.js
import React, { useEffect, useMemo, useState } from 'react';
import supabase from '../../../../supabase';
import { toast } from 'react-toastify';

// UI components & helpers from personal/
import {
  NameRow,
  EmailPhoneRow,
  WhatsAppRow,
  BirthNationalityRow,
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

export default function PersonalDetailsSection({ profile, onSaved }) {
  const [saving, setSaving] = useState(false);

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

  async function save(e) {
    e.preventDefault();
    if (!profile?.id) return;

    // validaciones mínimas
    if (!firstName.trim()) return toast.error('First name is required');
    if (!lastName.trim())  return toast.error('Last name is required');
    if (!email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return toast.error('Valid email is required');
    }
    if (!country)  return toast.error('Current country is required');

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
      {/* Row: First + Last name (padre provee el grid 1fr 1fr) */}
      <div style={rowTwoCols}>
        <NameRow
          firstName={firstName}
          lastName={lastName}
          onChangeFirstName={setFirstName}
          onChangeLastName={setLastName}
        />
      </div>

      {/* Band superior: 2 columnas
          - Izquierda: una fila con Gender + Email
          - Derecha: una fila con Mobile (CC) + Number + “WhatsApp same as phone”
            y, si waSame=false, debajo aparecen los campos extra de WhatsApp
      */}
      <EmailPhoneRow
        gender={gender}
        onChangeGender={setGender}
        email={email}
        onChangeEmail={setEmail}
        phoneCC={phoneCC}
        onChangePhoneCC={setPhoneCC}
        phoneNum={phoneNum}
        onChangePhoneNum={setPhoneNum}
        rightInline={
          <WhatsAppRow
            variant="inline-toggle"
            waSame={waSame}
            onChangeWaSame={setWaSame}
          />
        }
        rightBelow={
          <WhatsAppRow
            variant="extra-fields"
            waSame={waSame}
            onChangeWaSame={setWaSame}
            waCC={waCC}
            onChangeWaCC={setWaCC}
            waNum={waNum}
            onChangeWaNum={setWaNum}
          />
        }
      />

      {/* Row: Permanent residence + Current country + Current city/port + Communication preference */}
      <div className="cp-row-country">
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
          <label className="cp-label">Current country</label>
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
          <label className="cp-label">Current city / port</label>
          <input
            className="cp-input"
            value={cityPort}
            onChange={(e) => setCityPort(e.target.value)}
            placeholder="Palma de Mallorca"
          />
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

      {/* Row: Birth month + Birth year + Nationalities (select + Add) + Age indicator + Chips */}
      <BirthNationalityRow
        months={MONTHS}
        years={years}
        nationalitiesOptions={NATIONALITIES}
        birthMonth={birthMonth}
        onChangeBirthMonth={setBirthMonth}
        birthYear={birthYear}
        onChangeBirthYear={setBirthYear}
        natToAdd={natToAdd}
        onChangeNatToAdd={setNatToAdd}
        nationalities={nationalities}
        onAddNationality={addNationality}
        onRemoveNationality={removeNationality}
        ageLabel={ageLabel}
      />

      {/* Sociales: dos filas (Facebook+Instagram) y (LinkedIn+Website) */}
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

      {/* Toggles de visibilidad — siempre activos y bloqueados */}
      <VisibilityTogglesRow
        showAge={true}
        showEmail={true}
        showPhone={true}
      />

      {/* Actions */}
      <div className="cp-actions" style={{ marginTop: 12 }}>
        <button type="submit" disabled={saving}>Save</button>
      </div>
    </form>
  );
}