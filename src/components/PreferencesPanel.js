import React from 'react';

const RANKS = [
  "Captain", "Captain/Engineer", "Skipper", "Chase Boat Captain", "Relief Captain",
  "Chief Officer", "2nd Officer", "3rd Officer", "Bosun", "Deck/Engineer", "Mate",
  "Mate/Engineer",
  "Mate/Steward(ess)",
  "Lead Deckhand", "Deckhand", "Deck/Steward(ess)", "Deck/Carpenter", "Deck/Divemaster", "Deck/Cook",
  "Dayworker", "Chief Engineer", "2nd Engineer", "3rd Engineer", "Solo Engineer", "Engineer", "Electrician", "Chef",
  "Head Chef", "Sous Chef", "Solo Chef", "Cook", "Cook/Crew Chef", "Crew Chef/Stew", "Chef/Steward(ess)", "Butler", "Steward(ess)", "Chief Steward(ess)", "2nd Steward(ess)",
  "3rd Steward(ess)", "4th Steward(ess)", "Solo Steward(ess)", "Junior Steward(ess)", "Housekeeper", "Head of Housekeeping", "Chef/Stew/Deck", "Cook/Stew/Deck", "Cook/Steward(ess)", "Stew/Deck",
  "Laundry/Steward(ess)", "Stew/Masseur", "Masseur", "Hairdresser/Barber", "Steward(ess)/Nanny", "Nanny", "Videographer", "Yoga/Pilates Instructor",
  "Personal Trainer", "Dive Instrutor", "Water Sport Instrutor", "Nurse", "Other"
];

const TERMS = ['Rotational', 'Permanent', 'Temporary', 'Seasonal', 'Relief', 'Delivery', 'Crossing', 'Freelance', 'DayWork'];

const PreferencesPanel = React.forwardRef(({
  safePrefs,
  prefsDisabled,
  hasCompletePrefs,
  togglePrefMulti,
  setPrefMinSalary,
  clearPreferences,
  handleToggleRegion,
  toggleCountryPreference,
  setPreferences,
  regionOrder,
  countriesByRegion,
}, ref) => (
  <div ref={ref} className={`filter-body expanded`}>
    <div className="filters-container filters-panel show" style={{ marginBottom: '20px' }}>
      <h3 style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8 }}>
        Job Preferences
        <span
          style={{
            fontSize: 12,
            padding: '2px 8px',
            borderRadius: 999,
            background: prefsDisabled ? '#f5f5f5' : hasCompletePrefs ? '#e6ffed' : '#fff5f5',
            color: prefsDisabled ? '#666' : hasCompletePrefs ? '#067d3f' : '#a40000',
            border: `1px solid ${prefsDisabled ? '#ddd' : hasCompletePrefs ? '#a9e6bc' : '#f0b3b3'}`
          }}
        >
          {prefsDisabled ? 'Sign in to use' : hasCompletePrefs ? 'Ready' : 'Complete all fields'}
        </span>
      </h3>
      {prefsDisabled && (
        <p style={{ gridColumn: '1 / -1', marginTop: -2, color: '#666' }}>
          Sign in to enable and save your preferences.
        </p>
      )}

      {/* Positions (max 3) */}
      <details style={{ gridColumn: '1 / -1' }}>
        <summary style={{ fontWeight: 'bold', cursor: 'pointer' }}>
          Preferred Positions
        </summary>
        <div className="prefs-scroll positions-grid" style={{ marginTop: '8px' }}>
          {RANKS.map((rank) => {
            const selected = safePrefs.positions.includes(rank);
            const atCap = !selected && safePrefs.positions.length >= 3;
            return (
              <label
                key={rank}
                className="filter-checkbox-label prefs-item"
                style={{ opacity: atCap ? 0.55 : 1 }}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => togglePrefMulti('positions', rank)}
                  disabled={prefsDisabled || atCap}
                />
                {rank}
              </label>
            );
          })}
        </div>
      </details>

      {/* Terms (max 3) */}
      <details style={{ gridColumn: '1 / -1' }}>
        <summary style={{ fontWeight: 'bold', cursor: 'pointer' }}>
          Preferred Terms
        </summary>
        <div style={{ marginTop: '8px' }}>
          {TERMS.map((term) => {
            const selected = safePrefs.terms.includes(term);
            const atCap = !selected && safePrefs.terms.length >= 3;
            return (
              <label key={term} className="filter-checkbox-label" style={{ opacity: atCap ? 0.55 : 1 }}>
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => togglePrefMulti('terms', term)}
                  disabled={prefsDisabled || atCap}
                />
                {term}
              </label>
            );
          })}
        </div>
      </details>

      {/* Countries (max 3) */}
      <details style={{ gridColumn: '1 / -1' }}>
        <summary style={{ fontWeight: 'bold', cursor: 'pointer' }}>
          Preferred Countries or Region
        </summary>
        <div style={{ marginTop: '8px', maxHeight: '300px', overflowY: 'auto' }}>
          {regionOrder.map((region) => {
            const list = countriesByRegion[region] || [];
            const regionActive = safePrefs.selectedRegion === region;
            const anyRegionActive = !!safePrefs.selectedRegion;

            return (
              <details key={region} style={{ marginBottom: '12px', opacity: anyRegionActive && !regionActive ? 0.6 : 1 }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold', userSelect: 'none' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={regionActive}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => handleToggleRegion(region)}
                      disabled={prefsDisabled}
                    />
                    {region}
                  </span>
                </summary>
                <div style={{ marginLeft: '20px', marginTop: '8px' }}>
                  {list.map((country) => {
                    const selected = safePrefs.countries.includes(country);
                    const atCap = !selected && safePrefs.countries.length >= 3 && !anyRegionActive;
                    return (
                      <label
                        key={country}
                        className="filter-checkbox-label"
                        style={{ opacity: (anyRegionActive || atCap) ? 0.55 : 1 }}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleCountryPreference(country)}
                          disabled={prefsDisabled || anyRegionActive || atCap}
                        />
                        {country}
                      </label>
                    );
                  })}
                </div>
              </details>
            );
          })}
        </div>
      </details>

      {/* Flag */}
      <select
        className="category-select"
        value={safePrefs.flag}
        onChange={(e) => setPreferences({ ...safePrefs, flag: e.target.value })}
        disabled={prefsDisabled}
      >
        <option value="">Preferred Flag</option>
        <option value="Foreign Flag">Foreign Flag</option>
        <option value="United States">United States</option>
      </select>

      {/* Minimum Salary */}
      <div style={{ gridColumn: '1 / -1' }}>
        <label className="filter-checkbox-label" style={{ justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 'bold' }}>Minimum Salary</span>
          <input
            type="number"
            className="search-input"
            placeholder="e.g. 3000"
            value={safePrefs.minSalary || ''}
            onChange={(e) => setPrefMinSalary(e.target.value)}
            style={{ maxWidth: 200 }}
            disabled={prefsDisabled}
          />
        </label>
      </div>

      {/* Clear Preferences */}
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
        onClick={clearPreferences}
        disabled={prefsDisabled}
      >
        Clear Preferences
      </button>
    </div>
  </div>
));

PreferencesPanel.displayName = 'PreferencesPanel';

export default PreferencesPanel;
