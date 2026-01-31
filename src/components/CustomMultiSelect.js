import React from 'react';

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
  const summary = renderSummary
    ? renderSummary(selected)
    : selected.length > 0
      ? selected.join(', ')
      : 'Select...';

  return (
    <>
      {label && <label htmlFor={triggerId}>{label}</label>}
      <div className={`custom-multiselect ${open ? 'open' : ''}`} ref={containerRef}>
        <button
          type="button"
          id={triggerId}
          className="multiselect-trigger"
          onClick={onToggle}
        >
          {summary}
          <span className={`caret ${open ? 'up' : ''}`} aria-hidden>{caretSymbol}</span>
        </button>

        <div className="multiselect-options">
          {groups.map((group) => (
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
          ))}
        </div>
      </div>
    </>
  );
};

export default CustomMultiSelect;