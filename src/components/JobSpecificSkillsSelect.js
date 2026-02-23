// Job form: Specific skills — mismo catálogo que candidate profile, modal como Rank/Country
import React, { useState } from 'react';
import Modal from './Modal';
import { DEPT_SPECIALTIES_SUGGESTIONS } from './cv/candidate/sectionscomponents/preferencesskills/catalogs';
import './JobSpecificSkillsSelect.css';

const DEPARTMENTS = ['Deck', 'Engine', 'Interior', 'Galley', 'Others'];

export default function JobSpecificSkillsSelect({
  label = 'Specific skills:',
  value = [],
  onChange,
  containerRef: outerRef,
}) {
  const [dept, setDept] = useState('');
  const [open, setOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const groups = React.useMemo(() => {
    const raw = DEPT_SPECIALTIES_SUGGESTIONS[dept] || [];
    if (!Array.isArray(raw)) return [];
    if (raw.length && typeof raw[0] === 'string') {
      return [{ label: null, items: raw }];
    }
    return raw;
  }, [dept]);

  const filteredGroups = React.useMemo(() => {
    if (!searchFilter || !searchFilter.trim()) return groups;
    const q = searchFilter.trim().toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        items: (g.items || []).filter((s) => s.toLowerCase().includes(q)),
      }))
      .filter((g) => (g.items || []).length > 0);
  }, [groups, searchFilter]);

  const selectedSet = React.useMemo(() => new Set(Array.isArray(value) ? value : []), [value]);

  const toggle = (name) => {
    const next = new Set(selectedSet);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    onChange?.(Array.from(next));
  };

  const closeModal = () => {
    setOpen(false);
    setSearchFilter('');
  };

  const summary = value?.length > 0 ? `${value.length} selected` : 'Select specialty…';

  return (
    <div className="job-specific-skills" ref={outerRef}>
      {label && <label>{label}</label>}
      <div className="job-specific-skills-row">
        <div className="job-specific-skills-dept-wrapper">
          <select
            className="job-specific-skills-dept"
            value={dept}
          onChange={(e) => {
            setDept(e.target.value);
            setOpen(false);
          }}
        >
          <option value="">Select department…</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        </div>
        <div className="job-specific-skills-trigger-wrapper">
          <button
            type="button"
            className="rank-mobile-trigger job-specific-skills-trigger"
            disabled={!dept}
            onClick={() => dept && setOpen((v) => !v)}
          >
            <span>{summary}</span>
          </button>
          {open && dept && (
            <Modal onClose={closeModal} contentClassName="skill-select-modal">
              <div className="rank-modal-content">
                <h3 className="rank-modal-title">Specialty</h3>
                <input
                  type="text"
                  className="rank-modal-search"
                  placeholder="Search skill…"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  autoFocus
                />
                <div className="rank-modal-list">
                  {filteredGroups.length === 0 ? (
                    <div className="rank-modal-empty">No matches</div>
                  ) : (
                    filteredGroups.map(({ group, label, items }) => (
                      <div key={group || label || 'default'} className="rank-modal-group">
                        {(group || label) && <div className="rank-modal-group-label">{group || label}</div>}
                        {(items || []).map((s) => (
                          <label key={s} className="form-checkbox-label">
                            <input
                              type="checkbox"
                              checked={selectedSet.has(s)}
                              onChange={() => toggle(s)}
                            />
                            {s}
                          </label>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Modal>
          )}
        </div>
      </div>
    </div>
  );
}
