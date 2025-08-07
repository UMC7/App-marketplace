// src/pages/CartPage.js

import React, { useEffect, useState } from 'react';
import { useCarrito } from '../context/CarritoContext';
import { useAuth } from '../context/AuthContext';
import supabase from '../supabase';
import { toast } from 'react-toastify';

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
          currency: item.products?.currency || 'USD',
          name: item.products?.name,
          stock: item.products?.quantity,
          mainphoto: item.products?.mainphoto,
          status: item.products?.status,
          owner: item.products?.owner,
          ownerInfo: item.products?.users,
          created_at: item.created_at,
          recortado,
        };
      });
      setCartItems(formattedCart);
    } else {
      console.error('Failed to load the cart:', error?.message);
    }
  };

  useEffect(() => {
    fetchCartItems();
    // eslint-disable-next-line
  }, [currentUser]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'Visible') {
        fetchCartItems();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    // eslint-disable-next-line
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
      toast.error(`You can not select more than ${item.stock} units.`);
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
          status: 'Pending',
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

      // Enviar correos al comprador y a los vendedores
const buyerName = `${currentUser.user_metadata?.first_name || ''} ${currentUser.user_metadata?.last_name || ''}`.trim();
const buyerEmail = currentUser.email;
const buyerPhone = currentUser.user_metadata?.phone || 'Not available';

// Agrupar productos por vendedor
const productsBySeller = {};
availableItems.forEach(item => {
  const sellerId = item.owner;
  if (!productsBySeller[sellerId]) {
    productsBySeller[sellerId] = {
      seller: item.ownerInfo,
      products: []
    };
  }
  productsBySeller[sellerId].products.push(item);
});

// Preparar contenido HTML para el comprador
let htmlToBuyer = `<h2>Thank you for your purchase, ${buyerName}!</h2>`;
htmlToBuyer += `<p>You have purchased the following items:</p>`;

for (const { seller, products } of Object.values(productsBySeller)) {
  htmlToBuyer += `<h3>Seller: ${seller.first_name} ${seller.last_name}</h3>`;
  htmlToBuyer += `<p>Email: ${seller.email}<br>Phone: ${seller.phone || 'Not available'}</p>`;
  htmlToBuyer += `<ul>`;
  products.forEach(p => {
    htmlToBuyer += `<li>${p.name} — ${p.currency} ${p.price} × ${p.quantity}</li>`;
  });
  htmlToBuyer += `</ul>`;
}

// Enviar correo al comprador
await fetch('/api/sendEmail', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: buyerEmail,
    subject: 'Purchase Confirmation - Yacht Daywork',
    html: htmlToBuyer
  })
});

// Enviar un correo por vendedor
for (const { seller, products } of Object.values(productsBySeller)) {
  const htmlToSeller = `
    <h2>Hello ${seller.first_name},</h2>
    <p>You have received a new order from:</p>
    <p>
      Name: ${buyerName}<br>
      Email: ${buyerEmail}<br>
      Phone: ${buyerPhone}
    </p>
    <p>Products sold:</p>
    <ul>
      ${products.map(p => `<li>${p.name} — ${p.currency} ${p.price} × ${p.quantity}</li>`).join('')}
    </ul>
  `;

  await fetch('/api/sendEmail', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: seller.email,
      subject: 'New Order Received - Yacht Daywork',
      html: htmlToSeller
    })
  });
}

    } catch (err) {
      console.error('Purchase error:', err.message);
      toast.error('An error occurred while processing the purchase.');
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
        console.error('Failed to remove product from cart:', error.message);
        toast.error('Could not remove the product from the cart.');
      } else {
        setCartItems(prev => prev.filter(p => p.id !== productId));
        toast.error('Product removed from cart.');
      }
    } catch (err) {
      console.error('Unexpected error while removing product from cart:', err.message);
    }
  };

  return (
    <div className="container">
      <div className="login-form">
        <h2>Your Cart</h2>

        {cartItems.length === 0 ? (
          <p>There are no products in your cart.</p>
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
                  style={{
                    width: '100px',
                    height: '100px',
                    objectFit: 'cover',
                    borderRadius: '8px'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <h3>{item.name || 'Product not available'}</h3>

                  {item.status === 'deleted' ? (
                    <p style={{ color: 'red', fontWeight: 'bold' }}>
                      Product not available.
                    </p>
                  ) : item.status === 'paused' ? (
                    <p style={{ color: 'orange', fontWeight: 'bold' }}>
                      This product is currently paused.
                    </p>
                  ) : (
                    <>
                      <p>
                        Unit Price: {item.currency}{' '}
                        {Number(item.price).toLocaleString('en-US')}
                      </p>
                      <p>
                        Quantity:
                        <input
                          type="number"
                          min="1"
                          max={item.stock}
                          value={item.quantity}
                          onChange={(e) =>
                            handleQuantityChange(item, parseInt(e.target.value))
                          }
                          style={{ width: '60px', marginLeft: '10px' }}
                        />
                      </p>
                      {item.recortado && (
                        <p style={{ color: 'orange', fontWeight: 'bold' }}>
                          Available stock has decreased. Your quantity has been adjusted to {item.quantity}.
                        </p>
                      )}
                    </>
                  )}

                  <p>
                    Subtotal: {item.currency}{' '}
                    {item.status === 'deleted'
                      ? 0
                      : (item.price * item.quantity).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                  </p>
                  <button
                    className="landing-button"
                    onClick={() => handleRemoveFromCart(item.id)}
                  >
                    Remove from Cart
                  </button>
                </div>
              </div>
            ))}

            <div style={{ marginTop: '30px' }}>
              <h2>Subtotal by currency:</h2>
              <ul style={{ paddingLeft: '20px', marginBottom: '20px' }}>
                {Object.entries(subtotalesPorMoneda).map(([moneda, subtotal]) => (
                  <li key={moneda}>
                    <strong>{moneda}:</strong>{' '}
                    {subtotal.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
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
                  {processing ? 'Processing...' : 'Confirm Purchase'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showConfirmModal && (
          <div className="custom-modal-overlay" onClick={() => setShowConfirmModal(false)}>
            <div className="custom-modal-content" onClick={e => e.stopPropagation()}>
              <h3>Do you want to confirm your purchase?</h3>
              <p>{availableItems.length} product(s)</p>
              <p><strong>Totals by currency:</strong></p>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '20px' }}>
                {Object.entries(subtotalesPorMoneda).map(([moneda, subtotal]) => (
                  <li key={moneda}>
                    {moneda}:{' '}
                    {subtotal.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </li>
                ))}
              </ul>
              <button className="landing-button" onClick={handleProceedPurchase}>Confirm</button>
              <button className="landing-button" onClick={() => setShowConfirmModal(false)}>Cancel</button>
            </div>
          </div>
        )}

        {showSellerModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
            }}
          >
            <div
              style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                textAlign: 'center',
                width: '90%',
                maxWidth: '400px',
                boxSizing: 'border-box',
              }}
            >
              <h3>Seller Information</h3>
              {sellerInfo.map((seller, i) => (
                <div key={i} style={{ marginBottom: '10px' }}>
                  <p>
                    <strong>Name:</strong> {seller.name}
                  </p>
                  <p>
                    <strong>Phone:</strong> {seller.phone || 'Not available'}
                  </p>
                  <p>
                    <strong>Email:</strong> {seller.email}
                  </p>
                </div>
              ))}
              <div style={{ marginTop: '20px' }}>
                <button
                  className="landing-button"
                  onClick={() => setShowSellerModal(false)}
                  style={{ width: '100%' }}
                >
                  Close
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