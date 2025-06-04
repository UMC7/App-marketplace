// src/pages/FavoritesPage.js

import React, { useEffect, useState } from 'react';
import supabase from '../supabase';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';

function FavoritesPage() {
  const { currentUser } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    if (!currentUser) return;

    try {
      const { data: favoriteRows, error } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('Failed to load favorites:', error.message);
        return;
      }

      if (favoriteRows.length > 0) {
        const productIds = favoriteRows.map((f) => f.product_id);

        const { data: productData, error: prodError } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds);

        if (prodError) {
          console.error('Failed to load favorite products:', prodError.message);
          return;
        }

        const merged = productIds.map((id) => {
          const found = productData.find((p) => p?.id === id);
          if (!found) {
            return {
              id,
              product: {
                id,
                name: 'Product removed',
                price: null,
                country: null,
                mainphoto: null,
                status: 'deleted',
              },
            };
          }
          return { id, product: found };
        });

        setFavorites(merged);
      } else {
        setFavorites([]);
      }
    } catch (err) {
      console.error('Unexpected error while loading favorites:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (productId) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('product_id', productId);

      if (error) {
        console.error('Failed to remove from favorites:', error.message);
        toast.error('Could not remove the product from favorites.');
      } else {
        setFavorites((prev) => prev.filter((p) => p.id !== productId));
      }
    } catch (err) {
      console.error('Unexpected error while removing favorite:', err.message);
    }
  };

  useEffect(() => {
    fetchFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  return (
  <div className="container">
    <h1>My Favorite Products</h1>
    {loading ? (
      <p className="loading">Loading favorites...</p>
    ) : favorites.length === 0 ? (
      <p className="no-products">You have not added any products to favorites.</p>
    ) : (
      <div className="products-grid-wrapper">
  <div className="products-grid">
    {favorites.map(({ product, id }, idx) => (
      <ProductCard
        key={idx}
        product={product}
        onRemoveFavorite={() => handleRemoveFavorite(id)}
      />
    ))}
  </div>
</div>
    )}
  </div>
);
}

export default FavoritesPage;