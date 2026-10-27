import {
  canUseProfessionalProfile,
  loadProfileDocumentsForProgress,
  mapProgressDocument,
} from './profileProgressDocuments';
import {
  buildCandidateProfileProgressSections,
} from './candidateProfileProgressData';
import { calculateProfileProgressPercent } from './profileProgress';

const completeLiteInput = {
  profile: {
    first_name: 'Ada', last_name: 'Lovelace', email_public: 'ada@example.test',
    phone_cc: '34', phone_number: '123', country: 'ES', city_port: 'Palma',
    birth_month: 1, birth_year: 1990, nationalities: ['ES'],
    primary_department: 'Deck', primary_role: 'Mate', about_me: 'Crew member',
    prefs_skills_lite: {
      status: 'Available', availability: 'Now',
      languageLevels: [{ lang: 'English', level: 'Fluent' }],
      deptSpecialties: [{ department: 'Deck', skills: ['Tender'] }],
      lifestyleHabits: {
        tattoosVisible: 'No', drugTestWilling: 'Yes', smoking: 'No', vaping: 'No',
        alcohol: 'No', dietaryAllergies: ['None'], fitness: 'Daily',
      },
      docFlags: {
        passport6m: false, schengenVisa: false, stcwBasic: false, seamansBook: false,
        eng1: false, usVisa: false, drivingLicense: false, pdsd: false, covidVaccine: false,
      },
    },
  },
  expCount: 1, educationCount: 1, refsCount: 1,
  gallery: [{ type: 'image' }, { type: 'image' }, { type: 'image' }],
};

describe('profile progress document source and Professional gate', () => {
  test.each(['public', 'private', 'after_contact'])(
    'counts a valid %s document without changing its UI visibility',
    (visibility) => {
      const doc = mapProgressDocument({ id: 'd1', title: 'STCW', issued_on: '2025-01-01', visibility });
      expect(doc.visibility).toBe(visibility === 'after_contact' ? 'unlisted' : visibility);
      const docs = [doc, { ...doc, id: 'd2' }, { ...doc, id: 'd3' }];
      const sections = buildCandidateProfileProgressSections({ ...completeLiteInput, docs }).liteSections;
      expect(sections.documents.count).toBe(2);
      expect(calculateProfileProgressPercent(sections)).toBe(100);
    }
  );

  test('does not unlock Professional when Lite becomes incomplete', () => {
    const docs = Array.from({ length: 3 }, (_, index) => mapProgressDocument({
      id: String(index), title: 'Valid', issued_on: '2025-01-01', visibility: 'private',
    }));
    const complete = buildCandidateProfileProgressSections({ ...completeLiteInput, docs }).liteSections;
    expect(canUseProfessionalProfile(calculateProfileProgressPercent(complete))).toBe(true);
    const incomplete = buildCandidateProfileProgressSections({ ...completeLiteInput, docs: docs.slice(0, 2) }).liteSections;
    expect(canUseProfessionalProfile(calculateProfileProgressPercent(incomplete))).toBe(false);
  });

  test('uses only the private progress RPC', async () => {
    const rpc = jest.fn().mockResolvedValue({ data: [{ id: 'd1', visibility: 'after_contact' }], error: null });
    await expect(loadProfileDocumentsForProgress({ rpc }, 'profile-1')).resolves.toEqual([
      expect.objectContaining({ id: 'd1', visibility: 'unlisted' }),
    ]);
    expect(rpc).toHaveBeenCalledWith('rpc_profile_documents_for_progress', { profile_uuid: 'profile-1' });
  });

  test('propagates an authorization failure and never maps a document URL', async () => {
    const unauthorized = new Error('not authorized to read profile progress documents');
    await expect(loadProfileDocumentsForProgress({
      rpc: jest.fn().mockResolvedValue({ data: null, error: unauthorized }),
    }, 'another-profile')).rejects.toBe(unauthorized);
    expect(mapProgressDocument({
      id: 'private-doc', file_url: 'cv-docs/secret.pdf', visibility: 'private',
    })).not.toHaveProperty('file_url');
  });
});
