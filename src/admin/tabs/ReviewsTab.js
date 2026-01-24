// src/pages/tabs/ReviewsTab.js
import React, { useEffect, useState } from 'react';
import supabase from '../../supabase';
import Modal from '../../components/Modal';

function ReviewsTab() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchReviews();
  }, []);

  async function fetchReviews() {
    setLoading(true);
    const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
    if (!error) setReviews(data || []);
    setLoading(false);
    setSelectedReviewId(null);
  }

  function handleRowClick(id) {
    setSelectedReviewId(id);
  }

  function handleEdit() {
    const review = reviews.find(e => e.id === selectedReviewId);
    setEditForm({ ...review });
    setShowEditModal(true);
  }

  function handleEditChange(e) {
    setEditForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    const { error } = await supabase
      .from('reviews')
      .update(editForm)
      .eq('id', selectedReviewId);
    if (error) {
      alert('Error updating review: ' + error.message);
      return;
    }
    setShowEditModal(false);
    await fetchReviews();
  }

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    const { error } = await supabase.from('reviews').delete().eq('id', selectedReviewId);
    if (error) {
      alert('Error deleting review: ' + error.message);
      return;
    }
    await fetchReviews();
  }

  async function handleToggleBlock() {
    const review = reviews.find(e => e.id === selectedReviewId);
    if (!review) return;
    const newStatus = review.status === 'blocked' ? 'active' : 'blocked';
    const { error } = await supabase
      .from('reviews')
      .update({ status: newStatus })
      .eq('id', selectedReviewId);
    if (error) {
      alert('Error updating review status: ' + error.message);
      return;
    }
    await fetchReviews();
  }

  // Columnas automáticas
  const columns = reviews[0] ? Object.keys(reviews[0]) : [];

  // Filtrado frontend
  const filteredReviews = reviews.filter(review =>
    columns.some(col =>
      (review[col] || '').toString().toLowerCase().includes(search.toLowerCase())
    )
  );

  const selectedReview = selectedReviewId
    ? reviews.find(e => e.id === selectedReviewId)
    : null;

  return (
    <div>
      <h3>Reviews</h3>

      {/* Input de búsqueda */}
      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Search reviews..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 240, padding: 6 }}
        />
      </div>

      {loading && <p>Loading reviews...</p>}
      <table className="admin-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredReviews.map(review => (
            <tr
              key={review.id}
              className={review.id === selectedReviewId ? 'selected-row' : ''}
              onClick={() => handleRowClick(review.id)}
              style={{ cursor: 'pointer' }}
            >
              {columns.map(col => (
                <td key={col}>{String(review[col])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Botones únicos debajo de la tabla */}
      <div className="admin-actions">
        <button
          className="admin-action-button admin-action-edit"
          onClick={handleEdit}
          disabled={!selectedReviewId}
        >
          Edit
        </button>
        <button
          className="admin-action-button admin-action-delete"
          onClick={handleDelete}
          disabled={!selectedReviewId}
        >
          Delete
        </button>
        <button
          className={`admin-action-button ${selectedReview?.status === 'blocked' ? 'admin-action-unblock' : 'admin-action-block'}`}
          onClick={handleToggleBlock}
          disabled={!selectedReviewId}
        >
          {selectedReview?.status === 'blocked' ? 'Unblock' : 'Block'}
        </button>
      </div>

      {/* Modal de edición */}
      {showEditModal && (
        <Modal onClose={() => setShowEditModal(false)}>
          <h3>Edit Review</h3>
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

export default ReviewsTab;
