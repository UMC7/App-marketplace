// src/pages/ProductDetailPage.js

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import supabase from '../supabase';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useCarrito } from '../context/CarritoContext';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

function ProductDetailPage(props) {
  const params = useParams();
  const id = props.id || params.id;
  const { currentUser } = useAuth();
  const { addToCart, cartItems = [] } = useCarrito();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [purchaseQty, setPurchaseQty] = useState(1);

  const [messages, setMessages] = useState([]);
  const [questionText, setQuestionText] = useState('');
  const [messageLoading, setMessageLoading] = useState(false);
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Fetch product
      const { data: productData, error: productError } = await supabase
        .from('products').select('*').eq('id', id).single();
      if (!productError) setProduct(productData);
      else console.error("Error fetching product:", productError);

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages').select('id, content, sender_id, sent_at, product_id, receiver_id, users(nickname)')
        .eq('product_id', parseInt(id)).order('sent_at', { ascending: true });
      if (!messagesError) setMessages(messagesData);
      else console.error("Error fetching messages:", messagesError);

      // Check if favorite
      if (currentUser) {
        const { data: favData } = await supabase
          .from('favorites').select('id').eq('product_id', id).eq('user_id', currentUser.id).single();
        setIsFavorite(!!favData);
      }
      setLoading(false);
    };

    fetchData();
  }, [id, currentUser]);

  if (loading) return <p>Loading product...</p>;
  if (!product) return <p>Product not found.</p>;

  const isOwner = currentUser?.id === product.owner;
  const enCarrito = cartItems.find(item => item.id === product.id)?.quantity || 0;
  const stockDisponible = Math.max(0, product.quantity - enCarrito);
  const isPaused = product.status === 'paused';

  const handleAddToCart = () => {
    if (isPaused) { toast.error('This product is paused.'); return; }
    if (purchaseQty > stockDisponible) { toast.error(`Only ${stockDisponible} units available.`); return; }
    addToCart(product, purchaseQty);
    toast.success('Product added to cart.');
  };

  const handleAddToFavorites = async () => {
    if (isPaused) { toast.error('This product is paused.'); return; }
    if (!currentUser) { toast.error('You must log in.'); return; }
    setFavLoading(true);
    const { error } = await supabase.from('favorites').insert({ product_id: parseInt(id), user_id: currentUser.id });
    if (!error) { setIsFavorite(true); toast.success('Added to favorites!'); }
    else { toast.error('Failed to add to favorites.'); console.error(error); }
    setFavLoading(false);
  };

  const refreshMessages = async () => {
    const { data, error } = await supabase.from('messages')
      .select('id, content, sender_id, sent_at, product_id, receiver_id, users(nickname)')
      .eq('product_id', parseInt(id)).order('sent_at', { ascending: true });
    if (!error) setMessages(data || []);
  };

  const handleSubmitQuestion = async () => {
    if (!currentUser || !questionText.trim()) return;
    if (isOwner) { toast.error('You cannot ask about your own product.'); return; }
    setMessageLoading(true);
    const { error } = await supabase.from('messages').insert({
      sender_id: currentUser.id, content: questionText.trim(), product_id: parseInt(id),
    });
    if (!error) { setQuestionText(''); await refreshMessages(); toast.success('Question submitted!'); }
    else { toast.error('Failed to submit question.'); console.error(error); }
    setMessageLoading(false);
  };

  const handleSubmitAnswer = async () => {
    if (!responseText.trim() || !respondingTo) return;
    setMessageLoading(true);
    const { error } = await supabase.from('messages').insert({
      sender_id: currentUser.id, content: responseText.trim(), product_id: parseInt(id), receiver_id: respondingTo,
    });
    if (!error) { setResponseText(''); setRespondingTo(null); await refreshMessages(); toast.success('Answer submitted!'); }
    else { toast.error('Failed to submit answer.'); console.error(error); }
    setMessageLoading(false);
  };

  const sliderSettings = { dots: true, infinite: true, speed: 500, slidesToShow: 1, slidesToScroll: 1 };
  const allPhotos = [...(product.mainphoto ? [product.mainphoto] : []), ...(product.photos || [])];

  return (
    <div className="container">
      <h1>{product.name}</h1>

      <Slider {...sliderSettings}>
        {allPhotos.map((photo, index) => (
          <div key={index}>
            <img src={photo} alt={`Image ${index + 1}`} style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }} />
          </div>
        ))}
      </Slider>

      {/* Product Information (ahora reordenado, sin contenedor extra ni borde) */}
      <h3>Product Information</h3>
      <p><strong>Price:</strong> {product.currency || ''} {Number(product.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      <p><strong>Condition:</strong> {product.condition}</p>
      <p><strong>Available Stock:</strong> {stockDisponible}</p>
      <p><strong>City:</strong> {product.city}</p>
      <p><strong>Country:</strong> {product.country}</p>

      {/* Description ahora debajo de Product Information */}
      <h3>Description</h3>
      <p style={{ whiteSpace: 'pre-line' }}>{product.description}</p>

      {/* Actions */}
      {isPaused ? (
        <p style={{ color: 'red' }}>This product is paused.</p>
      ) : (
        <>
          {!isOwner && currentUser && stockDisponible > 0 && (
            <>
              <h3>Quantity to Purchase</h3>
              <input
                type="number"
                min="1"
                max={stockDisponible}
                value={purchaseQty}
                onChange={(e) => setPurchaseQty(parseInt(e.target.value))}
                style={{ maxWidth: 80, textAlign: 'center', marginBottom: 8 }}
              />
              <button
                className="landing-button"
                onClick={handleAddToCart}
                disabled={purchaseQty === 0}
                style={{ marginLeft: 8 }}
              >
                Add to cart
              </button>
            </>
          )}

          {!isOwner && currentUser && (
            <button
              className="landing-button"
              onClick={handleAddToFavorites}
              disabled={isFavorite || favLoading}
              style={{ marginLeft: 8 }}
            >
              {isFavorite ? '✔ In favorites' : 'Add to favorites'}
            </button>
          )}
        </>
      )}

      {/* Questions & Answers */}
      <div
        className="product-detail-qa"
        style={{
          margin: '40px auto 0 auto',
          maxWidth: 500,
          width: '100%',
        }}
      >
        <h3 style={{ marginTop: 0 }}>Questions and Answers</h3>
        {messages.filter(msg => !msg.receiver_id).map(q => {
          const answer = messages.find(m => m.receiver_id === q.id);
          return (
            <div key={q.id} style={{ borderBottom: '1px solid #ccc', marginBottom: 10, paddingBottom: 5 }}>
              <p><strong>{q.users?.nickname || 'User'}:</strong> {q.content}</p>
              {answer && (
                <p style={{ marginLeft: '20px', color: 'green' }}>
                  <strong>Seller:</strong> {answer.content}
                </p>
              )}
              {isOwner && !answer && (
                <div style={{ marginLeft: '20px' }}>
                  {respondingTo === q.id ? (
                    <div>
                      <textarea rows={2} value={responseText} onChange={(e) => setResponseText(e.target.value)} placeholder="Type response..." />
                      <br />
                      <button className="landing-button" onClick={handleSubmitAnswer} disabled={messageLoading}>Reply</button>
                      <button className="landing-button" onClick={() => setRespondingTo(null)} style={{ marginLeft: '10px' }}>Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setRespondingTo(q.id)} disabled={messageLoading}>Reply</button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {currentUser && !isOwner && (
          <div style={{ marginTop: 20 }}>
            <textarea rows={3} value={questionText} onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Ask a question..." style={{ width: '100%' }} disabled={messageLoading} />
            <button className="landing-button" onClick={handleSubmitQuestion} disabled={messageLoading || !questionText.trim()} style={{ marginTop: 8 }}>
              {messageLoading ? 'Sending...' : 'Submit question'}
            </button>
          </div>
        )}
        {!currentUser && <p>Log in to ask questions.</p>}
      </div>
    </div>
  );
}

export default ProductDetailPage;
