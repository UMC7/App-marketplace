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
          currency,
          quantity,
          mainphoto,
          status,
          owner,
          users!products_owner_fkey (
            id,
            email,
            first_name,
            last_name,
            phone
          )
        )
      `)
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });

        if (!error && data) {
          const formattedCart = data.map((item) => {
            const adjustedQuantity = Math.min(item.quantity, item.products?.quantity || 0);
            const recortado = item.quantity > adjustedQuantity;
        
            return {
              id: item.product_id,
              quantity: adjustedQuantity,
              price: item.products?.price,
              currency: item.products?.currency || 'USD', // ✅ nueva propiedad
              name: item.products?.name,
              stock: item.products?.quantity,
              mainphoto: item.products?.mainphoto,
              status: item.products?.status,
              owner: item.products?.owner,
              ownerInfo: item.products?.users,
              created_at: item.created_at,
              recortado, // 🔶 campo extra
            };
          });
        setCartItems(formattedCart);
      } else {
        console.error('Error al cargar el carrito:', error?.message);
      }
    };

    useEffect(() => {
    fetchCartItems();
  }, [currentUser]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchCartItems();
      }
    };
  
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentUser]);  

  const availableItems = cartItems.filter(item => item.status !== 'paused' && item.status !== 'deleted');
  const total = availableItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const subtotalesPorMoneda = availableItems.reduce((acc, item) => {
  const moneda = item.currency || 'USD';
  const subtotal = item.price * item.quantity;

  if (!acc[moneda]) acc[moneda] = 0;
  acc[moneda] += subtotal;

  return acc;
}, {});

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
const sellerMap = {};
availableItems.forEach(item => {
  const id = item.ownerInfo?.id;
  if (id && !sellerMap[id]) {
    sellerMap[id] = {
      email: item.ownerInfo?.email,
      name: `${item.ownerInfo?.first_name} ${item.ownerInfo?.last_name}`,
      phone: item.ownerInfo?.phone,
    };
  }
});

setSellerInfo(Object.values(sellerMap));
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
    <div className="container">
  <div className="login-form">
      <h2>Your Cart</h2>

      {cartItems.length === 0 ? (
        <p>No hay productos en tu carrito.</p>
      ) : (
        <div>
         {cartItems.map((item) => (
  <div
    key={item.id}
    className="product-card"
    style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}
  >
    <img
      src={item.mainphoto || 'https://via.placeholder.com/100'}
      alt={item.name}
      style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
    />
    <div style={{ flex: 1 }}>
      <h3>{item.name || 'Producto no disponible'}</h3>

      {item.status === 'deleted' ? (
        <p style={{ color: 'red', fontWeight: 'bold' }}>Producto no disponible.</p>
      ) : item.status === 'paused' ? (
        <p style={{ color: 'orange', fontWeight: 'bold' }}>Este producto está pausado.</p>
      ) : (
        <>
          <p>Precio unitario: {item.currency} {item.price}</p>
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

          {item.recortado && (
            <p style={{ color: 'orange', fontWeight: 'bold' }}>
              El stock disponible se redujo. Se ajustó tu cantidad a {item.quantity}.
            </p>
          )}
        </>
      )}

      <p>Subtotal: {item.currency} {item.status === 'deleted' ? 0 : (item.price * item.quantity).toFixed(2)}</p>
      <button className="landing-button" onClick={() => handleRemoveFromCart(item.id)}>
        Eliminar
      </button>
    </div>
  </div>
))}

          <div style={{ marginTop: '30px' }}>
  <h2>Subtotal por moneda:</h2>
  <ul style={{ paddingLeft: '20px', marginBottom: '20px' }}>
    {Object.entries(subtotalesPorMoneda).map(([moneda, subtotal]) => (
      <li key={moneda}>
        <strong>{moneda}:</strong> {subtotal.toFixed(2)}
      </li>
    ))}
  </ul>
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
    <button
      className="landing-button"
      onClick={handleConfirmPurchase}
      disabled={processing || availableItems.length === 0}
      style={{ flex: '1 1 180px' }}
    >
      {processing ? 'Procesando...' : 'Confirmar Compra'}
    </button>
  </div>
</div>
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
  backgroundColor: 'white',
  padding: '20px',
  borderRadius: '8px',
  textAlign: 'center',
  width: '90%',
  maxWidth: '400px',
  boxSizing: 'border-box'
}}>
            <h3>¿Deseas confirmar tu compra?</h3>
            <p>{availableItems.length} producto(s)</p>
            <p><strong>Totales por moneda:</strong></p>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '20px' }}>
              {Object.entries(subtotalesPorMoneda).map(([moneda, subtotal]) => (
                <li key={moneda}>
                  {moneda}: {subtotal.toFixed(2)}
                </li>
              ))}
            </ul>
          <button
            className="landing-button"
            onClick={handleProceedPurchase}
            style={{ marginRight: '10px' }}
          >
          Confirmar
          </button>
            <button className="landing-button" onClick={() => setShowConfirmModal(false)}>
            Cancelar
          </button>
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
  backgroundColor: 'white',
  padding: '20px',
  borderRadius: '8px',
  textAlign: 'center',
  width: '90%',
  maxWidth: '400px',
  boxSizing: 'border-box'
}}>
            <h3>Información de vendedores</h3>

          {sellerInfo.map((seller, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <p><strong>Nombre:</strong> {seller.name}</p>
              <p><strong>Teléfono:</strong> {seller.phone || 'No disponible'}</p>
              <p><strong>Email:</strong> {seller.email}</p>
            </div>
            ))}
            <div style={{ marginTop: '20px' }}>
        <button
          className="landing-button"
          onClick={() => setShowSellerModal(false)}
          style={{ width: '100%' }}
        >
          Cerrar
          </button>
          </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}

export default CartPage;