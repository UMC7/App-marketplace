import React, { useState } from 'react';
import { useCarrito } from '../context/CarritoContext';
import { useAuth } from '../context/AuthContext';
import supabase from '../supabase';

function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCarrito();
  const { currentUser } = useAuth();
  const [processing, setProcessing] = useState(false);

  const total = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const handleConfirmPurchase = async () => {
    if (!currentUser || cartItems.length === 0) return;

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

      const itemsToInsert = cartItems.map((item) => ({
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

      for (const item of cartItems) {
        const { error: stockError } = await supabase
          .from('products')
          .update({
            quantity: item.quantity > item.stock
              ? 0
              : item.stock - item.quantity,
          })
          .eq('id', item.id);
        if (stockError) console.warn('Error actualizando stock:', stockError.message);
      }

      alert('¡Compra realizada con éxito!');
      clearCart();
    } catch (err) {
      console.error('Error en la compra:', err.message);
      alert('Ocurrió un error al procesar la compra.');
    }

    setProcessing(false);
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
              <h3>{item.name}</h3>
              <p>Precio unitario: ${item.price}</p>
              <p>
                Cantidad:
                <input
                  type="number"
                  min="1"
                  max={item.quantity}
                  value={item.quantity}
                  onChange={(e) =>
                    updateQuantity(item.id, parseInt(e.target.value))
                  }
                  style={{ width: '60px', marginLeft: '10px' }}
                />
              </p>
              <p>Subtotal: ${item.price * item.quantity}</p>
              <button onClick={() => removeFromCart(item.id)}>Eliminar</button>
            </div>
          ))}

          <h2>Total: ${total.toFixed(2)}</h2>
          <button onClick={handleConfirmPurchase} disabled={processing}>
            {processing ? 'Procesando...' : 'Confirmar Compra'}
          </button>
        </div>
      )}
    </div>
  );
}

export default CartPage;