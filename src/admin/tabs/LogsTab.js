// src/pages/tabs/LogsTab.js
import React, { useEffect, useState } from 'react';
import supabase from '../../supabase';
import Modal from '../../components/Modal';

function LogsTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const rowsPerPage = 50;

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setLoading(true);
    const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
    if (!error) setLogs(data || []);
    setLoading(false);
    setSelectedLogId(null);
    setPage(1);
  }

  function handleRowClick(id) {
    setSelectedLogId(id);
  }

  function handleEdit() {
    const log = logs.find(e => e.id === selectedLogId);
    setEditForm({ ...log });
    setShowEditModal(true);
  }

  function handleEditChange(e) {
    setEditForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    const { error } = await supabase
      .from('audit_logs')
      .update(editForm)
      .eq('id', selectedLogId);
    if (error) {
      alert('Error updating log: ' + error.message);
      return;
    }
    setShowEditModal(false);
    await fetchLogs();
  }

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this log?')) return;
    const { error } = await supabase.from('audit_logs').delete().eq('id', selectedLogId);
    if (error) {
      alert('Error deleting log: ' + error.message);
      return;
    }
    await fetchLogs();
  }

  // Columnas automáticas
  const columns = logs[0] ? Object.keys(logs[0]) : [];

  // Filtrado frontend
  const filteredLogs = logs.filter(log =>
    columns.some(col =>
      (log[col] || '').toString().toLowerCase().includes(search.toLowerCase())
    )
  );

  // Paginación frontend
  const totalPages = Math.ceil(filteredLogs.length / rowsPerPage);
  const pagedLogs = filteredLogs.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

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

  return (
    <div>
      <h3>Audit Logs</h3>

      {/* Input de búsqueda */}
      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Search logs..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 240, padding: 6 }}
        />
      </div>

      {loading && <p>Loading logs...</p>}
      <table className="admin-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pagedLogs.map(log => (
            <tr
              key={log.id}
              className={log.id === selectedLogId ? 'selected-row' : ''}
              onClick={() => handleRowClick(log.id)}
              style={{ cursor: 'pointer' }}
            >
              {columns.map(col => (
                <td key={col}>
                  {col === 'description' ? (
                    <textarea
                      value={String(log[col] ?? '')}
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
                  ) : (
                    String(log[col])
                  )}
                </td>
              ))}
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
      <div style={{ marginTop: 12 }}>
        <button onClick={handleEdit} disabled={!selectedLogId}>Edit</button>
        <button onClick={handleDelete} disabled={!selectedLogId}>Delete</button>
      </div>

      {/* Modal de edición */}
      {showEditModal && (
        <Modal onClose={() => setShowEditModal(false)}>
          <h3>Edit Log</h3>
          <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {columns.map(col => (
              col !== 'id' && (
                <label key={col}>
                  {col.charAt(0).toUpperCase() + col.slice(1)}:
                  <input
                    name={col}
                    value={editForm[col] || ''}
                    onChange={handleEditChange}
                    disabled={col === 'created_at'}
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

export default LogsTab;