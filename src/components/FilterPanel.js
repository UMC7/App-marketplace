import React from 'react';

const FilterPanel = React.forwardRef(({
  filters,
  setFilters,
  toggleMultiSelect,
  toggleRegionCountries,
  regionOrder,
  countriesByRegion,
}, ref) => {
  const safeFilters = filters || {};
  const countryValues = safeFilters.country || [];
  const languageValues = safeFilters.languages || [];
  const termValues = safeFilters.terms || [];

  return (
    <div ref={ref} className="filter-body expanded">
      <div className="filters-container filters-panel show" style={{ marginBottom: '20px' }}>
        <h3 style={{ gridColumn: '1 / -1' }}>Job Filters</h3>

        {/* Team */}
        <select
          className="category-select"
          value={safeFilters.team || ''}
          onChange={(e) => setFilters({ ...safeFilters, team: e.target.value })}
        >
          <option value="">Team?</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>

        {/* Position */}
        <input
          type="text"
          className="search-input"
          placeholder="Position"
          value={safeFilters.rank || ''}
          onChange={(e) => setFilters({ ...safeFilters, rank: e.target.value })}
        />

        {/* Department */}
        <select
          className="category-select"
          value={safeFilters.department || ''}
          onChange={(e) => setFilters({ ...safeFilters, department: e.target.value })}
        >
          <option value="">Department</option>
          <option value="Deck">Deck</option>
          <option value="Engine">Engine</option>
          <option value="Interior">Interior</option>
          <option value="Galley">Galley</option>
          <option value="Shore-based">Shore-based</option>
          <option value="Others">Others</option>
        </select>

        {/* Yacht Type */}
        <select
          className="category-select"
          value={safeFilters.yachtType || ''}
          onChange={(e) => setFilters({ ...safeFilters, yachtType: e.target.value })}
        >
          <option value="">Yacht Type</option>
          <option value="Motor Yacht">Motor Yacht</option>
          <option value="Sailing Yacht">Sailing Yacht</option>
          <option value="Chase Boat">Chase Boat</option>
          <option value="Sailing Catamaran">Sailing Catamaran</option>
          <option value="Motor Catamaran">Motor Catamaran</option>
          <option value="Support Yacht">Support Yacht</option>
          <option value="Expedition Yacht">Expedition Yacht</option>
        </select>

        {/* Size */}
        <select
          className="category-select"
          value={safeFilters.yachtSize || ''}
          onChange={(e) => setFilters({ ...safeFilters, yachtSize: e.target.value })}
        >
          <option value="">Size</option>
          <option value="0 - 30m">0 - 30m</option>
          <option value="31 - 40m">31 - 40m</option>
          <option value="41 - 50m">41 - 50m</option>
          <option value="51 - 70m">51 - 70m</option>
          <option value="71 - 100m">71 - 100m</option>
          <option value={'>100m'}>&gt;100m</option>
        </select>

        {/* Use */}
        <select
          className="category-select"
          value={safeFilters.use || ''}
          onChange={(e) => setFilters({ ...safeFilters, use: e.target.value })}
        >
          <option value="">Use</option>
          <option value="Private">Private</option>
          <option value="Charter (only)">Charter (only)</option>
          <option value="Private/Charter">Private/Charter</option>
        </select>

        {/* Flag */}
        <select
          className="category-select"
          value={safeFilters.flag || ''}
          onChange={(e) => setFilters({ ...safeFilters, flag: e.target.value })}
        >
          <option value="">Flag</option>
          <option value="Foreign Flag">Foreign Flag</option>
          <option value="United States">United States</option>
          <option value="Monaco">Monaco</option>
        </select>

        {/* Salary From */}
        <input
          type="number"
          className="search-input"
          placeholder="Salary From"
          value={safeFilters.minSalary || ''}
          onChange={(e) => setFilters({ ...safeFilters, minSalary: e.target.value })}
        />

        {/* City */}
        <input
          type="text"
          className="search-input"
          placeholder="City"
          value={safeFilters.city || ''}
          onChange={(e) => setFilters({ ...safeFilters, city: e.target.value })}
        />

        {/* Country (full width) */}
        <details style={{ gridColumn: '1 / -1' }}>
          <summary style={{ fontWeight: 'bold', cursor: 'pointer' }}>Country</summary>
          <div style={{ marginTop: '8px', maxHeight: '300px', overflowY: 'auto' }}>
            {regionOrder.map((region) => {
              const countryList = countriesByRegion[region] || [];
              const allSelected = countryList.every((c) => countryValues.includes(c));
              return (
                <details key={region} style={{ marginBottom: '12px' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 'bold', userSelect: 'none' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => toggleRegionCountries(region)}
                        style={{ verticalAlign: 'middle', marginBottom: '1px' }}
                      />
                      {region}
                    </span>
                  </summary>

                  <div style={{ marginLeft: '20px', marginTop: '8px' }}>
                    {countryList.map((country) => (
                      <label key={country} className="filter-checkbox-label">
                        <input
                          type="checkbox"
                          checked={countryValues.includes(country)}
                          onChange={() => toggleMultiSelect('country', country)}
                        />
                        {country}
                      </label>
                    ))}
                  </div>
                </details>
              );
            })}
          </div>
        </details>

        {/* Terms (full width) */}
        <details style={{ gridColumn: '1 / -1' }}>
          <summary style={{ fontWeight: 'bold', cursor: 'pointer' }}>Terms</summary>
          <div style={{ marginTop: '8px' }}>
            {['Rotational', 'Permanent', 'Temporary', 'Seasonal', 'Relief', 'Delivery', 'Crossing', 'DayWork'].map((term) => (
              <label key={term} className="filter-checkbox-label">
                <input
                  type="checkbox"
                  checked={termValues.includes(term)}
                  onChange={() => toggleMultiSelect('terms', term)}
                />
                {term}
              </label>
            ))}
          </div>
        </details>

        {/* Languages (full width) */}
        <details style={{ gridColumn: '1 / -1' }}>
          <summary style={{ fontWeight: 'bold', cursor: 'pointer' }}>Languages</summary>
          <div style={{ marginTop: '8px' }}>
            {['Arabic', 'Dutch', 'English', 'French', 'German', 'Greek', 'Italian', 'Mandarin', 'Polish', 'Portuguese', 'Russian', 'Spanish', 'Turkish', 'Ukrainian'].map((lang) => (
              <label key={lang} className="filter-checkbox-label">
                <input
                  type="checkbox"
                  checked={languageValues.includes(lang)}
                  onChange={() => toggleMultiSelect('languages', lang)}
                />
                {lang}
              </label>
            ))}
          </div>
        </details>

        {/* Only Selected (full width) */}
        <label
          htmlFor="selectedOnly"
          className="filter-checkbox-label"
          style={{ gridColumn: '1 / -1', marginBottom: '10px' }}
        >
          <input
            id="selectedOnly"
            type="checkbox"
            checked={Boolean(safeFilters.selectedOnly)}
            onChange={() => setFilters({ ...safeFilters, selectedOnly: !safeFilters.selectedOnly })}
          />
          <span><strong>Only highlighted</strong></span>
        </label>

        {/* Clear Filters (full width) */}
        <button
          className="clear-filters"
          style={{
            gridColumn: '1 / -1',
            margin: '10px 0',
            width: '100%',
            display: 'block',
            padding: '14px 16px',
            borderRadius: '10px',
            fontWeight: 600,
          }}
          onClick={() => setFilters({
            rank: '',
            city: '',
            minSalary: '',
            team: '',
            yachtType: '',
            yachtSize: '',
            use: '',
            country: [],
            languages: [],
            terms: [],
            selectedOnly: false,
          })}
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
});

FilterPanel.displayName = 'FilterPanel';

export default FilterPanel;
