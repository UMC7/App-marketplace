import React, { createContext, useContext, useEffect, useState } from 'react';
import supabase from '../supabase';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';

const CarritoContext = createContext();

export function useCarrito() {
  return useContext(CarritoContext);
}

export function CarritoProvider({ children }) {
  const { currentUser } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchCarrito();
    } else {
      setCartItems([]);
      setLoading(false);
    }
  }, [currentUser]);

  const fetchCarrito = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('cart')
      .select(`
        *,
        products (
          id,
          name,
          price,
          quantity,
          mainphoto,
          status
        )
      `)
      .eq('user_id', currentUser.id);

    if (error) {
      console.error('Error al obtener el carrito:', error.message);
    } else {
      const productsData = data || [];
      const ownerIds = [
        ...new Set(
          productsData
            .map((item) => item.products?.owner)
            .filter(Boolean)
        ),
      ];

      let ownersMap = {};
      if (ownerIds.length > 0) {
        const { data: ownerRows, error: ownerError } = await supabase
          .from('users')
          .select('id, first_name, last_name, email, phone')
          .in('id', ownerIds);

        if (ownerError) {
          console.error('Error al obtener propietarios del carrito:', ownerError.message);
        } else {
          ownersMap = Object.fromEntries(
            (ownerRows || []).map((owner) => [owner.id, owner])
          );
        }
      }

      const formattedCart = productsData.map((item) => ({
        id: item.product_id,
        quantity: item.quantity,
        price: item.products?.price,
        currency: item.products?.currency,
        name: item.products?.name,
        stock: item.products?.quantity,
        mainphoto: item.products?.mainphoto,
        status: item.products?.status,
        owner: item.products?.owner,
        ownerInfo: ownersMap[item.products?.owner] || null,
      }));
      setCartItems(formattedCart);
    }

    setLoading(false);
  };

  const addToCart = async (product, quantity = 1) => {
    if (!currentUser) return;

    const { data: existingItem, error: fetchError } = await supabase
      .from('cart')
      .select('id, quantity')
      .eq('user_id', currentUser.id)
      .eq('product_id', product.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error verificando existencia en carrito:', fetchError.message);
      return;
    }

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.quantity) {
        toast.error(`Solo hay ${product.quantity} unidades disponibles.`);
        return;
      }

      const { error: updateError } = await supabase
        .from('cart')
        .update({ quantity: newQuantity })
        .eq('id', existingItem.id);

      if (updateError) {
        console.error('Error actualizando carrito:', updateError.message);
        return;
      }
    } else {
      if (quantity > product.quantity) {
        toast.error(`Solo hay ${product.quantity} unidades disponibles.`);
        return;
      }

      const { error: insertError } = await supabase
        .from('cart')
        .insert({
          user_id: currentUser.id,
          product_id: product.id,
          quantity,
        });

      if (insertError) {
        console.error('Error agregando al carrito:', insertError.message);
        return;
      }
    }

    fetchCarrito();
  };

  const updateQuantity = async (productId, newQty) => {
    if (!currentUser) return;

    const { error } = await supabase
      .from('cart')
      .update({ quantity: newQty })
      .eq('user_id', currentUser.id)
      .eq('product_id', productId);

    if (error) {
      console.error('Error actualizando cantidad:', error.message);
    }

    fetchCarrito();
  };

  const removeFromCart = async (productId) => {
    if (!currentUser) return;

    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('user_id', currentUser.id)
      .eq('product_id', productId);

    if (error) {
      console.error('Error eliminando del carrito:', error.message);
    }

    fetchCarrito();
  };

  const clearCart = async () => {
    if (!currentUser) return;

    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('user_id', currentUser.id);

    if (error) {
      console.error('Error al limpiar el carrito:', error.message);
    }

    setCartItems([]);
  };

  return (
    <CarritoContext.Provider
      value={{
        cartItems,
        setCartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        loading,
      }}
    >
      {children}
    </CarritoContext.Provider>
  );
}
