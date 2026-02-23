import React, { useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import Modal from './Modal';
import { DEPARTMENT_RANK_GROUPS } from './cv/candidate/shared/rankData';

const MOBILE_BREAKPOINT = 768;

function FilterableRankSelect({
  name,
  value,
  onChange,
  className,
  required,
  optionGroups = DEPARTMENT_RANK_GROUPS,
  promptText = 'Select...',
  modalTitle = 'Rank',
  searchPlaceholder = 'Search...',
  ...rest
}) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    window.addEventListener('resize', check);
    check();
    return () => window.removeEventListener('resize', check);
  }, []);

  const options = useMemo(() => optionGroups.map((group) => ({
    label: group.label,
    options: group.ranks.map((rank) => ({ value: rank, label: rank })),
  })), [optionGroups]);

  const selectedOption = value
    ? { value, label: value }
    : null;

  const handleChange = (option) => {
    const event = {
      target: { name, value: option?.value ?? '' },
    };
    onChange?.(event);
  };

  const filterOption = (candidate, inputValue) => {
    if (!inputValue || !inputValue.trim()) return true;
    const search = inputValue.trim().toLowerCase();
    return candidate.label.toLowerCase().includes(search);
  };

  const filterRankGroups = useMemo(() => {
    if (!searchFilter || !searchFilter.trim()) return optionGroups;
    const q = searchFilter.trim().toLowerCase();
    return optionGroups.map((group) => ({
      label: group.label,
      ranks: group.ranks.filter((rank) => rank.toLowerCase().includes(q)),
    })).filter((g) => g.ranks.length > 0);
  }, [optionGroups, searchFilter]);

  const selectRank = (rank) => {
    handleChange({ value: rank, label: rank });
    setModalOpen(false);
    setSearchFilter('');
  };

  const summary = value || promptText;

  if (isMobile) {
    return (
      <>
        <input type="hidden" name={name} value={value || ''} required={required} />
        <div className={`filterable-rank-select-container rank-mobile-trigger-wrapper ${className || ''}`}>
          <button
            type="button"
            className="rank-mobile-trigger"
            onClick={() => setModalOpen(true)}
          >
            <span>{summary}</span>
          </button>
        </div>
        {modalOpen && (
          <Modal onClose={() => { setModalOpen(false); setSearchFilter(''); }}>
            <div className="rank-modal-content">
              <h3 className="rank-modal-title">{modalTitle}</h3>
              <input
                type="text"
                className="rank-modal-search"
                placeholder={searchPlaceholder}
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                autoFocus
              />
              <div className="rank-modal-list">
                {!required && (
                  <button
                    type="button"
                    className="rank-modal-option"
                    onClick={() => selectRank('')}
                  >
                    — Clear —
                  </button>
                )}
                {filterRankGroups.map((group) => (
                  <div key={group.label} className="rank-modal-group">
                    <div className="rank-modal-group-label">{group.label}</div>
                    {group.ranks.map((rank) => (
                      <button
                        key={rank}
                        type="button"
                        className={`rank-modal-option ${value === rank ? 'selected' : ''}`}
                        onClick={() => selectRank(rank)}
                      >
                        {rank}
                      </button>
                    ))}
                  </div>
                ))}
                {filterRankGroups.length === 0 && (
                  <div className="rank-modal-empty">No matches</div>
                )}
              </div>
            </div>
          </Modal>
        )}
      </>
    );
  }

  return (
    <>
      <input type="hidden" name={name} value={value || ''} required={required} />
      <Select
        value={selectedOption}
        onChange={handleChange}
        options={options}
        filterOption={filterOption}
        isClearable={!required}
        placeholder={promptText}
        isSearchable
        classNamePrefix="filterable-rank-select"
        className={`filterable-rank-select-container ${className || ''}`}
        styles={{
          control: (base) => ({ ...base, minHeight: '38px' }),
        }}
        {...rest}
      />
    </>
  );
}

export default FilterableRankSelect;
