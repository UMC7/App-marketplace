import React, { useState, useEffect } from 'react';
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
  caretSymbol = '▾',
}) => {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    window.addEventListener('resize', check);
    check();
    return () => window.removeEventListener('resize', check);
  }, []);

  const summary = renderSummary
    ? renderSummary(selected)
    : selected.length > 0
      ? selected.join(', ')
      : 'Select...';

  const renderOptions = () =>
    groups.map((group) => (
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
            {renderOptions()}
          </div>
        )}
      </div>

      {showAsModal && (
        <Modal onClose={onToggle}>
          <div className="multiselect-modal-content">
            <h3 className="multiselect-modal-title">{label || 'Select...'}</h3>
            {renderOptions()}
          </div>
        </Modal>
      )}
    </>
  );
};

export default CustomMultiSelect;