// src/pages/FavoritesPage.js

import React, { useEffect, useState } from 'react';
import supabase from '../supabase';
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
        console.error('Error al cargar favoritos:', error.message);
        return;
      }

      if (favoriteRows.length > 0) {
        const productIds = favoriteRows.map((f) => f.product_id);

        const { data: productData, error: prodError } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds);

        if (prodError) {
          console.error('Error al cargar productos favoritos:', prodError.message);
          return;
        }

        const merged = productIds.map((id) => {
          const found = productData.find((p) => p?.id === id);
          if (!found) {
            return {
              id,
              product: {
                id,
                name: 'Producto eliminado',
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
      console.error('Error inesperado al cargar favoritos:', err.message);
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
        console.error('Error al eliminar de favoritos:', error.message);
        alert('No se pudo quitar el producto de favoritos.');
      } else {
        setFavorites((prev) => prev.filter((p) => p.id !== productId));
      }
    } catch (err) {
      console.error('Error inesperado al eliminar favorito:', err.message);
    }
  };

  useEffect(() => {
    fetchFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Mis productos favoritos</h1>
      {loading ? (
        <p>Cargando favoritos...</p>
      ) : favorites.length === 0 ? (
        <p>No has agregado productos a favoritos.</p>
      ) : (
        <div className="products-grid">
          {favorites.map(({ product, id }, idx) => (
            <ProductCard
              key={idx}
              product={product}
              onRemoveFavorite={() => handleRemoveFavorite(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default FavoritesPage;