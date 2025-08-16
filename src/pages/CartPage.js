import React, { useState } from 'react';
import { useCarrito } from '../context/CarritoContext';
import { useAuth } from '../context/AuthContext';
import supabase from '../supabase';
import { toast } from 'react-toastify';

function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCarrito();
  const { currentUser } = useAuth();

  const [processing, setProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [sellerInfo, setSellerInfo] = useState([]);

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
    if (!isNaN(newQty) && newQty > 0 && newQty <= item.stock) {
      updateQuantity(item.id, newQty);
    } else {
      toast.error(`Solo puedes seleccionar entre 1 y ${item.stock} unidades.`);
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
        const updatedStock = item.stock - item.quantity;
        await supabase
          .from('products')
          .update({
            quantity: updatedStock,
            status: updatedStock === 0 ? 'deleted' : undefined,
          })
          .eq('id', item.id);
      }

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

      const buyerName = `${currentUser.user_metadata?.first_name || ''} ${currentUser.user_metadata?.last_name || ''}`.trim();
      const buyerEmail = currentUser.email;
      const buyerPhone = currentUser.user_metadata?.phone || 'Not available';

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

      await fetch('/api/sendEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: buyerEmail,
          subject: 'Purchase Confirmation - Yacht Daywork',
          html: htmlToBuyer
        })
      });

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

  const handleRemoveFromCart = (productId) => {
    removeFromCart(productId);
    toast.error('Product removed from cart.');
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
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  marginBottom: '24px',
                  borderBottom: '1px solid #444',
                  paddingBottom: '20px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                    gap: '16px',
                    alignItems: window.innerWidth < 768 ? 'center' : 'center',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: window.innerWidth < 768 ? 'center' : 'flex-start',
                      alignItems: window.innerWidth < 768 ? 'center' : 'center',
                      height: '100%',
                    }}
                  >
                    <img
                      src={item.mainphoto || 'https://via.placeholder.com/100'}
                      alt={item.name}
                      style={{
                        width: window.innerWidth < 768 ? '100px' : '140px',
                        height: window.innerWidth < 768 ? '100px' : '140px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        flexShrink: 0,
                      }}
                    />
                  </div>
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
                  </div>
                </div>

                <div style={{ marginTop: '10px' }}>
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
            <div className="custom-modal-content">
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