import React from 'react';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import ProductList from '../components/ProductList';

function FavoritesPage() {
  const { favorites, loading, removeFromFavorites } = useFavorites();
  const { currentUser } = useAuth();

  return (
    <div className="container">
      <h1>Mis Productos Favoritos</h1>
      {!currentUser ? (
        <p>Por favor, inicia sesión para ver tus productos favoritos.</p>
      ) : loading ? (
        <p className="loading">Cargando favoritos...</p>
      ) : favorites.length === 0 ? (
        <p className="no-products">No has añadido ningún producto a favoritos.</p>
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