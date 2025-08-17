import React, { createContext, useContext, useEffect, useState } from 'react';
import supabase from '../supabase';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext();

export function useFavorites() {
  return useContext(FavoritesContext);
}

export function FavoritesProvider({ children }) {
  const { currentUser } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    setLoading(true);

    if (!currentUser) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    const { data: favoriteRows, error } = await supabase
      .from('favorites')
      .select('product_id')
      .eq('user_id', currentUser.id);

    if (error) {
      console.error('Error al obtener favoritos:', error.message);
      setLoading(false);
      return;
    }

    if (favoriteRows.length > 0) {
      const productIds = favoriteRows.map((f) => f.product_id);

      const { data: productData, error: prodError } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);

      if (prodError) {
        console.error('Error al obtener productos favoritos:', prodError.message);
        setLoading(false);
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

    setLoading(false);
  };

  useEffect(() => {
    if (currentUser) {
      fetchFavorites();

      // 🔴 Suscripción en tiempo real a cambios en la tabla favorites
      const channel = supabase
        .channel('favorites-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'favorites', filter: `user_id=eq.${currentUser.id}` },
          () => {
            fetchFavorites(); // refresca favoritos en cada cambio
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setFavorites([]);
      setLoading(false);
    }
  }, [currentUser]);

  const addToFavorites = async (productId) => {
    if (!currentUser) return;

    const { error } = await supabase
      .from('favorites')
      .insert({
        user_id: currentUser.id,
        product_id: productId,
      });

    if (error) {
      console.error('Error agregando a favoritos:', error.message);
      return;
    }
    fetchFavorites(); // ✅ Llama a la función de actualización aquí
  };

  const removeFromFavorites = async (productId) => {
    if (!currentUser) return;

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', currentUser.id)
      .eq('product_id', productId);

    if (error) {
      console.error('Error eliminando de favoritos:', error.message);
      return;
    }
    fetchFavorites(); // ✅ Llama a la función de actualización aquí
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        loading,
        addToFavorites,
        removeFromFavorites,
        fetchFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}