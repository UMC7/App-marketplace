// src/pages/tabs/UsersTab.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../supabase';
import Modal from '../../components/Modal';

// Recibe currentUser como prop o usa tu contexto
function UsersTab({ currentUser }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const rowsPerPage = 50;

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) {
      const rows = data || [];
      const ids = rows.map((u) => u.id).filter(Boolean);
      let handleMap = new Map();
      if (ids.length) {
        const { data: profiles } = await supabase
          .from('public_profiles')
          .select('user_id, handle')
          .in('user_id', ids);
        handleMap = new Map(
          (profiles || []).map((p) => [String(p.user_id), p.handle])
        );
      }
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const withCv = rows.map((u) => {
        const cvMode = String(u.cv_mode || '').toLowerCase();
        const handle = handleMap.get(String(u.id)) || '';
        const hasCv = (cvMode === 'lite' || cvMode === 'professional') && handle;
        return {
          ...u,
          cv_link: hasCv ? `${origin}/cv/${handle}` : '',
        };
      });
      setUsers(withCv);
    }
    setLoading(false);
    setSelectedUserId(null);
    setPage(1);
  }

  function handleRowClick(id) {
    setSelectedUserId(id);
  }

  function handleEdit() {
    const user = users.find(e => e.id === selectedUserId);
    setEditForm({ ...user });
    setShowEditModal(true);
  }

  function handleEditChange(e) {
    setEditForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    const { error } = await supabase
      .from('users')
      .update(editForm)
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
    const user = users.find(e => e.id === selectedUserId);
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

  // Columnas automáticas
  const columns = users[0] ? Object.keys(users[0]) : [];

  // Filtrado frontend
  const filteredUsers = users.filter(user =>
    columns.some(col =>
      (user[col] || '').toString().toLowerCase().includes(search.toLowerCase())
    )
  );

  // Paginación frontend
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const pagedUsers = filteredUsers.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );
  const totalVisibleCount = filteredUsers.length;

  function getPaginationNumbers() {
    const numbers = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        numbers.push(i);
      }
    } else {
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
      if (left > 2) {
        numbers.push('...');
      }
      for (let i = left; i <= right; i++) {
        if (i > 1 && i < totalPages) {
          numbers.push(i);
        }
      }
      if (right < totalPages - 1) {
        numbers.push('...');
      }
      numbers.push(totalPages);
    }
    return numbers;
  }

  const selectedUser = selectedUserId
    ? users.find(e => e.id === selectedUserId)
    : null;

  return (
    <div>
      <h3>Users</h3>

      {/* Input de búsqueda */}
      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 240, padding: 6 }}
        />
      </div>
      <div style={{ marginBottom: 12, fontSize: 14 }}>
        Selected user: {selectedUserId ? selectedUserId : 'None'}
      </div>

      {loading && <p>Loading users...</p>}
      <table className="admin-table">
        <thead>
          <tr>
            <th>#</th>
            {columns.map(col => (
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
              {columns.map(col => (
                <td key={col}>
                  {(col === 'description' || col === 'photos') ? (
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
                  ) : col === 'cv_link' ? (
                    user[col] ? (
                      <a href={user[col]} target="_blank" rel="noreferrer">
                        Open CV
                      </a>
                    ) : (
                      '—'
                    )
                  ) : (
                    String(user[col])
                  )}
                </td>
              ))}
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Paginación minimalista */}
      {totalPages > 1 && (
        <div style={{
          margin: '18px 0',
          display: 'flex',
          gap: 4,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          {getPaginationNumbers().map((num, idx) =>
            num === '...' ? (
              <span key={idx} style={{
                padding: '2px 7px',
                fontSize: 15,
                color: '#888',
                userSelect: 'none'
              }}>...</span>
            ) : num === page ? (
              <span key={idx} style={{
                padding: '3px 9px',
                borderRadius: '999px',
                background: '#e0e0e0',
                color: '#333',
                fontWeight: 600,
                fontSize: 15,
                minWidth: 28,
                textAlign: 'center',
              }}>{num}</span>
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
                  transition: 'background .15s'
                }}
                onMouseOver={e => (e.currentTarget.style.background = '#f0f0f0')}
                onMouseOut={e => (e.currentTarget.style.background = '#fafafa')}
              >
                {num}
              </button>
            )
          )}
        </div>
      )}

      {/* Botones únicos debajo de la tabla */}
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

      {/* Modal de edición */}
      {showEditModal && (
        <Modal onClose={() => setShowEditModal(false)}>
          <h3>Edit User</h3>
          <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {columns.map(col => (
              col !== 'id' && (
                <label key={col}>
                  {col.charAt(0).toUpperCase() + col.slice(1)}:
                  <input
                    name={col}
                    value={editForm[col] || ''}
                    onChange={handleEditChange}
                    disabled={col === 'created_at' || col === 'is_blocked'}
                  />
                </label>
              )
            ))}
            <button type="submit" style={{ marginTop: 10 }}>Save</button>
          </form>
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
