// src/admin/AdminCandidateProfilePage.js
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CandidateProfileTab from '../components/cv/CandidateProfileTab';

export default function AdminCandidateProfilePage() {
  const navigate = useNavigate();
  const { userId } = useParams();

  return (
    <div className="container">
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <button type="button" className="cp-btn" onClick={() => navigate('/admin')}>
          Back to Admin
        </button>
        <h2 style={{ margin: 0 }}>Candidate Profile (Admin View)</h2>
      </div>

      {!userId ? (
        <p>Missing user id.</p>
      ) : (
        <CandidateProfileTab adminUserId={userId} />
      )}
    </div>
  );
}
