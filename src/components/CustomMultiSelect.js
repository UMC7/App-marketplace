import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';

const MOBILE_BREAKPOINT = 768;

const CustomMultiSelect = ({
  label,
  triggerId,
  open,
  onToggle,
  selected = [],
  renderSummary,
  groups = [],
  name,
  onChange,
  containerRef,
  caretSymbol = '?',
  searchPlaceholder = 'Search...',
}) => {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    window.addEventListener('resize', check);
    check();
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!open) {
      setSearchFilter('');
    }
  }, [open]);

  const summary = renderSummary
    ? renderSummary(selected)
    : selected.length > 0
      ? selected.join(', ')
      : 'Select...';

  const filteredGroups = useMemo(() => {
    if (!searchFilter || !searchFilter.trim()) return groups;
    const q = searchFilter.trim().toLowerCase();
    return groups
      .map((group) => ({
        ...group,
        options: (group.options || []).filter((opt) => String(opt).toLowerCase().includes(q)),
      }))
      .filter((group) => Array.isArray(group.options) && group.options.length > 0);
  }, [groups, searchFilter]);

  const renderOptions = (groupsToRender) =>
    groupsToRender.map((group) => (
      <React.Fragment key={group.label || group.options.join()}>
        <div style={{ marginBottom: 8 }}>
          {group.label && (
            <div style={{ fontWeight: 700, margin: '4px 0' }}>{group.label}</div>
          )}
          {group.options.map((opt) => (
            <label key={opt} className="form-checkbox-label">
              <input
                type="checkbox"
                name={name}
                value={opt}
                checked={selected.includes(opt)}
                onChange={onChange}
              />
              {opt}
            </label>
          ))}
        </div>
      </React.Fragment>
    ));

  const showAsModal = isMobile && open;
  const showDropdown = !isMobile && open;

  return (
    <>
      {label && <label htmlFor={triggerId}>{label}</label>}
      <div className={`custom-multiselect ${showDropdown ? 'open' : ''}`} ref={containerRef}>
        <button
          type="button"
          id={triggerId}
          className="multiselect-trigger"
          onClick={onToggle}
        >
          {summary}
          <span className={`caret ${open ? 'up' : ''}`} aria-hidden>{caretSymbol}</span>
        </button>

        {showDropdown && (
          <div className="multiselect-options">
            {renderOptions(groups)}
          </div>
        )}
      </div>

      {showAsModal && (
        <Modal onClose={onToggle} contentClassName="multiselect-modal">
          <div className="multiselect-modal-content">
            <h3 className="multiselect-modal-title">{label || 'Select...'}</h3>
            <input
              type="text"
              className="multiselect-modal-search"
              placeholder={searchPlaceholder}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              autoFocus
            />
            <div className="multiselect-modal-list">
              {renderOptions(filteredGroups)}
              {filteredGroups.length === 0 && (
                <div className="multiselect-modal-empty">No matches</div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default CustomMultiSelect;
