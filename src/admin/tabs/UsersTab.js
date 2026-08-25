// src/pages/tabs/UsersTab.js
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../supabase';
import Modal from '../../components/Modal';
import ChatPage from '../../components/ChatPage';
import {
  calculateProfileProgressPercent,
} from '../../components/cv/progress/profileProgress';
import { buildCandidateProfileProgressSections } from '../../components/cv/progress/candidateProfileProgressData';

const DERIVED_COLUMNS = ['lite_progress', 'professional_progress', 'cv_public_status', 'cv_link'];
const NON_EDITABLE_COLUMNS = new Set(['id', 'created_at', 'is_blocked', ...DERIVED_COLUMNS]);
const ROWS_PER_PAGE = 50;
const BULK_PREPARE_CONCURRENCY = 10;

function buildColumnOrder(sampleUser) {
  if (!sampleUser) return [];
  const base = Object.keys(sampleUser).filter((col) => !DERIVED_COLUMNS.includes(col));
  const injected = ['lite_progress', 'professional_progress', 'cv_public_status', 'cv_link'];
  const insertAfter = base.indexOf('cv_mode');
  if (insertAfter === -1) return [...base, ...injected];
  return [
    ...base.slice(0, insertAfter + 1),
    ...injected,
    ...base.slice(insertAfter + 1),
  ];
}

function formatProgressLabel(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  return `${Math.max(0, Math.min(100, Math.round(num)))}%`;
}

function buildProgressBadge(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return {
      label: '—',
      style: {
        display: 'inline-block',
        minWidth: 52,
        padding: '3px 8px',
        borderRadius: 999,
        background: '#2d2d2d',
        color: '#cfcfcf',
        fontWeight: 700,
        textAlign: 'center',
      },
    };
  }
  const complete = num === 100;
  return {
    label: formatProgressLabel(num),
    style: {
      display: 'inline-block',
      minWidth: 52,
      padding: '3px 8px',
      borderRadius: 999,
      background: complete ? '#d9fbe3' : '#fff1d6',
      color: complete ? '#166534' : '#92400e',
      fontWeight: 700,
      textAlign: 'center',
    },
  };
}

function mapDbVisibilityToUi(v) {
  const s = String(v || '').toLowerCase();
  if (s === 'public') return 'public';
  if (s === 'private') return 'private';
  return 'unlisted';
}

function unavailableCvData() {
  return {
    lite_progress: null,
    professional_progress: null,
    cv_public_status: 'Unavailable',
    cv_link: '',
  };
}

async function loadAdminCvData(userId) {
  try {
    const { data: profile, error: profileError } = await supabase.rpc('rpc_get_profile_for_admin', {
      target_user_id: userId,
    });
    if (profileError || !profile?.id) return unavailableCvData();

    const [
      { data: docsRows, error: docsError },
      educationResult,
      { count: expCount, error: expError },
      { count: directRefsCount, error: directRefsError },
      refsResult,
    ] = await Promise.all([
      supabase.rpc('rpc_public_docs_with_exp', { profile_uuid: profile.id }),
      profile.handle
        ? supabase.rpc('rpc_public_education_by_handle', { handle_in: profile.handle })
        : supabase.from('cv_education').select('id', { count: 'exact', head: true }).eq('user_id', profile.user_id),
      supabase.from('profile_experiences').select('id', { count: 'exact', head: true }).eq('profile_id', profile.id),
      supabase.from('public_references').select('id', { count: 'exact', head: true }).eq('profile_id', profile.id),
      profile.handle
        ? supabase.rpc('rpc_public_references_by_handle', { handle_in: profile.handle })
        : Promise.resolve({ data: [], error: null }),
    ]);

    const docs = docsError
      ? []
      : (docsRows || []).map((row) => ({
          id: String(row.id || ''),
          title: row.title || 'Untitled document',
          issuedOn: row.issued_on || undefined,
          expiresOn: row.expires_on || undefined,
          visibility: mapDbVisibilityToUi(row.visibility),
        }));
    const educationCount = Array.isArray(educationResult?.data)
      ? educationResult.data.length
      : (educationResult?.count || 0);
    const rpcRefsCount = refsResult?.error ? null : ((refsResult?.data || []).length);
    const refsCount = Number.isFinite(rpcRefsCount)
      ? rpcRefsCount
      : (directRefsError ? 0 : (directRefsCount || 0));
    const { liteSections, professionalSections } = buildCandidateProfileProgressSections({
      profile,
      docs,
      educationCount: educationResult?.error ? 0 : (educationCount || 0),
      expCount: expError ? 0 : (expCount || 0),
      refsCount,
      gallery: Array.isArray(profile?.gallery) ? profile.gallery : [],
    });

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const handle = String(profile?.handle || '').trim();
    const liteProgress = calculateProfileProgressPercent(liteSections);
    const professionalProgress = calculateProfileProgressPercent(professionalSections);
    const hasPublicCv = profile?.share_ready === true && Boolean(handle) && liteProgress === 100;

    return {
      lite_progress: liteProgress,
      professional_progress: professionalProgress,
      cv_public_status: hasPublicCv ? 'Ready' : 'Incomplete',
      cv_link: hasPublicCv ? `${origin}/cv/${handle}` : '',
    };
  } catch (error) {
    console.warn('UsersTab CV data load failed for user:', userId, error);
    return unavailableCvData();
  }
}

function UsersTab({ currentUser }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [progressByUserId, setProgressByUserId] = useState({});
  const [loading, setLoading] = useState(false);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [adminUser, setAdminUser] = useState(null);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatThreadId, setChatThreadId] = useState(null);
  const [chatUserId, setChatUserId] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [bulkFromPage, setBulkFromPage] = useState(1);
  const [bulkToPage, setBulkToPage] = useState(1);
  const [bulkCvLinks, setBulkCvLinks] = useState([]);
  const [bulkPreparing, setBulkPreparing] = useState(false);
  const [bulkMessage, setBulkMessage] = useState('');
  const rowsPerPage = ROWS_PER_PAGE;

  async function resolveCvLink(user) {
    if (!user?.id) return '';
    if (user.cv_link) return user.cv_link;

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    try {
      const { data, error } = await supabase
        .from('public_profiles')
        .select('handle, share_ready')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      const handle = String(data?.handle || '').trim();
      if (!handle || data?.share_ready !== true) return '';
      const nextLink = `${origin}/cv/${handle}`;
      setUsers((prev) =>
        prev.map((row) => (row.id === user.id ? { ...row, cv_link: nextLink } : row))
      );
      return nextLink;
    } catch (_e) {
      return '';
    }
  }

  async function handleOpenCv(user, e) {
    if (e) e.stopPropagation();
    const link = await resolveCvLink(user);
    if (!link) {
      alert('Digital CV not available for this user.');
      return;
    }
    window.open(link, '_blank', 'noopener,noreferrer');
  }

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, [page, search]);

  useEffect(() => {
    const loadAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setAdminUser(user);
    };
    loadAdmin();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    setProgressByUserId({});
    const trimmedSearch = String(search || '').trim().toLowerCase();
    let data = [];
    let error = null;
    let count = 0;

    if (trimmedSearch) {
      const chunkSize = 500;
      let offset = 0;
      const allRows = [];

      while (true) {
        const { data: chunk, error: chunkError } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + chunkSize - 1);

        if (chunkError) {
          error = chunkError;
          break;
        }

        const rows = chunk || [];
        allRows.push(...rows);
        if (rows.length < chunkSize) break;
        offset += chunkSize;
      }

      data = allRows;
      count = allRows.length;
    } else {
      const from = (page - 1) * rowsPerPage;
      const to = from + rowsPerPage - 1;
      const response = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      data = response.data || [];
      error = response.error || null;
      count = response.count || 0;
    }

    if (!error) {
      const rows = data || [];
      setTotalUsersCount(Number.isFinite(count) ? count : 0);

      if (!rows.length) {
        setUsers([]);
        setLoading(false);
        setSelectedUserId(null);
        return;
      }

      setUsers(rows);
    }

    setLoading(false);
    setSelectedUserId(null);
  }

  function handleRowClick(id) {
    setSelectedUserId(id);
  }

  function handleEdit() {
    const user = users.find((row) => row.id === selectedUserId);
    setEditForm({ ...user });
    setShowEditModal(true);
  }

  function handleEditChange(e) {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    const payload = Object.fromEntries(
      Object.entries(editForm).filter(([key]) => !NON_EDITABLE_COLUMNS.has(key))
    );
    const { error } = await supabase
      .from('users')
      .update(payload)
      .eq('id', selectedUserId);
    if (error) {
      alert('Error updating user: ' + error.message);
      return;
    }
    setShowEditModal(false);
    await fetchUsers();
  }

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    const { error } = await supabase.from('users').delete().eq('id', selectedUserId);
    if (error) {
      alert('Error deleting user: ' + error.message);
      return;
    }
    await fetchUsers();
  }

  async function handleToggleBlock() {
    const user = users.find((row) => row.id === selectedUserId);
    if (!user) return;
    const newStatus = !user.is_blocked;
    const { error } = await supabase
      .from('users')
      .update({ is_blocked: newStatus })
      .eq('id', selectedUserId);
    if (error) {
      alert('Error updating user block status: ' + error.message);
      return;
    }
    await fetchUsers();
  }

  const enrichedUsers = useMemo(
    () => users.map((u) => {
      const progress = progressByUserId[String(u.id)];
      return {
        ...u,
        lite_progress: progress?.lite_progress ?? null,
        professional_progress: progress?.professional_progress ?? null,
        cv_public_status: progress?.cv_public_status || 'Loading…',
        cv_link: progress?.cv_link || '',
      };
    }),
    [users, progressByUserId]
  );

  const columns = useMemo(() => buildColumnOrder(enrichedUsers[0]), [enrichedUsers]);

  const filteredUsers = enrichedUsers.filter((user) =>
    columns.some((col) =>
      String(user[col] ?? '').toLowerCase().includes(search.toLowerCase())
    )
  );

  const pagedUsers = filteredUsers;
  const totalVisibleCount = search ? filteredUsers.length : totalUsersCount;
  const totalPages = search
    ? Math.ceil(filteredUsers.length / rowsPerPage)
    : Math.ceil(totalUsersCount / rowsPerPage);

  useEffect(() => {
    let cancelled = false;
    const missingUsers = pagedUsers.filter((user) => !progressByUserId[String(user.id)]);
    if (!missingUsers.length) return undefined;

    (async () => {
      const loaded = await Promise.all(
        missingUsers.map(async (u) => {
          const cvData = await loadAdminCvData(u.id);
          return [String(u.id), cvData];
        })
      );

      if (cancelled) return;
      setProgressByUserId((prev) => ({
        ...prev,
        ...Object.fromEntries(loaded),
      }));
    })();

    return () => {
      cancelled = true;
    };
  }, [pagedUsers, progressByUserId]);

  const resetBulkResult = () => {
    setBulkCvLinks([]);
    setBulkMessage('');
  };

  async function handlePrepareBulkCvs() {
    const fromPage = Number(bulkFromPage);
    const toPage = Number(bulkToPage);

    if (!Number.isInteger(fromPage) || !Number.isInteger(toPage)) {
      setBulkMessage('Enter whole page numbers.');
      return;
    }
    if (fromPage < 1 || toPage < fromPage || toPage > totalPages) {
      setBulkMessage(`Choose a valid range between page 1 and page ${totalPages}.`);
      return;
    }
    if (String(search || '').trim()) {
      setBulkMessage('Clear the user search before preparing a page range.');
      return;
    }

    setBulkPreparing(true);
    setBulkCvLinks([]);
    setBulkMessage('Loading users in the selected pages...');

    try {
      const fromRow = (fromPage - 1) * rowsPerPage;
      const toRow = (toPage * rowsPerPage) - 1;
      const { data: rangeUsers, error } = await supabase
        .from('users')
        .select('id')
        .order('created_at', { ascending: false })
        .range(fromRow, toRow);
      if (error) throw error;

      const candidates = rangeUsers || [];
      const links = [];
      for (let offset = 0; offset < candidates.length; offset += BULK_PREPARE_CONCURRENCY) {
        const chunk = candidates.slice(offset, offset + BULK_PREPARE_CONCURRENCY);
        const chunkResults = await Promise.all(chunk.map((user) => loadAdminCvData(user.id)));
        chunkResults.forEach((cvData) => {
          if (cvData.cv_link) links.push(cvData.cv_link);
        });
        setBulkMessage(`Checking Digital CVs... ${Math.min(offset + chunk.length, candidates.length)} of ${candidates.length}`);
      }

      const uniqueLinks = [...new Set(links)];
      setBulkCvLinks(uniqueLinks);
      setBulkMessage(
        uniqueLinks.length
          ? `${uniqueLinks.length} Digital CV${uniqueLinks.length === 1 ? '' : 's'} ready to open from pages ${fromPage} to ${toPage}.`
          : `No available Digital CVs found from pages ${fromPage} to ${toPage}.`
      );
    } catch (error) {
      console.error('Bulk Digital CV preparation failed:', error);
      setBulkMessage(`Could not prepare the Digital CVs: ${error.message || 'Unknown error'}`);
    } finally {
      setBulkPreparing(false);
    }
  }

  function handleOpenBulkCvs() {
    if (!bulkCvLinks.length) return;
    const totalToOpen = bulkCvLinks.length;
    let openedCount = 0;

    for (const link of bulkCvLinks) {
      const openedTab = window.open('', '_blank');
      if (!openedTab) break;

      try {
        openedTab.opener = null;
        openedTab.location.replace(link);
        openedCount += 1;
      } catch {
        openedTab.close();
        break;
      }
    }

    const remainingLinks = bulkCvLinks.slice(openedCount);
    setBulkCvLinks(remainingLinks);

    if (remainingLinks.length) {
      setBulkMessage(
        `Opened ${openedCount} of ${totalToOpen}. ${remainingLinks.length} remain. Allow pop-ups for this site from the browser address bar, then click the Open button again.`
      );
      return;
    }

    setBulkMessage(
      `Opened all ${openedCount} Digital CV${openedCount === 1 ? '' : 's'}.`
    );
  }

  function getPaginationNumbers() {
    const numbers = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i += 1) numbers.push(i);
      return numbers;
    }

    numbers.push(1);
    let left = page - 2;
    let right = page + 2;

    if (left <= 2) {
      left = 2;
      right = 5;
    }
    if (right >= totalPages - 1) {
      left = totalPages - 4;
      right = totalPages - 1;
    }
    if (left > 2) numbers.push('...');
    for (let i = left; i <= right; i += 1) {
      if (i > 1 && i < totalPages) numbers.push(i);
    }
    if (right < totalPages - 1) numbers.push('...');
    numbers.push(totalPages);
    return numbers;
  }

  const selectedUser = selectedUserId ? users.find((row) => row.id === selectedUserId) : null;

  const openAdminChat = async (userId) => {
    if (!userId) return;
    let admin = adminUser;
    if (!admin) {
      const { data: { user } } = await supabase.auth.getUser();
      admin = user || null;
      setAdminUser(admin);
    }
    if (!admin?.id) {
      alert('Unable to load admin user.');
      return;
    }
    if (admin.id === userId) {
      alert('You cannot start a chat with yourself.');
      return;
    }

    setChatLoading(true);
    const { data: existing } = await supabase
      .from('admin_threads')
      .select('id')
      .eq('admin_id', admin.id)
      .eq('user_id', userId)
      .maybeSingle();

    let threadId = existing?.id;
    if (!threadId) {
      const { data: created, error: createError } = await supabase
        .from('admin_threads')
        .insert({ admin_id: admin.id, user_id: userId })
        .select('id')
        .single();

      if (createError) {
        alert(`Error creating admin chat: ${createError.message}`);
        setChatLoading(false);
        return;
      }
      threadId = created?.id;
    }

    setChatThreadId(threadId);
    setChatUserId(userId);
    setChatModalOpen(true);
    setChatLoading(false);
  };

  return (
    <div>
      <h3>Users</h3>

      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ width: 240, padding: 6 }}
        />
      </div>
      <section
        aria-label="Bulk Digital CV opener"
        style={{
          marginBottom: 16,
          padding: 14,
          border: '1px solid #6fc4c0',
          borderRadius: 8,
          maxWidth: 760,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Open Digital CVs by page range</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'end', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            From page
            <input
              type="number"
              min="1"
              max={Math.max(1, totalPages)}
              step="1"
              value={bulkFromPage}
              onChange={(e) => {
                setBulkFromPage(e.target.value);
                resetBulkResult();
              }}
              style={{ width: 100, padding: 6 }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            To page
            <input
              type="number"
              min="1"
              max={Math.max(1, totalPages)}
              step="1"
              value={bulkToPage}
              onChange={(e) => {
                setBulkToPage(e.target.value);
                resetBulkResult();
              }}
              style={{ width: 100, padding: 6 }}
            />
          </label>
          <button
            type="button"
            onClick={handlePrepareBulkCvs}
            disabled={bulkPreparing || totalPages < 1 || Boolean(String(search || '').trim())}
            style={{ padding: '7px 12px', cursor: bulkPreparing ? 'wait' : 'pointer' }}
          >
            {bulkPreparing ? 'Preparing...' : 'Prepare CVs'}
          </button>
          <button
            type="button"
            onClick={handleOpenBulkCvs}
            disabled={bulkPreparing || !bulkCvLinks.length}
            style={{
              padding: '7px 12px',
              border: '1px solid #6fc4c0',
              borderRadius: 6,
              background: bulkCvLinks.length ? '#6fc4c0' : '#aaa',
              color: '#111',
              fontWeight: 700,
              cursor: bulkCvLinks.length ? 'pointer' : 'not-allowed',
            }}
          >
            Open {bulkCvLinks.length || ''} Digital CV{bulkCvLinks.length === 1 ? '' : 's'}
          </button>
        </div>
        <div role="status" aria-live="polite" style={{ marginTop: 10, fontSize: 14 }}>
          {bulkMessage || `${totalPages} user page${totalPages === 1 ? '' : 's'} available. Pop-ups must be allowed for this site.`}
        </div>
      </section>
      <div style={{ marginBottom: 12, fontSize: 14 }}>
        Selected user: {selectedUserId || 'None'}
      </div>

      {loading && <p>Loading users...</p>}
      <div className="analytics-block">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedUsers.map((user, idx) => (
              <tr
                key={user.id}
                className={user.id === selectedUserId ? 'selected-row' : ''}
                onClick={() => handleRowClick(user.id)}
                style={{ cursor: 'pointer' }}
              >
                <td>{totalVisibleCount - ((page - 1) * rowsPerPage + idx)}</td>
                {columns.map((col) => {
                  if (col === 'description' || col === 'photos') {
                    return (
                      <td key={col}>
                        <textarea
                          value={String(user[col] ?? '')}
                          readOnly
                          style={{
                            width: '10cm',
                            minHeight: '1.5em',
                            resize: 'vertical',
                            border: 'none',
                            background: 'transparent',
                            font: 'inherit',
                            color: 'inherit',
                            outline: 'none',
                            padding: 0,
                            overflow: 'auto',
                          }}
                          rows={1}
                        />
                      </td>
                    );
                  }

                if (col === 'cv_link') {
                  return (
                    <td key={col}>
                        {user[col] ? (
                          <a href={user[col]} target="_blank" rel="noreferrer">
                            Open CV
                          </a>
                        ) : (
                          '—'
                        )}
                    </td>
                  );
                }

                if (col === 'avatar_url') {
                  const avatarUrl = String(user[col] || '').trim();
                  return (
                    <td key={col}>
                      {avatarUrl ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewImageUrl(avatarUrl);
                          }}
                          style={{
                            padding: 0,
                            border: 'none',
                            background: 'transparent',
                            color: '#6fc4c0',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            font: 'inherit',
                          }}
                        >
                          View avatar
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                  );
                }

                if (col === 'lite_progress' || col === 'professional_progress') {
                  const badge = buildProgressBadge(user[col]);
                  return (
                    <td key={col}>
                      <span style={badge.style}>{badge.label}</span>
                    </td>
                  );
                }

                if (col === 'cv_public_status') {
                  return (
                    <td key={col}>
                      <span
                        style={{
                          fontWeight: 700,
                          color: user[col] === 'Ready' ? '#237b23' : '#b26a00',
                        }}
                      >
                        {user[col]}
                      </span>
                    </td>
                  );
                }

                  return <td key={col}>{String(user[col])}</td>;
                })}
                <td>
                  {user.is_blocked ? (
                    <span style={{ color: '#b80000', fontWeight: 'bold' }}>Blocked</span>
                  ) : (
                    <span style={{ color: '#237b23', fontWeight: 'bold' }}>Active</span>
                  )}
                </td>
                <td>
                  <button
                    type="button"
                    onClick={(e) => handleOpenCv(user, e)}
                    style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: 6,
                      border: '1px solid #6fc4c0',
                      background: '#6fc4c0',
                      color: '#111',
                      textDecoration: 'none',
                      marginRight: 8,
                      cursor: user.cv_link ? 'pointer' : 'not-allowed',
                      opacity: user.cv_link ? 1 : 0.5,
                    }}
                    disabled={!user.cv_link}
                  >
                    CV
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRowClick(user.id);
                    }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 6,
                      border: '1px solid #444',
                      background: user.id === selectedUserId ? '#444' : 'transparent',
                      color: user.id === selectedUserId ? '#fff' : 'inherit',
                      cursor: 'pointer',
                    }}
                  >
                    {user.id === selectedUserId ? 'Selected' : 'Select'}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openAdminChat(user.id);
                    }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 6,
                      border: '1px solid #1b2430',
                      background: '#1b2430',
                      color: '#e2e8f0',
                      cursor: chatLoading ? 'not-allowed' : 'pointer',
                      marginLeft: 8,
                    }}
                    disabled={chatLoading}
                  >
                    Chat
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div
          style={{
            margin: '18px 0',
            display: 'flex',
            gap: 4,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {getPaginationNumbers().map((num, idx) =>
            num === '...' ? (
              <span
                key={idx}
                style={{
                  padding: '2px 7px',
                  fontSize: 15,
                  color: '#888',
                  userSelect: 'none',
                }}
              >
                ...
              </span>
            ) : num === page ? (
              <span
                key={idx}
                style={{
                  padding: '3px 9px',
                  borderRadius: '999px',
                  background: '#e0e0e0',
                  color: '#333',
                  fontWeight: 600,
                  fontSize: 15,
                  minWidth: 28,
                  textAlign: 'center',
                }}
              >
                {num}
              </span>
            ) : (
              <button
                key={idx}
                onClick={() => setPage(num)}
                style={{
                  padding: '3px 9px',
                  borderRadius: '999px',
                  background: '#fafafa',
                  color: '#444',
                  border: 'none',
                  fontWeight: 500,
                  fontSize: 15,
                  minWidth: 28,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'background .15s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#f0f0f0';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#fafafa';
                }}
              >
                {num}
              </button>
            )
          )}
        </div>
      )}

      <div className="admin-actions">
        <button
          className="admin-action-button admin-action-edit"
          onClick={handleEdit}
          disabled={!selectedUserId}
        >
          Edit
        </button>
        <button
          className="admin-action-button"
          onClick={() => navigate(`/admin/candidate/${selectedUserId}`)}
          disabled={!selectedUserId}
        >
          View Candidate Profile
        </button>
        <button
          className="admin-action-button admin-action-cv"
          onClick={() => handleOpenCv(selectedUser)}
          disabled={!selectedUserId || !selectedUser?.cv_link}
        >
          Open Digital CV
        </button>
        <button
          className="admin-action-button admin-action-delete"
          onClick={handleDelete}
          disabled={!selectedUserId}
        >
          Delete
        </button>
        <button
          className={`admin-action-button ${selectedUser?.is_blocked ? 'admin-action-unblock' : 'admin-action-block'}`}
          onClick={handleToggleBlock}
          disabled={!selectedUserId}
        >
          {selectedUser?.is_blocked ? 'Unblock' : 'Block'}
        </button>
      </div>

      {showEditModal && (
        <Modal onClose={() => setShowEditModal(false)}>
          <h3>Edit User</h3>
          <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {columns.map((col) =>
              !NON_EDITABLE_COLUMNS.has(col) ? (
                <label key={col}>
                  {col.charAt(0).toUpperCase() + col.slice(1)}:
                  <input
                    name={col}
                    value={editForm[col] || ''}
                    onChange={handleEditChange}
                    disabled={NON_EDITABLE_COLUMNS.has(col)}
                  />
                </label>
              ) : null
            )}
            <button type="submit" style={{ marginTop: 10 }}>Save</button>
          </form>
        </Modal>
      )}

      {chatModalOpen && chatThreadId && chatUserId && (
        <Modal onClose={() => setChatModalOpen(false)}>
          <ChatPage
            mode="admin"
            adminThreadId={chatThreadId}
            adminUserId={chatUserId}
            onClose={() => setChatModalOpen(false)}
          />
        </Modal>
      )}

      {previewImageUrl && (
        <Modal onClose={() => setPreviewImageUrl('')}>
          <div style={{ maxWidth: 'min(90vw, 720px)' }}>
            <h3 style={{ marginTop: 0 }}>Avatar Preview</h3>
            <img
              src={previewImageUrl}
              alt="User avatar preview"
              style={{
                display: 'block',
                width: '100%',
                height: 'auto',
                borderRadius: 12,
                objectFit: 'contain',
              }}
            />
          </div>
        </Modal>
      )}

      <style>{`
        .selected-row {
          background-color: #ffeebb !important;
        }
      `}</style>
    </div>
  );
}

export default UsersTab;
