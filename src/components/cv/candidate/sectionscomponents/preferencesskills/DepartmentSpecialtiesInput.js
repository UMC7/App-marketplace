// src/components/cv/candidate/sectionscomponents/preferencesskills/DepartmentSpecialtiesInput.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DEPT_SPECIALTIES_SUGGESTIONS } from './catalogs';
import Modal from '../../../../Modal';

export default function DepartmentSpecialtiesInput({
  department = '',
  onChangeDepartment,
  value = [],
  onChange,
  showRequiredMark = true,
  isMobile = false,
}) {
  const isDeptControlled = typeof onChangeDepartment === 'function';
  const [localDept, setLocalDept] = useState(department || '');
  const dept = isDeptControlled ? department : localDept;

  const controlled = typeof onChange === 'function';
  const [localSelected, setLocalSelected] = useState(Array.isArray(value) ? value : []);
  const selected = useMemo(
    () => (Array.isArray(value) ? value : localSelected),
    [value, localSelected]
  );
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const [open, setOpen] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);

  const wrapRef = useRef(null);
  useEffect(() => {
    const onDocClick = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const groups = useMemo(() => {
    const key = String(dept || '').trim();
    const raw = DEPT_SPECIALTIES_SUGGESTIONS[key] || [];
    if (raw.length && typeof raw[0] === 'string') {
      return [{ group: null, items: raw }];
    }
    return raw;
  }, [dept]);

  const commit = (arr) => (controlled ? onChange?.(arr) : setLocalSelected(arr));
  const toggle = (name) => {
    const set = new Set(selected);
    if (set.has(name)) set.delete(name);
    else set.add(name);
    commit(Array.from(set));
  };

  const handleDeptChange = (next) => {
    if (isDeptControlled) onChangeDepartment?.(next);
    else setLocalDept(next);
    setOpen(false);
    setShowMobileModal(false);
  };

  const count = selected.length;
  const specialtyPlaceholder = count > 0 ? `${count} selected` : 'Select specialty…';
  const openSpecialtySelector = () => {
    if (!dept) return;
    if (isMobile) {
      setShowMobileModal(true);
    } else {
      setOpen((previous) => !previous);
    }
  };

  const closeMobileModal = () => setShowMobileModal(false);

  const renderSpecialtyOptions = () => {
    if (!groups || groups.length === 0) {
      return (
        <div className="cp-muted" style={{ padding: '6px 8px' }}>
          No specialties for this department.
        </div>
      );
    }
    return groups.map(({ group, items }) => (
      <div key={group || 'default'}>
        {group && (
          <div
            className="cp-muted"
            style={{
              fontSize: 12,
              padding: '6px 8px 2px',
              textTransform: 'uppercase',
              letterSpacing: 0.3,
            }}
          >
            {group}
          </div>
        )}
        {(items || []).map((s) => {
          const checked = selectedSet.has(s);
          return (
            <label
              key={s}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 8px',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(s)}
              />
              <span>{s}</span>
            </label>
          );
        })}
      </div>
    ));
  };

  return (
    <div ref={wrapRef}>
      <label className="cp-label">Specific skills {showRequiredMark ? '*' : ''} {dept ? `(${dept})` : ''}</label>

      {/* Disposición: Department | Specialty */}
      <div
        className="cp-row-exp-c__regions"
        style={{ gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 6 }}
      >
        {/* Department */}
        <select
          className="cp-input"
          value={dept}
          onChange={(e) => handleDeptChange(e.target.value)}
        >
          <option value="">Select department…</option>
          <option value="Deck">Deck</option>
          <option value="Engine">Engine</option>
          <option value="Interior">Interior</option>
          <option value="Galley">Galley</option>
          <option value="Others">Others</option>
        </select>

        {/* Specialty: select para desktop y modal en móvil */}
        <div style={{ position: 'relative' }}>
          {!isMobile && (
            <>
              <select
                className="cp-input"
                value="__placeholder"
                disabled={!dept}
                onChange={() => {}}
                onMouseDown={(e) => {
                  if (!dept) return;
                  e.preventDefault();
                  openSpecialtySelector();
                }}
              >
                <option value="__placeholder">{specialtyPlaceholder}</option>
              </select>

              {open && dept && (
                <div
                  role="listbox"
                  style={{
                    position: 'absolute',
                    zIndex: 20,
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: 4,
                    background: 'var(--input-bg)',
                    color: 'var(--text)',
                    border: '1px solid var(--input-bd)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow-soft)',
                    maxHeight: 260,
                    overflowY: 'auto',
                    padding: 6,
                  }}
                >
                  {renderSpecialtyOptions()}
                </div>
              )}
            </>
          )}

          {isMobile && (
            <>
              <button
                type="button"
                className="cp-input"
                disabled={!dept}
                onClick={openSpecialtySelector}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  minHeight: 40,
                }}
              >
                <span>{specialtyPlaceholder}</span>
                <span aria-hidden>v</span>
              </button>

              {showMobileModal && (
                <Modal onClose={closeMobileModal}>
                  <div style={{ maxWidth: 520 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>Specialties</strong>
                    </div>
                    <div style={{ marginTop: 16, maxHeight: 360, overflowY: 'auto' }}>
                      {renderSpecialtyOptions()}
                    </div>
                    <div className="cp-actions" style={{ marginTop: 20 }}>
                      <button type="button" className="landing-button" onClick={closeMobileModal}>
                        Done
                      </button>
                    </div>
                  </div>
                </Modal>
              )}
            </>
          )}
        </div>
      </div>

      {/* Ya no mostramos botón Add ni chips; la selección se gestiona sólo con los checkboxes del dropdown */}
    </div>
  );
}
