// src/components/RatingModal.js

import React, { useEffect, useState } from 'react';
import supabase from '../supabase';
import Modal from './Modal';
import Avatar from '../components/Avatar';

function RatingModal({ sellerId, onClose }) {
  const [reviews, setReviews] = useState([]);
  const [average, setAverage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sellerProfile, setSellerProfile] = useState(null); // nickname + avatar_url

  // Fetch reviews + average
  useEffect(() => {
    if (!sellerId) return;

    const fetchReviews = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          purchases (
            id,
            purchase_items (
              product_id,
              products (
                name,
                mainphoto
              )
            )
          )
        `)
        .eq('reviewed_user_id', sellerId)
        .order('created_at', { ascending: false });

      if (!error) {
        setReviews(data || []);
        const total = (data || []).reduce((sum, r) => sum + r.rating, 0);
        setAverage(data && data.length > 0 ? (total / data.length).toFixed(1) : null);
      } else {
        console.error('Error fetching seller reviews:', error.message);
      }

      setLoading(false);
    };

    fetchReviews();
  }, [sellerId]);

  // Fetch seller nickname + avatar
  useEffect(() => {
    if (!sellerId) return;

    const fetchSeller = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('nickname, avatar_url')
        .eq('id', sellerId)
        .single();

      if (!error) setSellerProfile(data || null);
      else console.error('Error fetching seller profile:', error.message);
    };

    fetchSeller();
  }, [sellerId]);

  return (
    <Modal onClose={onClose}>
      <h2>Seller Ratings</h2>

      {loading ? (
        <p>Loading reviews...</p>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 12px' }}>
            <Avatar
              nickname={sellerProfile?.nickname || 'User'}
              srcUrl={sellerProfile?.avatar_url || null}
              size="md"
            />
            {average ? (
              <p style={{ margin: 0 }}>
                <strong>⭐ Overall Average:</strong> {average} / 5
              </p>
            ) : (
              <p style={{ margin: 0 }}>
                This user doesn't have enough ratings to display an average yet.
              </p>
            )}
          </div>

          {reviews.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h3>Comments</h3>
              <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
                {reviews.map((r) => {
                  const product = r.purchases?.purchase_items?.[0]?.products;
                  return (
                    <li
                      key={r.id}
                      style={{
                        borderBottom: '1px solid #ccc',
                        marginBottom: '16px',
                        paddingBottom: '12px',
                        display: 'flex',
                        gap: '12px',
                      }}
                    >
                      {product?.mainphoto && (
                        <img
                          src={product.mainphoto}
                          alt={product.name}
                          style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }}
                        />
                      )}
                      <div>
                        <p><strong>⭐ {r.rating} / 5</strong></p>
                        {r.comment && <p>{r.comment}</p>}
                        <p style={{ fontSize: '0.8em', color: '#666' }}>
                          {new Date(r.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}

export default RatingModal;