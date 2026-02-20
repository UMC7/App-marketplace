import React from 'react';
import RemarksField from './RemarksField';
import { MONTHS, yearsOptions, types, COUNTRIES } from './yachtOfferForm.constants';
import { getDaysInMonth } from './yachtOfferForm.utils';

function YachtOfferFormShoreBasedFields({
  formData,
  onChange,
  highlightClass,
  yearsOptions: yearsOpts,
  isDayworker,
  handleRemarksInput,
  autoResizeTextarea,
  remarksRef,
  previousRemarks,
  remarksAiUsed,
  remarksTyping,
  rewriteLoading,
  undoRemarks,
  improveRemarks,
}) {
  const yrs = yearsOpts || yearsOptions;

  return (
    <>
      {/* Position */}
      <label>Position: <span style={{ color: 'red' }}>*</span></label>
      <input name="title" value={formData.title} onChange={onChange} className={highlightClass(!formData.title)} required />

      <label>Time in Rank:</label>
      <select name="years_in_rank" value={formData.years_in_rank} onChange={onChange}>
        <option value="">Select...</option>
        {yrs.map((y) => <option key={y} value={y}>{typeof y === 'string' ? y : `>${y}`}</option>)}
      </select>

      <label>Sex:</label>
      <select name="gender" value={formData.gender} onChange={onChange}>
        <option value="">Any</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
      </select>

      {/* Salary */}
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

      {/* DOE */}
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

      {/* Languages */}
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

      <label>Terms: <span style={{ color: 'red' }}>*</span></label>
      <select name="type" value={isDayworker ? 'DayWork' : formData.type} onChange={onChange} className={highlightClass(!isDayworker && !formData.type)} required disabled={isDayworker}>
        <option value="">Select...</option>
        {types.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>

      {/* Start Date */}
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
      </div>
      <p style={{ marginTop: -4, marginBottom: 16, fontSize: 12, color: '#666' }}>Leave day empty to indicate flexible within the month.</p>

      {/* ASAP */}
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

      {/* End Date */}
      <label>End Date (Month/Day):</label>
      <div className="form-inline-group">
        <select name="end_month" value={formData.end_month} onChange={onChange}>
          <option value="">Month...</option>
          {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select name="end_day" value={formData.end_day} onChange={onChange} disabled={!formData.end_month}>
          <option value="">Day (optional)</option>
          {Array.from({ length: getDaysInMonth(formData.end_month || '0') }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <p style={{ marginTop: -10, marginBottom: 16, fontSize: 12, color: '#666', width: '100%' }}>Leave day empty to indicate flexible within the month.</p>
      </div>

      {/* Work Location */}
      <label>Work Location: <span style={{ color: 'red' }}>*</span></label>
      <select name="work_location" value={formData.work_location} onChange={onChange} className={highlightClass(!formData.work_location)}>
        <option value="">Select...</option>
        <option value="Remote">Remote</option>
        <option value="On - site">On - site</option>
      </select>

      {/* City & Country if On - site */}
      {formData.work_location === 'On - site' && (
        <>
          <label>City: <span style={{ color: 'red' }}>*</span></label>
          <input name="city" value={formData.city} onChange={onChange} className={highlightClass(formData.work_location === 'On - site' && !formData.city)} required />

          <label>Country: <span style={{ color: 'red' }}>*</span></label>
          <select name="country" value={formData.country} onChange={onChange} className={highlightClass(formData.work_location === 'On - site' && !formData.country)} required>
            <option value="">Select...</option>
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <label className="form-checkbox-label gap-after-field">
            <input type="checkbox" name="local_candidates_only" checked={formData.local_candidates_only} onChange={onChange} />
            <span>Local candidates only</span>
          </label>
        </>
      )}

      <label>Contact Email:</label>
      <input type="email" name="contact_email" value={formData.contact_email} onChange={onChange} />

      <label>Contact Phone:</label>
      <input type="tel" name="contact_phone" value={formData.contact_phone} onChange={onChange} />

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

export default YachtOfferFormShoreBasedFields;
