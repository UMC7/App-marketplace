// src/pages/CartPage.js

import React, { useEffect, useState } from 'react';
import { useCarrito } from '../context/CarritoContext';
import { useAuth } from '../context/AuthContext';
import supabase from '../supabase';

function CartPage() {
  const { updateQuantity, removeFromCart, clearCart } = useCarrito();
  const { currentUser } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [sellerInfo, setSellerInfo] = useState([]);

  useEffect(() => {
    const fetchCartItems = async () => {
      if (!currentUser) return;

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
            status,
            owner,
            owneremail
          )
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const formattedCart = data.map((item) => ({
          id: item.product_id,
          quantity: item.quantity,
          price: item.products?.price,
          name: item.products?.name,
          stock: item.products?.quantity,
          mainphoto: item.products?.mainphoto,
          status: item.products?.status,
          owner: item.products?.owner,
          owneremail: item.products?.owneremail,
          created_at: item.created_at,
        }));
        setCartItems(formattedCart);
      } else {
        console.error('Error al cargar el carrito:', error?.message);
      }
    };

    fetchCartItems();
  }, [currentUser]);

  const availableItems = cartItems.filter(item => item.status !== 'paused' && item.status !== 'deleted');
  const total = availableItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleQuantityChange = (item, newQty) => {
    if (!isNaN(newQty) && newQty <= item.stock) {
      updateQuantity(item.id, newQty);
      setCartItems(prev =>
        prev.map(ci =>
          ci.id === item.id ? { ...ci, quantity: newQty } : ci
        )
      );
    } else {
      alert(`No puedes seleccionar más de ${item.stock} unidades.`);
    }
  };

  const handleConfirmPurchase = () => {
    setShowConfirmModal(true);
  };

  const handleProceedPurchase = async () => {
    setShowConfirmModal(false);
    setProcessing(true);

    try {
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: currentUser.id,
          total_amount: total,
          status: 'pendiente',
        })
        .select('id')
        .single();

      if (purchaseError) throw new Error(purchaseError.message);

      const itemsToInsert = availableItems.map((item) => ({
        purchase_id: purchase.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.quantity * item.price,
      }));

      const { error: itemsError } = await supabase
        .from('purchase_items')
        .insert(itemsToInsert);

      if (itemsError) throw new Error(itemsError.message);

      for (const item of availableItems) {
        const updatedStock = item.quantity > item.stock ? 0 : item.stock - item.quantity;
        await supabase
          .from('products')
          .update({
            quantity: updatedStock,
            status: updatedStock === 0 ? 'deleted' : undefined,
          })
          .eq('id', item.id);
      }

      // Mostrar modal de vendedores
      const sellerSet = {};
      availableItems.forEach(item => {
        if (!sellerSet[item.owner]) {
          sellerSet[item.owner] = item.owneremail;
        }
      });

      setSellerInfo(Object.entries(sellerSet).map(([id, email]) => ({ id, email })));
      setShowSellerModal(true);
      clearCart();
      setCartItems([]);
    } catch (err) {
      console.error('Error en la compra:', err.message);
      alert('Ocurrió un error al procesar la compra.');
    }

    setProcessing(false);
  };

  const handleRemoveFromCart = async (productId) => {
    try {
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('product_id', productId)
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('Error al eliminar producto del carrito:', error.message);
        alert('No se pudo eliminar el producto del carrito.');
      } else {
        setCartItems(prev => prev.filter(p => p.id !== productId));
        alert('Producto eliminado del carrito.');
      }
    } catch (err) {
      console.error('Error inesperado al eliminar producto del carrito:', err.message);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Carrito de Compras</h1>

      {cartItems.length === 0 ? (
        <p>No hay productos en tu carrito.</p>
      ) : (
        <div>
          {cartItems.map((item) => (
            <div key={item.id} style={{ marginBottom: '15px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
              <img
                src={item.mainphoto || 'https://via.placeholder.com/100'}
                alt={item.name}
                style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
              />
              <h3>{item.name || 'Producto no disponible'}</h3>
              {item.status === 'deleted' ? (
                <p style={{ color: 'red', fontWeight: 'bold' }}>Producto no disponible.</p>
              ) : item.status === 'paused' ? (
                <p style={{ color: 'orange', fontWeight: 'bold' }}>Este producto está pausado.</p>
              ) : (
                <>
                  <p>Precio unitario: ${item.price}</p>
                  <p>
                    Cantidad:
                    <input
                      type="number"
                      min="1"
                      max={item.stock}
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item, parseInt(e.target.value))}
                      style={{ width: '60px', marginLeft: '10px' }}
                    />
                  </p>
                </>
              )}
              <p>Subtotal: ${item.status === 'deleted' ? 0 : item.price * item.quantity}</p>
              <button onClick={() => handleRemoveFromCart(item.id)}>Eliminar</button>
            </div>
          ))}

          <h2>Total: ${total.toFixed(2)}</h2>
          <button onClick={handleConfirmPurchase} disabled={processing || availableItems.length === 0}>
            {processing ? 'Procesando...' : 'Confirmar Compra'}
          </button>
        </div>
      )}

      {showConfirmModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0,
          width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white', padding: '30px', borderRadius: '8px',
            textAlign: 'center', maxWidth: '400px'
          }}>
            <h3>¿Deseas confirmar tu compra?</h3>
            <p>{availableItems.length} producto(s)</p>
            <p>Total a pagar: <strong>${total.toFixed(2)}</strong></p>
            <button onClick={handleProceedPurchase} style={{ marginRight: '10px' }}>Confirmar</button>
            <button onClick={() => setShowConfirmModal(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {showSellerModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0,
          width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white', padding: '30px', borderRadius: '8px',
            textAlign: 'center', maxWidth: '400px'
          }}>
            <h3>Información de vendedores</h3>
            {sellerInfo.map((seller, i) => (
              <p key={i}><strong>Email:</strong> {seller.email}</p>
            ))}
            <button onClick={() => setShowSellerModal(false)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CartPage;