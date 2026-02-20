// src/components/cv/candidate/cvsections/ExperienceSection.js
import React, { useEffect, useMemo, useState, useRef } from 'react';
import supabase from '../../../../supabase';
import { toast } from 'react-toastify';

import {
  YachtFields,
  ShoreFields,
  MerchantFields,
  ItemRow,
  EmploymentStatus,
  hideTechForRole,
  computeLongevityAvg
} from '../sectionscomponents/experience';

const emptyYacht = {
  type: 'yacht',

  department: '',
  role: '',
  role_other: '',
  vessel_or_employer: '',
  vessel_type: '',
  length_m: '',
  start_month: '',
  end_month: '',
  is_current: false,
  contract: '',
  use: '',
  regionsArr: [],
  yacht_brand: '',
  yacht_brand_other: '',
  yacht_model: '',
  management_name: '',
  propulsion: '',
  engine_make: '',
  crew_bucket: '',
  gt: '',
  powerValue: '',
  powerUnit: 'HP',
  crossings: '',
  yardPeriod: '',
  remarks: '',
  notes: null,
};

const emptyMerchant = {
  type: 'merchant',
  department: '',
  role: '',
  role_other: '',
  vessel_or_employer: '',
  vessel_type: '',
  loa_m: '',
  gt: '',
  start_month: '',
  end_month: '',
  is_current: false,
  contract: '',
  regionsArr: [],
  employer_name: '',   // <- NUEVO
  remarks: '',
  notes: null,
};

const emptyShore = {
  type: 'shore',
  contract: '',
  department: '',
  role: '',
  role_other: '',
  vessel_or_employer: '',
  vessel_type: '',
  start_month: '',
  end_month: '',
  is_current: false,
  regionsArr: [],
  location_country: '',
  supervisedBucket: '',
  remarks: '',
  notes: null,
};

function parseYearMonth(ym) {
  if (!ym) return { year: null, month: null };
  const [yStr, mStr] = String(ym).split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  return {
    year: Number.isFinite(y) ? y : null,
    month: Number.isFinite(m) ? m : null,
  };
}

function normalizeVesselType(v) {
  const s = String(v || '').toLowerCase();
  if (!s) return 'Other';
  if (s.includes('motor')) return 'Motor';
  if (s.includes('sail')) return 'Sail';
  if (s.includes('cat')) return 'Catamaran';
  if (s.includes('exped')) return 'Expedition';
  if (s === 'other' || s === 'others') return 'Other';
  return 'Other';
}

function normalizeMode(type, use, contract) {
  if (type === 'yacht') {
    const u = String(use || '').toLowerCase().trim();
    if (!u) return 'Other';
    if (u === 'private') return 'Private';
    if (u === 'charter') return 'Charter';
    if (u === 'private & charter' || u === 'private&charter' || u === 'dual') return 'Dual';
    if (u.includes('delivery')) return 'Delivery';
    if (u.includes('shipyard') || u === 'yard') return 'Shipyard';
    return 'Other';
  }

  return 'Other';
}

function compactOrEmpty(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    const isNumNaN = typeof v === 'number' && Number.isNaN(v);
    if (v === null || v === '' || isNumNaN) continue;
    out[k] = v;
  }
  return Object.keys(out).length ? out : {};
}

function formatYachtingExperienceLabel(totalMonths) {
  const m = Number(totalMonths || 0);
  if (!Number.isFinite(m) || m <= 0) return '0 months';
  if (m < 24) return `${m} month${m === 1 ? '' : 's'}`;
  const years = m / 12;
  const rounded = Math.round(years * 10) / 10;
  return `${rounded.toFixed(1)} years`;
}

function ymFrom(y, m) {
  if (!y) return '';
  const mm = String(m || 1).padStart(2, '0');
  return `${y}-${mm}`;
}

function mapDbVesselTypeToUi(v) {
  const s = String(v || '').toLowerCase();
  if (s === 'motor') return 'Motor Yacht';
  if (s === 'sail') return 'Sailing Yacht';
  if (s === 'catamaran') return 'Catamaran';
  if (s === 'expedition') return 'Expedition';
  return '';
}

function mapDbDepartmentToUi(d) {
  const s = String(d || '').trim().toLowerCase();
  if (s === 'engine' || s === 'eng') return 'Engineering';
  return d || '';
}

function dbRowToEditing(row) {
  const type = row?.kind || 'yacht';
  const extras = row?.extras || {};

  if (type === 'yacht') {
    return {
      id: row.id,
      type: 'yacht',
      department: mapDbDepartmentToUi(row.department),
      role: row.role || '',
      role_other: '',
      vessel_or_employer: row.vessel_name || '',
      vessel_type: mapDbVesselTypeToUi(row.vessel_type),
      length_m: row.loa_m ?? '',
      start_month: ymFrom(row.start_year, row.start_month),
      end_month: row.is_current ? '' : ymFrom(row.end_year, row.end_month),
      is_current: !!row.is_current,
      contract: extras.contract || '',
      use:
        row.mode === 'Private' ? 'Private' :
        row.mode === 'Charter' ? 'Charter' :
        row.mode === 'Dual' ? 'Private/Charter' : '',
      regionsArr: Array.isArray(row.regions) ? row.regions : [],

      yacht_brand: row.yacht_brand || '',
      yacht_brand_other: row.yacht_brand_other || '',
      yacht_model: row.yacht_model || '',
      management_name: row.management_name || '',

      propulsion: extras.propulsion || '',
      engine_make: extras.engine_make || '',
      crew_bucket: extras.crew_bucket || '',
      gt: row.gt ?? '',
      powerValue: extras.power_value ?? '',
      powerUnit: extras.power_unit || 'HP',
      crossings: extras.crossings || '',
      yardPeriod: extras.yard_period || '',
      remarks: row.notes || '',
      notes: row.notes || null,
    };
  }

  if (type === 'merchant') {
    return {
      id: row.id,
      type: 'merchant',
      department: mapDbDepartmentToUi(row.department),
      role: row.role || '',
      role_other: '',
      vessel_or_employer: row.vessel_name || '',
      vessel_type: row.vessel_type || '',
      length_m: row.loa_m ?? '',
      gt: row.gt ?? '',
      start_month: ymFrom(row.start_year, row.start_month),
      end_month: row.is_current ? '' : ymFrom(row.end_year, row.end_month),
      is_current: !!row.is_current,
      contract: (extras && extras.contract) || '',
      regionsArr: Array.isArray(row.regions) ? row.regions : [],
      powerValue: extras?.power_value ?? '',
      powerUnit: extras?.power_unit || 'HP',
      employer_name: extras?.employer_name || '',   // <- NUEVO
      remarks: row.notes || ''
    };
  }

  return {
    id: row.id,
    type: 'shore',
    contract: extras.contract || '',
    department: mapDbDepartmentToUi(row.department),
    role: row.role || '',
    role_other: '',
    vessel_or_employer: row.vessel_name || '',
    vessel_type: extras.industry || '',
    start_month: ymFrom(row.start_year, row.start_month),
    end_month: row.is_current ? '' : ymFrom(row.end_year, row.end_month),
    is_current: !!row.is_current,
    regionsArr: [],
    location_country: extras.location_country || '',
    supervisedBucket: extras.supervised_bucket || '',
    remarks: row.notes || '',
    notes: row.notes || null,
  };
}

export default function ExperienceSection({
  profileId,
  onCountChange,
  onProgressChange,
  targetForFull = 3,
  mode = 'professional',
  showAllFields = false,
  readOnly = false,
}) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const editBoxRef = useRef(null);
  const scrollEditorIntoView = () => {
    const el = editBoxRef.current;
    if (!el || typeof window === 'undefined') return;
    const target = el.querySelector('select, input, textarea') || el;
    const rect = target.getBoundingClientRect();
    const y = rect.top + window.scrollY;
    const header = document.querySelector('.navbar, .site-navbar, header');
    const headerHeight = header ? header.getBoundingClientRect().height : 96;
    const desktopOffset = headerHeight + 120;
    const mobileOffset = 104;
    const offset = window.innerWidth <= 768 ? mobileOffset : desktopOffset;

    window.scrollTo({
      top: Math.max(0, y - offset),
      behavior: 'smooth',
    });
  };

  const [yachtingMonths, setYachtingMonths] = useState(null);

  async function refreshYachtingMonths(pid) {
    try {
      const { data, error } = await supabase.rpc('rpc_yachting_months', { profile_uuid: pid });
      if (error) throw error;
      setYachtingMonths(typeof data === 'number' ? data : 0);
    } catch {
      setYachtingMonths(0);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setLoading(true);
      try {
        let pid = profileId || null;
        let prof = null;

        if (!pid) {
          const { data: profData, error: pe } = await supabase.rpc('rpc_create_or_get_profile');
          if (pe) throw pe;
          prof = profData || null;
          pid = profData?.id || null;
        }

        if (!pid) throw new Error('Profile not found.');

        if (!cancelled && prof) setProfile(prof);

        const { data: rows, error: re } = await supabase
          .from('profile_experiences')
          .select('*')
          .eq('profile_id', pid)
          .order('start_year', { ascending: false })
          .order('start_month', { ascending: false });

        if (re) throw re;
        if (!cancelled) {
          setItems(rows || []);
          await refreshYachtingMonths(pid);
        }
      } catch (e) {
        if (!cancelled) toast.error(e.message || 'Could not load experience.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  useEffect(() => {
    const count = Array.isArray(items) ? items.length : 0;

    if (typeof onCountChange === 'function') {
      try {
        onCountChange(count);
      } catch (_e) {
        /* no-op */
      }
    }

    const denom = Number.isFinite(targetForFull) && targetForFull > 0 ? targetForFull : 3;
    const progress = Math.max(0, Math.min(1, count / denom));

    if (typeof onProgressChange === 'function') {
      try {
        onProgressChange(progress);
      } catch (_e) {
        /* no-op */
      }
    }

    try {
      const evtCount = new CustomEvent('cv:experience-changed', {
        detail: { count, profileId: profileId || profile?.id || null },
      });
      window.dispatchEvent(evtCount);

      const evtProgress = new CustomEvent('cv:experience-progress', {
        detail: { progress, count, targetForFull: denom, profileId: profileId || profile?.id || null },
      });
      window.dispatchEvent(evtProgress);
    } catch (_e) {
      /* no-op */
    }
  }, [items, onCountChange, onProgressChange, targetForFull, profileId, profile?.id]);

  function startEdit(row) {
    if (readOnly) return;
    const obj = dbRowToEditing(row);
    setEditing(obj);
    setTimeout(scrollEditorIntoView, 0);
  }

  function startAdd() {
    if (readOnly) return;
    setEditing({ type: '' });
    setTimeout(scrollEditorIntoView, 0);
  }

  function cancelEditing() {
    setEditing(null);
  }

  function validateYacht(y) {
    if (!y.department) return 'Department is required.';
    if (!y.role || (y.role === 'Other' && !y.role_other?.trim())) return 'Rank is required.';
    if (!y.vessel_or_employer?.trim()) return 'Vessel is required.';
    if (!y.vessel_type) return 'Vessel type is required.';
    if (!y.length_m) return 'Length is required.';
    if (!y.start_month) return 'Start month is required.';
    if (!y.is_current && !y.end_month) return 'End month is required or mark Current.';
    if (!y.contract) return 'Terms is required.';
    if (!y.use) return 'Use is required.';
    if (!Array.isArray(y.regionsArr) || y.regionsArr.length === 0) return 'Regions is required.';
    return null;
  }

  async function saveEditing() {
    if (readOnly) return;
    const pid = profileId || profile?.id;
    if (!pid || !editing) return;

    if (editing.type === 'yacht') {
      const err = validateYacht(editing);
      if (err) return toast.error(err);

      const hideTech = hideTechForRole(editing.department);

      const roleToSave =
        editing.role === 'Other' && editing.role_other?.trim()
          ? editing.role_other.trim()
          : editing.role;

      const regionsArray = Array.isArray(editing.regionsArr)
        ? editing.regionsArr.filter((s) => String(s || '').trim() !== '')
        : null;

      const loa =
        editing.length_m !== '' ? parseFloat(String(editing.length_m).replace(',', '.')) : null;

      const { year: sYear, month: sMonth } = parseYearMonth(editing.start_month);
      const { year: eYear, month: eMonth } = parseYearMonth(editing.end_month);

      const extras = compactOrEmpty({
        propulsion: hideTech ? null : editing.propulsion || null,
        engine_make: hideTech ? null : editing.engine_make || null,
        power_value: hideTech ? null : editing.powerValue ? Number(editing.powerValue) : null,
        power_unit: hideTech ? null : editing.powerUnit || null,
        crossings: editing.crossings || null,
        yard_period: editing.yardPeriod || null,
        crew_bucket: editing.crew_bucket || null,
        contract: editing.contract || null,
      });

      const payload = {
        kind: editing.type || null,
        profile_id: pid,
        department: editing.department || null,
        role: roleToSave || null,
        vessel_name: editing.vessel_or_employer || null,
        vessel_type: normalizeVesselType(editing.vessel_type),
        loa_m: Number.isFinite(loa) ? loa : null,
        gt: hideTech ? null : editing.gt ? Number(editing.gt) : null,
        mode: normalizeMode('yacht', editing.use, editing.contract),
        regions: regionsArray && regionsArray.length ? regionsArray : null,
        start_year: sYear,
        start_month: sMonth,
        end_year: editing.is_current ? null : eYear,
        end_month: editing.is_current ? null : eMonth,
        is_current: !!editing.is_current,
        notes: editing.remarks?.trim() ? editing.remarks.trim() : null,
        extras,
        yacht_brand: editing.yacht_brand || null,
        yacht_brand_other:
          editing.yacht_brand === 'Other' && editing.yacht_brand_other?.trim()
            ? editing.yacht_brand_other.trim()
            : null,
        yacht_model: editing.yacht_model || null,
        management_name: editing.management_name || null,
      };

      try {
        const isUpdate = !!editing.id;
        const q = supabase.from('profile_experiences');
        const { data, error } = isUpdate
          ? await q.update(payload).eq('id', editing.id).select().single()
          : await q.insert(payload).select().single();
        if (error) throw error;

        setItems((prev) =>
          isUpdate ? prev.map((r) => (r.id === data.id ? data : r)) : [data, ...prev]
        );
        setEditing(null);
        toast.success(isUpdate ? 'Experience updated.' : 'Experience saved.');
        await refreshYachtingMonths(pid);
      } catch (e) {
        toast.error(e.message || 'Could not save experience.');
      }
      return;
    }

    if (editing.type === 'merchant') {
      // Validación
      if (!editing.department) return toast.error('Department is required.');
      if (!editing.role || (editing.role === 'Other' && !editing.role_other?.trim()))
        return toast.error('Rank is required.');
      if (!editing.vessel_or_employer?.trim()) return toast.error('Vessel is required.');
      if (!editing.vessel_type) return toast.error('Vessel type is required.');
      if (!editing.start_month) return toast.error('Start month is required.');
      if (!editing.is_current && !editing.end_month)
        return toast.error('End date is required or mark Current.');
      if (!editing.contract) return toast.error('Terms is required.');
      if (!Array.isArray(editing.regionsArr) || editing.regionsArr.length === 0)
        return toast.error('Regions is required.');

      const roleToSave =
        editing.role === 'Other' && editing.role_other?.trim()
          ? editing.role_other.trim()
          : editing.role;

      const regionsArray = Array.isArray(editing.regionsArr)
        ? editing.regionsArr.filter((s) => String(s || '').trim() !== '')
        : null;

      const loa =
        editing.length_m !== '' ? parseFloat(String(editing.length_m).replace(',', '.'))
        : editing.loa_m !== '' ? parseFloat(String(editing.loa_m).replace(',', '.'))
        : null;

      const { year: sYear, month: sMonth } = parseYearMonth(editing.start_month);
      const { year: eYear, month: eMonth } = parseYearMonth(editing.end_month);

      const extras = compactOrEmpty({
        contract: editing.contract || null,
        power_value: editing.powerValue ? Number(editing.powerValue) : null,
        power_unit: editing.powerUnit || null,
        employer_name: editing.employer_name || null,
      });

      const payload = {
        kind: editing.type || null,
        profile_id: pid,
        department: editing.department || null,
        role: roleToSave || null,
        vessel_name: editing.vessel_or_employer || null,
        vessel_type: editing.vessel_type || null,
        loa_m: Number.isFinite(loa) ? loa : null,
        gt: editing.gt ? Number(editing.gt) : null,
        mode: 'Other',
        regions: regionsArray && regionsArray.length ? regionsArray : null,
        start_year: sYear,
        start_month: sMonth,
        end_year: editing.is_current ? null : eYear,
        end_month: editing.is_current ? null : eMonth,
        is_current: !!editing.is_current,
        notes: editing.remarks?.trim() ? editing.remarks.trim() : null,
        extras,
      };

      try {
        const isUpdate = !!editing.id;
        const q = supabase.from('profile_experiences');
        const { data, error } = isUpdate
          ? await q.update(payload).eq('id', editing.id).select().single()
          : await q.insert(payload).select().single();
        if (error) throw error;

        setItems((prev) =>
          isUpdate ? prev.map((r) => (r.id === data.id ? data : r)) : [data, ...prev]
        );
        setEditing(null);
        toast.success(isUpdate ? 'Experience updated.' : 'Experience saved.');
        await refreshYachtingMonths(pid);
      } catch (e) {
        toast.error(e.message || 'Could not save experience.');
      }
      return;
    }

    if (editing.type === 'shore') {
      if (!editing.role?.trim()) return toast.error('Role / Rank is required.');
      if (!editing.vessel_or_employer?.trim())
        return toast.error('Employer / Company is required.');
      if (!editing.start_month) return toast.error('Start month is required.');

      const { year: sYear, month: sMonth } = parseYearMonth(editing.start_month);
      const { year: eYear, month: eMonth } = parseYearMonth(editing.end_month);
      const location = editing.location_country || '';
      const regionsArray = location ? [location] : null;

      const extras = compactOrEmpty({
        contract: editing.contract || null,
        industry: editing.vessel_type || null,
        supervised_bucket: editing.supervisedBucket || null,
        location_country: editing.location_country || null,
      });

      const payload = {
        kind: editing.type || null,
        profile_id: pid,
        department: editing.department || null,
        role: editing.role || null,
        vessel_name: editing.vessel_or_employer || null,
        vessel_type: 'Other',
        loa_m: null,
        gt: null,
        mode: normalizeMode('shore', null, editing.contract),
        regions: regionsArray,
        start_year: sYear,
        start_month: sMonth,
        end_year: editing.is_current ? null : eYear,
        end_month: editing.is_current ? null : eMonth,
        is_current: !!editing.is_current,
        notes: editing.remarks?.trim() ? editing.remarks.trim() : null,
        extras,
      };

      try {
        const isUpdate = !!editing.id;
        const q = supabase.from('profile_experiences');
        const { data, error } = isUpdate
          ? await q.update(payload).eq('id', editing.id).select().single()
          : await q.insert(payload).select().single();
        if (error) throw error;

        setItems((prev) =>
          isUpdate ? prev.map((r) => (r.id === data.id ? data : r)) : [data, ...prev]
        );
        setEditing(null);
        toast.success(isUpdate ? 'Experience updated.' : 'Experience saved.');
        await refreshYachtingMonths(pid);
      } catch (e) {
        toast.error(e.message || 'Could not save experience.');
      }
    }
  }

  const TypePicker = useMemo(() => {
    if (!editing) return null;
    return (
      <div className="cp-row-2" style={{ marginBottom: 10 }}>
        <div>
          <label className="cp-label">Experience type</label>
          <select
            className="cp-input"
            value={editing.type || ''}
            onChange={(e) => {
              const t = e.target.value;
              if (!t) return setEditing({ type: '' });
              if (t === 'yacht') return setEditing({ ...emptyYacht });
              if (t === 'merchant') return setEditing({ ...emptyMerchant });
              return setEditing({ ...emptyShore });
            }}
          >
            <option value="">— Select —</option>
            <option value="yacht">Yacht / Sea Service</option>
            <option value="merchant">Merchant / Commercial Vessels</option>
            <option value="shore">Shore-based / Other industries</option>
          </select>
        </div>
        <div />
      </div>
    );
  }, [editing]);

  const longevity = useMemo(
    () => computeLongevityAvg(items, { onlyYacht: true }),
    [items]
  );

  const summaryBoxStyle = {
    margin: '8px 0 12px',
    padding: '8px 12px',
    border: '1px dashed #334155',
    borderRadius: 8,
    background: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    boxSizing: 'border-box',
    width: '100%',
    textAlign: 'center',
  };

  async function handleDelete(row) {
    if (readOnly) return;
    const pid = profileId || profile?.id;
    if (!row?.id) return;
    try {
      const { error } = await supabase
        .from('profile_experiences')
        .delete()
        .eq('id', row.id);
      if (error) throw error;

      setItems((prev) => prev.filter((r) => r.id !== row.id));
      toast.success('Experience deleted.');
      if (pid) await refreshYachtingMonths(pid);
    } catch (e) {
      toast.error(e.message || 'Could not delete experience.');
    }
  }

  /* ---------------- Enable/disable Save based on required fields ---------------- */
  const isSaveEnabled = useMemo(() => {
    if (!editing || !editing.type) return false;

    const nonEmpty = (v) => String(v || '').trim() !== '';

    if (editing.type === 'yacht') {
      return (
        nonEmpty(editing.department) &&
        (nonEmpty(editing.role) && !(editing.role === 'Other' && !nonEmpty(editing.role_other))) &&
        nonEmpty(editing.vessel_or_employer) &&
        nonEmpty(editing.vessel_type) &&
        nonEmpty(editing.length_m) &&
        nonEmpty(editing.start_month) &&
        (editing.is_current || nonEmpty(editing.end_month)) &&
        nonEmpty(editing.contract) &&
        nonEmpty(editing.use) &&
        Array.isArray(editing.regionsArr) && editing.regionsArr.length > 0
      );
    }

    if (editing.type === 'merchant') {
      const hasLen = nonEmpty(editing.length_m) || nonEmpty(editing.loa_m);
      return (
        nonEmpty(editing.department) &&
        (nonEmpty(editing.role) && !(editing.role === 'Other' && !nonEmpty(editing.role_other))) &&
        nonEmpty(editing.vessel_or_employer) &&
        nonEmpty(editing.vessel_type) &&
        nonEmpty(editing.employer_name) && // requerido
        hasLen &&
        nonEmpty(editing.start_month) &&
        (editing.is_current || nonEmpty(editing.end_month)) &&
        nonEmpty(editing.contract) &&
        Array.isArray(editing.regionsArr) && editing.regionsArr.length > 0
      );
    }

    if (editing.type === 'shore') {
      return (
        nonEmpty(editing.vessel_or_employer) &&
        nonEmpty(editing.role) &&
        nonEmpty(editing.contract) &&
        nonEmpty(editing.vessel_type) && // Industry
        nonEmpty(editing.location_country) &&
        nonEmpty(editing.start_month) &&
        (editing.is_current || nonEmpty(editing.end_month))
      );
    }

    return false;
  }, [editing]);

  return (
    <div>
      <div className="cp-actions" style={{ marginBottom: 8 }}>
        {!editing && !readOnly && (
          <>
            <button className="cp-btn-add" onClick={startAdd}>
              + Add experience
            </button>
            {mode === 'lite' && (
              <span className="cp-muted" style={{ marginLeft: 10 }}>
                Min 1 experience
              </span>
            )}
          </>
        )}
      </div>

      {/* ====== FILA RESUMEN (DESKTOP: 3 columnas; MÓVIL: se apilan) ====== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 12,
          margin: '8px 0 12px',
          alignItems: 'stretch',
        }}
      >
        {/* Status actual de empleo */}
        <div style={summaryBoxStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
            <strong>Status:</strong>
            <EmploymentStatus items={items} loading={loading} label="" />
          </div>
        </div>

        {/* Yachting Experience */}
        {!loading && yachtingMonths !== null && (
          <div className="cp-summary" style={summaryBoxStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
              <strong>Yachting Experience:</strong>
              <span>{formatYachtingExperienceLabel(yachtingMonths)}</span>
            </div>
          </div>
        )}

        {/* Longevity promedio (solo yates) */}
        {!loading && (
          <div className="cp-summary" style={summaryBoxStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
              <strong>Longevity:</strong>
              <span>{longevity?.avgLabel || '0 months'} avg</span>
            </div>
          </div>
        )}
      </div>

      {editing && (
        <div
          ref={editBoxRef}
          style={{
            border: '1px solid var(--line)',
            borderRadius: 12,
            padding: 12,
            background: 'linear-gradient(180deg, var(--card), var(--card-2))', // <- tema
            marginBottom: 10,
          }}
        >
          {TypePicker}

          {/* Hasta elegir tipo no mostramos formularios */}
          {editing.type === 'yacht' && (
            <YachtFields
              editing={editing}
              setEditing={setEditing}
              mode={mode}
              showAllFields={showAllFields}
            />
          )}
          {editing.type === 'merchant' && (
            <MerchantFields
              editing={editing}
              setEditing={setEditing}
              mode={mode}
              showAllFields={showAllFields}
            />
          )}
          {editing.type === 'shore' && (
            <ShoreFields
              editing={editing}
              setEditing={setEditing}
              mode={mode}
              showAllFields={showAllFields}
            />
          )}

          {/* Acciones */}
          {editing.type && (
            <div className="cp-actions" style={{ marginTop: 12 }}>
              <button onClick={saveEditing} disabled={!isSaveEnabled}>Save</button>
              <button onClick={cancelEditing}>Cancel</button>
            </div>
          )}
        </div>
      )}

      {loading && <p className="cp-muted">Loading…</p>}

      {!loading && items.length === 0 && !editing && (
        <p className="cp-muted">No experience added yet.</p>
      )}

      {/* Tarjetas (3 por fila en desktop gracias al contenedor padre del perfil) */}
      {items.map((it) => (
        <ItemRow
          key={it.id}
          it={it}
          onEdit={readOnly ? undefined : startEdit}
          onDelete={readOnly ? undefined : handleDelete}
        />
      ))}
    </div>
  );
}
