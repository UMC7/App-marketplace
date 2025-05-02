import React, { useState, useEffect, useCallback } from 'react';
import { useCarrito } from '../context/CarritoContext';
import { useAuth } from '../context/AuthContext';
import supabase from '../supabase';

function CartPage() {
  const { cartItems, setCartItems, updateQuantity, removeFromCart, clearCart } = useCarrito();
  const { currentUser } = useAuth();
  const [processing, setProcessing] = useState(false);

  const fetchCartItems = useCallback(async () => {
    if (currentUser) {
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

      if (!error && data) {
        const formattedCart = data.map((item) => ({
          id: item.product_id,
          quantity: item.quantity,
          price: item.products?.price,
          name: item.products?.name,
          stock: item.products?.quantity, // ✅ Usamos quantity como stock
          mainphoto: item.products?.mainphoto,
          status: item.products?.status,
        }));
        setCartItems(formattedCart);
      } else {
        console.error('Error al cargar el carrito:', error?.message);
      }
    }
  }, [currentUser, setCartItems]);

  useEffect(() => {
    fetchCartItems();
  }, [fetchCartItems]);

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

  const handleRemoveFromCart = async (productId) => {
    try {
      const product = cartItems.find((item) => item.id === productId);

      if (product.status === 'paused') {
        alert('Este producto está pausado. Solo puedes eliminarlo de tu carrito.');
        return;
      }

      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('product_id', productId)
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('Error al eliminar producto del carrito:', error.message);
        alert('No se pudo eliminar el producto del carrito.');
      } else {
        removeFromCart(productId);
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
              <h3>{item.name}</h3>
              <p>Precio unitario: ${item.price}</p>
              <p>
                Cantidad:
                <input
                  type="number"
                  min="1"
                  max={item.stock}
                  value={item.quantity}
                  onChange={(e) => {
                    const newQty = parseInt(e.target.value);
                    if (!isNaN(newQty) && newQty <= item.stock) {
                      updateQuantity(item.id, newQty);
                      supabase.from('cart')
                        .update({ quantity: newQty })
                        .eq('user_id', currentUser.id)
                        .eq('product_id', item.id);
                    } else {
                      alert(`No puedes seleccionar más de ${item.stock} unidades.`);
                    }
                  }}
                  style={{ width: '60px', marginLeft: '10px' }}
                  disabled={item.status === 'paused'}
                />
              </p>
              <p>Subtotal: ${item.price * item.quantity}</p>
              {item.status === 'paused' ? (
                <p>Este producto está pausado. Solo puedes eliminarlo.</p>
              ) : (
                <button onClick={() => handleRemoveFromCart(item.id)}>Eliminar</button>
              )}
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