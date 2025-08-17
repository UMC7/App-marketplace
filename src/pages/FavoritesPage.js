import React from 'react';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import ProductList from '../components/ProductList';

function FavoritesPage() {
  const { favorites, loading, removeFromFavorites } = useFavorites();
  const { currentUser } = useAuth();

  return (
    <div className="container">
      <h1>My Favorite Products</h1>
      {!currentUser ? (
        <p>Please sign in to view your favorite products.</p>
      ) : loading ? (
        <p className="loading">Loading favorites...</p>
      ) : favorites.length === 0 ? (
        <p className="no-products">You haven't added any products to favorites.</p>
      ) : (
        <div className="favorites-wrapper">
          <ProductList
            products={favorites.map(f => f.product)}
            onRemoveFavorite={removeFromFavorites}
          />
        </div>
      )}
    </div>
  );
}

export default FavoritesPage;