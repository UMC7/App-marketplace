import React from 'react';
import FilterableRankSelect from './FilterableRankSelect';
import CustomMultiSelect from './CustomMultiSelect';
import RequiredDocumentsSelect from './RequiredDocumentsSelect';
import JobSpecificSkillsSelect from './JobSpecificSkillsSelect'; // Reemplaza DepartmentSpecialtiesInput para el form de empleos
import RemarksField from './RemarksField';
import {
  MONTHS,
  yearsOptions,
  types,
  VISA_OPTIONS,
  ENGINEERING_LICENSE_FIELD_OPTIONS,
  COUNTRIES,
} from './yachtOfferForm.constants';
import { getDaysInMonth } from './yachtOfferForm.utils';

const COUNTRY_REGION_GROUPS = [
  { label: 'Regions', ranks: ['Asia', 'Baltic', 'Caribbean', 'Indian Ocean', 'Mediterranean', 'Red Sea', 'North Sea', 'Pacific'] },
  { label: 'Countries', ranks: COUNTRIES },
];

const FLAG_OPTIONS = ['Foreign Flag', 'United States', 'Australia', 'Bahamas', 'Belgium', 'Bermuda', 'BVI', 'Canada', 'Cayman Islands', 'Cook Islands', 'Cyprus', 'Delaware', 'France', 'Germany', 'Gibraltar', 'Greece', 'Guernsey', 'Holland', 'Hong Kong', 'Isle of Man', 'Italy', 'Jamaica', 'Jersey', 'Luxembourg', 'Malta', 'Monaco', 'Marshall Islands', 'Panama', 'Poland', 'Portugal', 'San Marino', 'Singapore', 'Spain', 'UK'];

function YachtOfferFormOnboardFields({
  formData,
  onChange,
  highlightClass,
  showLicenseFields,
  licenseOptions,
  showEngineeringLicenseField,
  engineeringLicenseFieldOptions,
  showRequiredDocs,
  setShowRequiredDocs,
  requiredDocumentGroups,
  deckDocumentOptions,
  requiredDocsRef,
  showTeammateLicenseFields,
  teammateLicenseOptions,
  showTeammateEngineeringLicenseField,
  showTeammateRequiredDocs,
  setShowTeammateRequiredDocs,
  teammateRequiredDocumentGroups,
  teammateDeckDocumentOptions,
  teammateRequiredDocsRef,
  yearsOptions: yearsOpts,
  yachtSizeOptions,
  isDayworker,
  showVisas,
  setShowVisas,
  visasRef,
  handleRemarksInput,
  autoResizeTextarea,
  remarksRef,
  previousRemarks,
  remarksAiUsed,
  remarksTyping,
  rewriteLoading,
  undoRemarks,
  improveRemarks,
  renderRequiredDocsSummary,
  onRequiredSkillsChange = () => {},
}) {
  const yrs = yearsOpts || yearsOptions;

  return (
    <>
      {/* 1. Team */}
      <label>Team</label>
      <select name="team" value={formData.team} onChange={onChange}>
        <option value="No">No</option>
        <option value="Yes">Yes</option>
      </select>

      {/* 2. Rank */}
      <label>Rank: <span style={{ color: 'red' }}>*</span></label>
      <FilterableRankSelect name="title" value={formData.title} onChange={onChange} className={highlightClass(!formData.title)} required promptText="Select..." />

      {showLicenseFields && (
        <>
          <label>Required License:</label>
          <select name="required_license" value={formData.required_license} onChange={onChange}>
            <option value="">Select...</option>
            {licenseOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          {showEngineeringLicenseField && (
            <>
              <label>Engineering License:</label>
              <select name="engineering_license" value={formData.engineering_license} onChange={onChange}>
                <option value="">Select...</option>
                {engineeringLicenseFieldOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </>
          )}
        </>
      )}

      <div className="form-group form-group-stack">
        <RequiredDocumentsSelect open={showRequiredDocs} onToggle={() => setShowRequiredDocs((v) => !v)} selectedDocuments={formData.required_documents || []} onChange={onChange} requiredDocumentGroups={requiredDocumentGroups} deckDocumentOptions={deckDocumentOptions} containerRef={requiredDocsRef} />
      </div>

      <div className="form-group form-group-stack">
        <JobSpecificSkillsSelect
          label="Specific skills:"
          value={formData.required_skills || []}
          onChange={onRequiredSkillsChange}
        />
      </div>

      <label>Time in Rank:</label>
      <select name="years_in_rank" value={formData.years_in_rank} onChange={onChange}>
        <option value="">Select...</option>
        {yrs.map((y) => <option key={y} value={y}>{typeof y === 'string' ? y : `>${y}`}</option>)}
      </select>

      {formData.team === 'No' && (
        <>
          <label>Sex:</label>
          <select name="gender" value={formData.gender} onChange={onChange}>
            <option value="">Any</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </>
      )}

      {!formData.is_doe && (
        <>
          <label>Salary Currency: <span style={{ color: 'red' }}>*</span></label>
          <select name="salary_currency" value={formData.salary_currency} onChange={onChange} className={highlightClass(!formData.salary_currency && !formData.is_doe)} required>
            <option value="">Select currency...</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="AUD">AUD</option>
            <option value="GBP">GBP</option>
          </select>
          <label>Salary: <span style={{ color: 'red' }}>*</span></label>
          <input type="number" name="salary" value={formData.salary || ''} onChange={onChange} className={highlightClass(!formData.salary && !formData.is_doe)} />
        </>
      )}

      <div className="form-group salary-extra-row">
        <label className="form-checkbox-label">
          <input type="checkbox" name="is_doe" checked={formData.is_doe} onChange={onChange} />
          <span>DOE (Salary)</span>
        </label>
        <label className="form-checkbox-label">
          <input type="checkbox" name="is_tips" checked={formData.is_tips} onChange={onChange} />
          <span>+ Tips</span>
        </label>
      </div>

      {formData.team === 'Yes' && (
        <>
          <label>Teammate Rank: <span style={{ color: 'red' }}>*</span></label>
          <FilterableRankSelect name="teammate_rank" value={formData.teammate_rank} onChange={onChange} className={highlightClass(formData.team === 'Yes' && !formData.teammate_rank)} promptText="Select..." />
          {showTeammateLicenseFields && teammateLicenseOptions.length > 0 && (
            <>
              <label>Teammate Required License:</label>
              <select name="teammate_required_license" value={formData.teammate_required_license} onChange={onChange}>
                <option value="">Select...</option>
                {teammateLicenseOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              {showTeammateEngineeringLicenseField && (
                <>
                  <label>Teammate Engineering License:</label>
                  <select name="teammate_engineering_license" value={formData.teammate_engineering_license} onChange={onChange}>
                    <option value="">Select...</option>
                    {ENGINEERING_LICENSE_FIELD_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </>
              )}
            </>
          )}
          {teammateRequiredDocumentGroups.length > 0 && (
            <div className="form-group form-group-stack">
              <RequiredDocumentsSelect open={showTeammateRequiredDocs} onToggle={() => setShowTeammateRequiredDocs((v) => !v)} selectedDocuments={formData.teammate_required_documents || []} onChange={onChange} name="teammate_required_documents" requiredDocumentGroups={teammateRequiredDocumentGroups} deckDocumentOptions={teammateDeckDocumentOptions} containerRef={teammateRequiredDocsRef} />
            </div>
          )}
          <label>Teammate Experience:</label>
          <select name="teammate_experience" value={formData.teammate_experience} onChange={onChange}>
            <option value="">Select...</option>
            {yrs.map((y) => <option key={y} value={y}>{typeof y === 'string' ? y : `>${y}`}</option>)}
          </select>
          {!formData.is_doe && (
            <>
              <label>Teammate Salary Currency: <span style={{ color: 'red' }}>*</span></label>
              <select name="teammate_salary_currency" value={formData.teammate_salary_currency || formData.salary_currency || ''} onChange={onChange} className={highlightClass(formData.team === 'Yes' && !formData.is_doe && !(formData.teammate_salary_currency || formData.salary_currency))}>
                <option value="">Select currency...</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="AUD">AUD</option>
                <option value="GBP">GBP</option>
              </select>
              <label>Teammate Salary: <span style={{ color: 'red' }}>*</span></label>
              <input type="number" name="teammate_salary" value={formData.teammate_salary || ''} onChange={onChange} className={highlightClass(formData.team === 'Yes' && !formData.is_doe && !formData.teammate_salary)} />
            </>
          )}
        </>
      )}

      <label>Languages:</label>
      <div className="form-inline-group">
        <select name="language_1" value={formData.language_1} onChange={onChange}>
          <option value="">Language 1...</option>
          <option value="Arabic">Arabic</option>
          <option value="Dutch">Dutch</option>
          <option value="English">English</option>
          <option value="French">French</option>
          <option value="German">German</option>
          <option value="Greek">Greek</option>
          <option value="Italian">Italian</option>
          <option value="Mandarin">Mandarin</option>
          <option value="Polish">Polish</option>
          <option value="Portuguese">Portuguese</option>
          <option value="Russian">Russian</option>
          <option value="Spanish">Spanish</option>
          <option value="Turkish">Turkish</option>
          <option value="Ukrainian">Ukrainian</option>
        </select>
        <select name="language_1_fluency" value={formData.language_1_fluency} onChange={onChange}>
          <option value="">Fluency...</option>
          <option value="Native">Native</option>
          <option value="Fluent">Fluent</option>
          <option value="Conversational">Conversational</option>
        </select>
      </div>
      <div className="form-inline-group">
        <select name="language_2" value={formData.language_2} onChange={onChange}>
          <option value="">Language 2...</option>
          <option value="Arabic">Arabic</option>
          <option value="Dutch">Dutch</option>
          <option value="English">English</option>
          <option value="French">French</option>
          <option value="German">German</option>
          <option value="Greek">Greek</option>
          <option value="Italian">Italian</option>
          <option value="Mandarin">Mandarin</option>
          <option value="Polish">Polish</option>
          <option value="Portuguese">Portuguese</option>
          <option value="Russian">Russian</option>
          <option value="Spanish">Spanish</option>
          <option value="Turkish">Turkish</option>
          <option value="Ukrainian">Ukrainian</option>
        </select>
        <select name="language_2_fluency" value={formData.language_2_fluency} onChange={onChange}>
          <option value="">Fluency...</option>
          <option value="Native">Native</option>
          <option value="Fluent">Fluent</option>
          <option value="Conversational">Conversational</option>
        </select>
      </div>

      <div className="form-group form-group-stack">
        <CustomMultiSelect label="Visa(s):" triggerId="visas-trigger" open={showVisas} onToggle={() => setShowVisas((v) => !v)} selected={formData.visas} groups={[{ label: '', options: VISA_OPTIONS }]} name="visas" onChange={onChange} containerRef={visasRef} />
      </div>

      <label>Terms: <span style={{ color: 'red' }}>*</span></label>
      <select name="type" value={isDayworker ? 'DayWork' : formData.type} onChange={onChange} className={highlightClass(!isDayworker && !formData.type)} required disabled={isDayworker}>
        <option value="">Select...</option>
        {types.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>

      <label>Liveaboard:</label>
      <select name="liveaboard" value={formData.liveaboard} onChange={onChange} disabled={isDayworker}>
        <option value="">Select...</option>
        <option value="No">No</option>
        <option value="Own Cabin">Own Cabin</option>
        <option value="Share Cabin">Share Cabin</option>
        <option value="Flexible">Flexible</option>
      </select>

      <label>Use:</label>
      <select name="uses" value={formData.uses} onChange={onChange} disabled={isDayworker}>
        <option value="">Select...</option>
        <option value="Private">Private</option>
        <option value="Charter (only)">Charter (only)</option>
        <option value="Private/Charter">Private/Charter</option>
      </select>

      <div style={{ marginBottom: '10px' }}>
        <label className="form-checkbox-label">
          <input type="checkbox" name="is_charter_experience_required" checked={formData.is_charter_experience_required} onChange={onChange} disabled={isDayworker} />
          <span>Charter Experience Required</span>
        </label>
      </div>

      <label>Season Type:</label>
      <select name="season_type" value={formData.season_type} onChange={onChange} disabled={isDayworker}>
        <option value="">Select...</option>
        <option value="Single Season">Single Season</option>
        <option value="Dual Season">Dual Season</option>
        <option value="Year-round">Year-round</option>
      </select>

      <label>Yacht Type: <span style={{ color: 'red' }}>*</span></label>
      <select name="yacht_type" value={formData.yacht_type} onChange={onChange} className={highlightClass(!formData.yacht_type)}>
        <option value="">Select...</option>
        <option value="Motor Yacht">Motor Yacht</option>
        <option value="Sailing Yacht">Sailing Yacht</option>
        <option value="Chase Boat">Chase Boat</option>
        <option value="Sailing Catamaran">Sailing Catamaran</option>
        <option value="Motor Catamaran">Motor Catamaran</option>
        <option value="Support Yacht">Support Yacht</option>
        <option value="Expedition Yacht">Expedition Yacht</option>
      </select>

      <label>Yacht Size: <span style={{ color: 'red' }}>*</span></label>
      <select name="yacht_size" value={formData.yacht_size} onChange={onChange} className={highlightClass(!formData.yacht_size)}>
        <option value="">Select...</option>
        {yachtSizeOptions.map((size) => <option key={size} value={size}>{size}</option>)}
      </select>

      {['Captain', 'Relief Captain', 'Skipper', 'Captain/Engineer'].includes(formData.title) && (
        <>
          <label>Propulsion Type:</label>
          <select name="propulsion_type" value={formData.propulsion_type} onChange={onChange}>
            <option value="">Select...</option>
            <option value="Shaft Drive">Shaft Drive</option>
            <option value="Waterjet">Waterjet</option>
            <option value="Pod Drive">Pod Drive</option>
            <option value="Arneson Drive">Arneson Drive</option>
          </select>
        </>
      )}

      <label>Homeport:</label>
      <input type="text" name="homeport" value={formData.homeport} onChange={onChange} />

      <label>Flag:</label>
      <select name="flag" value={formData.flag} onChange={onChange}>
        <option value="">Select...</option>
        {FLAG_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
      </select>

      <div className="form-group asap-flex-row">
        <label className="form-checkbox-label">
          <input type="checkbox" name="is_smoke_free_yacht" checked={formData.is_smoke_free_yacht} onChange={onChange} />
          <span>Smoke-free yacht</span>
        </label>
        <label className="form-checkbox-label">
          <input type="checkbox" name="is_dry_boat" checked={formData.is_dry_boat} onChange={onChange} />
          <span>Dry boat</span>
        </label>
        <label className="form-checkbox-label">
          <input type="checkbox" name="is_no_visible_tattoos" checked={formData.is_no_visible_tattoos} onChange={onChange} />
          <span>No visible tattoos</span>
        </label>
      </div>

      <label>Start Date (Month/Day): <span style={{ color: 'red' }}>*</span></label>
      <div className="form-inline-group">
        <select name="start_month" value={formData.start_month} onChange={onChange} className={highlightClass(!formData.start_month && !formData.is_asap && !formData.is_flexible)} required={!formData.is_asap && !formData.is_flexible} disabled={formData.is_asap || formData.is_flexible}>
          <option value="">Month...</option>
          {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select name="start_day" value={formData.start_day} onChange={onChange} disabled={!formData.start_month || formData.is_asap || formData.is_flexible}>
          <option value="">Day (optional)</option>
          {Array.from({ length: getDaysInMonth(formData.start_month || '0') }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <p style={{ marginTop: -10, marginBottom: 6, fontSize: 12, color: '#666', width: '100%' }}>Leave day empty to indicate flexible within the month.</p>
      </div>

      <div className="form-group asap-flex-row">
        <label className="form-checkbox-label">
          <input type="checkbox" name="is_asap" checked={formData.is_asap} onChange={onChange} disabled={formData.is_flexible} />
          <span>ASAP</span>
        </label>
        <label className="form-checkbox-label">
          <input type="checkbox" name="is_flexible" checked={formData.is_flexible} onChange={onChange} disabled={formData.is_asap} />
          <span>Flexible</span>
        </label>
      </div>

      <label>End Date (Month/Day):</label>
      <div className="form-inline-group">
        <select name="end_month" value={formData.end_month} onChange={onChange} disabled={formData.type === 'Permanent'}>
          <option value="">Month...</option>
          {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select name="end_day" value={formData.end_day} onChange={onChange} disabled={!formData.end_month || formData.type === 'Permanent'}>
          <option value="">Day (optional)</option>
          {Array.from({ length: getDaysInMonth(formData.end_month || '0') }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <p style={{ marginTop: -10, marginBottom: 16, fontSize: 12, color: '#666', width: '100%' }}>Leave day empty to indicate flexible within the month.</p>
      </div>

      <label>Holidays (Days per year):</label>
      <input type="number" step="0.1" name="holidays" value={formData.holidays || ''} onChange={onChange} disabled={isDayworker} />

      <label>City:</label>
      <input name="city" value={formData.city} onChange={onChange} />

      <label>Country/Region: <span style={{ color: 'red' }}>*</span></label>
      <FilterableRankSelect name="country" value={formData.country} onChange={onChange} className={highlightClass(!formData.country)} required promptText="Select..." optionGroups={COUNTRY_REGION_GROUPS} modalTitle="Country / Region" searchPlaceholder="Search country or region..." />
      <label className="form-checkbox-label gap-after-field">
        <input type="checkbox" name="local_candidates_only" checked={formData.local_candidates_only} onChange={onChange} />
        <span>Local candidates only</span>
      </label>

      <label>Contact Email:</label>
      <input type="email" name="contact_email" value={formData.contact_email} onChange={onChange} />

      <label>Contact Phone:</label>
      <input type="tel" name="contact_phone" value={formData.contact_phone} onChange={onChange} />

      {renderRequiredDocsSummary && renderRequiredDocsSummary()}

      <RemarksField value={formData.description} onChange={onChange} onInput={handleRemarksInput} onFocus={autoResizeTextarea} textareaRef={remarksRef} previousRemarks={previousRemarks} remarksAiUsed={remarksAiUsed} remarksTyping={remarksTyping} rewriteLoading={rewriteLoading} onUndo={undoRemarks} onImprove={improveRemarks} />

      <label>Posting Duration:</label>
      <select name="posting_duration" value={formData.posting_duration || '1 month'} onChange={onChange}>
        <option value="1 week">1 week</option>
        <option value="2 weeks">2 weeks</option>
        <option value="3 weeks">3 weeks</option>
        <option value="1 month">1 month</option>
        <option value="Manual removal">Manual removal</option>
      </select>
    </>
  );
}

export default YachtOfferFormOnboardFields;
