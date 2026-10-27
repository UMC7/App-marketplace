import {
  buildAdminUserSearchOrFilter,
  escapeIlikePattern,
} from './adminUserSearch';

describe('adminUserSearch', () => {
  test('escapeIlikePattern escapes wildcards', () => {
    expect(escapeIlikePattern('100%_done')).toBe('100\\%\\_done');
  });

  test('buildAdminUserSearchOrFilter returns null for blank input', () => {
    expect(buildAdminUserSearchOrFilter('   ')).toBeNull();
  });

  test('buildAdminUserSearchOrFilter includes text columns for nickname search', () => {
    const filter = buildAdminUserSearchOrFilter('Jill');
    expect(filter).toContain('nickname.ilike.%Jill%');
    expect(filter).toContain('email.ilike.%Jill%');
    expect(filter).toContain('first_name.ilike.%Jill%');
    expect(filter).toContain('last_name.ilike.%Jill%');
  });

  test('buildAdminUserSearchOrFilter adds id.eq for full UUID', () => {
    const id = '54020903-461a-420f-81b4-dc0be3722c32';
    const filter = buildAdminUserSearchOrFilter(id);
    expect(filter).toContain(`id.eq.${id}`);
    expect(filter).toContain('nickname.ilike.');
  });
});
