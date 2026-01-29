// src/components/cv/candidate/cvsections/PreferencesSkills.js
import React from 'react';
import supabase from '../../../../supabase';

import {
  AvailabilityPicker,
  LanguageProficiencyPicker,
  DepartmentSpecialtiesInput,
  ContractTypesSelector,
  RotationPreferencePicker,
  VesselTypePreferenceSelector,
  VesselSizeRangeSelector,
  RegionsSeasonsPicker,
  DayRateSalaryInput,
  OnboardPreferences,
  ProgramTypePreferenceSelector,
  DietaryRequirementsSelector,
  StatusPicker,
} from '../sectionscomponents/preferencesskills';

export function buildPrefsSkillsPayload({
  status,
  availability,
  regionsSeasons,
  contracts,
  languageLevels,
  deptSpecialties,
  rateSalary,
  rotation,
  vesselTypes,
  vesselSizeRange,
  programTypes,
  dietaryRequirements,
  onboardPrefs,
} = {}) {
  const payload = {};
  if (status !== undefined)               payload.status = status;
  if (availability !== undefined)         payload.availability = availability;
  if (regionsSeasons !== undefined)       payload.regionsSeasons = regionsSeasons;
  if (contracts !== undefined)            payload.contracts = contracts;
  if (languageLevels !== undefined)       payload.languageLevels = languageLevels;
  if (deptSpecialties !== undefined)      payload.deptSpecialties = deptSpecialties;
  if (rateSalary !== undefined)           payload.rateSalary = rateSalary;

  if (rotation !== undefined)             payload.rotation = rotation;
  if (vesselTypes !== undefined)          payload.vesselTypes = vesselTypes;
  if (vesselSizeRange !== undefined)      payload.vesselSizeRange = vesselSizeRange;
  if (programTypes !== undefined)         payload.programTypes = programTypes;
  if (dietaryRequirements !== undefined)  payload.dietaryRequirements = dietaryRequirements;
  if (onboardPrefs !== undefined)         payload.onboardPrefs = onboardPrefs;

  return payload;
}

export async function savePreferencesSkills(props) {
  const payload = buildPrefsSkillsPayload(props);
  const { data, error } = await supabase.rpc('rpc_save_prefs_skills', { payload });
  if (error) throw error;
  return Array.isArray(data) ? data[0] ?? null : null;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth <= 640 : false
  );
  React.useEffect(() => {
    const mql = typeof window !== 'undefined' ? window.matchMedia('(max-width: 640px)') : null;
    const onChange = (e) => setIsMobile(!!e.matches);
    mql?.addEventListener?.('change', onChange);
    setIsMobile(mql ? mql.matches : false);
    return () => mql?.removeEventListener?.('change', onChange);
  }, []);
  return isMobile;
}

export default function PreferencesSkills({
  status,
  onChangeStatus,
  availability,
  onChangeAvailability,
  contracts,
  onChangeContracts,
  rotation,
  onChangeRotation,
  vesselTypes,
  onChangeVesselTypes,
  vesselSizeRange,
  onChangeVesselSizeRange,
  regionsSeasons,
  onChangeRegionsSeasons,
  rateSalary,
  onChangeRateSalary,
  languageLevels,
  onChangeLanguageLevels,
  deptSpecialties,
  onChangeDeptSpecialties,
  onboardPrefs,
  onChangeOnboardPrefs,
  programTypes,
  onChangeProgramTypes,
  dietaryRequirements,
  onChangeDietaryRequirements,
  mode = 'professional',
}) {
  const isMobile = useIsMobile();
  const isLite = mode === 'lite';
  const isProfessional = mode === 'professional';

  const twoCol = {
    display: 'grid',
    gap: 12,
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
  };

  if (isLite) {
    return (
      <div className="cp-form">
        <div style={twoCol}>
          <div
            style={{
              display: 'grid',
              gap: 12,
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            }}
          >
            <StatusPicker value={status} onChange={onChangeStatus} showRequiredMark={false} />
            <AvailabilityPicker value={availability} onChange={onChangeAvailability} showRequiredMark={false} />
          </div>
        </div>

        <div style={twoCol}>
          <LanguageProficiencyPicker
            value={languageLevels}
            onChange={onChangeLanguageLevels}
            showRequiredMark={false}
          />
          <DepartmentSpecialtiesInput
            value={deptSpecialties}
            onChange={onChangeDeptSpecialties}
            showRequiredMark={false}
            isMobile={isMobile}
          />
        </div>
      </div>
    );
  }

  if (isProfessional) {
    return (
      <div className="cp-form">
        <div style={twoCol}>
          <RegionsSeasonsPicker value={regionsSeasons} onChange={onChangeRegionsSeasons} />
          <ContractTypesSelector value={contracts} onChange={onChangeContracts} />
        </div>

        <div style={twoCol}>
          <RotationPreferencePicker value={rotation} onChange={onChangeRotation} />
          <VesselTypePreferenceSelector
            value={Array.isArray(vesselTypes) ? vesselTypes : []}
            onChange={onChangeVesselTypes}
          />
        </div>

        <div style={twoCol}>
          <VesselSizeRangeSelector
            value={vesselSizeRange}
            onChange={onChangeVesselSizeRange}
          />
          <DayRateSalaryInput value={rateSalary} onChange={onChangeRateSalary} />
        </div>

        <div style={twoCol}>
          <ProgramTypePreferenceSelector
            value={programTypes}
            onChange={onChangeProgramTypes}
          />
          <DietaryRequirementsSelector
            value={dietaryRequirements}
            onChange={onChangeDietaryRequirements}
          />
        </div>

        <OnboardPreferences value={onboardPrefs} onChange={onChangeOnboardPrefs} />
      </div>
    );
  }

  return (
    <div className="cp-form">
      {/* Status + Availability (comparten 50/50 en desktop) | Preferred regions */}
      <div style={twoCol}>
        <div
          style={{
            display: 'grid',
            gap: 12,
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          }}
        >
          <StatusPicker value={status} onChange={onChangeStatus} />
          <AvailabilityPicker value={availability} onChange={onChangeAvailability} />
        </div>
        <RegionsSeasonsPicker value={regionsSeasons} onChange={onChangeRegionsSeasons} />
      </div>

      {/* Accepted contract types | Preferred rotation cycles */}
      <div style={twoCol}>
        <ContractTypesSelector value={contracts} onChange={onChangeContracts} />
        <RotationPreferencePicker value={rotation} onChange={onChangeRotation} />
      </div>

      {/* Preferred vessel types | Desired LOA range */}
      <div style={twoCol}>
        <VesselTypePreferenceSelector
          value={Array.isArray(vesselTypes) ? vesselTypes : []}
          onChange={onChangeVesselTypes}
        />
        <VesselSizeRangeSelector
          value={vesselSizeRange}
          onChange={onChangeVesselSizeRange}
        />
      </div>

      {/* Languages (with proficiency) | Specific skills */}
      <div style={twoCol}>
        <LanguageProficiencyPicker
          value={languageLevels}
          onChange={onChangeLanguageLevels}
        />
          <DepartmentSpecialtiesInput
            value={deptSpecialties}
            onChange={onChangeDeptSpecialties}
            isMobile={isMobile}
          />
      </div>

      {/* Compensation expectations (izquierda) | Program type + Dietary (derecha, lado a lado) */}
      <div style={twoCol}>
        <DayRateSalaryInput value={rateSalary} onChange={onChangeRateSalary} />
        {/* En desktop: 2 columnas lado a lado; en móvil: apilado sin padding adicional */}
        <div
          style={{
            display: 'grid',
            gap: 12,
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            paddingTop: isMobile ? 0 : 24.8,
          }}
        >
          <ProgramTypePreferenceSelector
            value={programTypes}
            onChange={onChangeProgramTypes}
          />
          <DietaryRequirementsSelector
            value={dietaryRequirements}
            onChange={onChangeDietaryRequirements}
          />
        </div>
      </div>

      {/* Onboard preferences / personality / work style / lifestyle */}
      <OnboardPreferences value={onboardPrefs} onChange={onChangeOnboardPrefs} />
    </div>
  );
}
