// src/pages/ProductDetailPage.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import supabase from '../supabase';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useCarrito } from '../context/CarritoContext';
import { useFavorites } from '../context/FavoritesContext';
import Slider from 'react-slick';
import RatingModal from '../components/RatingModal';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

function ProductDetailPage(props) {
  const params = useParams();
  const id = props.id || params.id;

  const { currentUser } = useAuth();
  const { addToCart, cartItems = [] } = useCarrito();
  const { favorites, addToFavorites } = useFavorites();

  const [product, setProduct] = useState(null);
  const [sellerInfo, setSellerInfo] = useState({ nickname: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [purchaseQty, setPurchaseQty] = useState(1);

  const [messages, setMessages] = useState([]);
  const [questionText, setQuestionText] = useState('');
  const [messageLoading, setMessageLoading] = useState(false);
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseText, setResponseText] = useState('');

  const [sellerRating, setSellerRating] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);

  const isFavorite = favorites.some((fav) => fav.id.toString() === id.toString());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // 1) Obtener producto con owner ID
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (!productError && productData) {
        setProduct(productData);
      } else {
        console.error('Error fetching product:', productError);
      }

      // 2) Consultar datos del vendedor por separado: nickname y phone
      if (productData?.owner) {
        const { data: sellerData, error: sellerError } = await supabase
          .from('users')
          .select('nickname, phone')
          .eq('id', productData.owner)
          .single();
        if (!sellerError && sellerData) {
          setSellerInfo({ nickname: sellerData.nickname, phone: sellerData.phone });
        } else {
          console.error('Error fetching seller info:', sellerError);
        }

        // 3) Obtener rating del vendedor
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('user_reviews')
          .select('rating')
          .eq('reviewed_user_id', productData.owner);

        if (!reviewsError && reviewsData?.length > 0) {
          const total = reviewsData.reduce((sum, r) => sum + r.rating, 0);
          const avg = (total / reviewsData.length).toFixed(1);
          setSellerRating(avg);
        } else {
          setSellerRating(null);
        }
      }

      // 4) Obtener preguntas/respuestas
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('id, content, sender_id, sent_at, product_id, receiver_id, users(nickname)')
        .eq('product_id', parseInt(id, 10))
        .order('sent_at', { ascending: true });

      if (!messagesError && messagesData) {
        setMessages(messagesData);
      } else {
        console.error('Error fetching messages:', messagesError);
      }

      setLoading(false);
    };

    fetchData();
  }, [id]);

  if (loading) return <p>Loading product...</p>;
  if (!product) return <p>Product not found.</p>;

  const isOwner = currentUser?.id === product.owner;
  const enCarrito = cartItems.find((item) => item.id === product.id)?.quantity || 0;
  const stockDisponible = Math.max(0, product.quantity - enCarrito);
  const isPaused = product.status === 'paused';

  const handleAddToCart = () => {
    if (isPaused) return toast.error('This product is paused.');
    if (purchaseQty > stockDisponible) {
      return toast.error(`Only ${stockDisponible} units available.`);
    }
    addToCart(product, purchaseQty);
    toast.success('Product added to cart.');
  };

  const handleAddToFavorites = async () => {
    if (isPaused) return toast.error('This product is paused.');
    if (!currentUser) return toast.error('You must log in.');
    await addToFavorites(id);
    toast.success('Added to favorites!');
  };

  const refreshMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('id, content, sender_id, sent_at, product_id, receiver_id, users(nickname)')
      .eq('product_id', parseInt(id, 10))
      .order('sent_at', { ascending: true });

    if (!error && data) setMessages(data);
  };

  const handleSubmitQuestion = async () => {
    if (!currentUser || !questionText.trim()) return;
    if (isOwner) return toast.error('You cannot ask about your own product.');

    setMessageLoading(true);
    const { error } = await supabase.from('messages').insert({
      sender_id: currentUser.id,
      content: questionText.trim(),
      product_id: parseInt(id, 10),
    });

    if (!error) {
      setQuestionText('');
      await refreshMessages();
      toast.success('Question submitted!');
    } else {
      toast.error('Failed to submit question.');
      console.error(error);
    }
    setMessageLoading(false);
  };

  const handleSubmitAnswer = async () => {
    if (!responseText.trim() || !respondingTo) return;

    setMessageLoading(true);
    const { error } = await supabase.from('messages').insert({
      sender_id: currentUser.id,
      content: responseText.trim(),
      product_id: parseInt(id, 10),
      receiver_id: respondingTo,
    });

    if (!error) {
      setResponseText('');
      setRespondingTo(null);
      await refreshMessages();
      toast.success('Answer submitted!');
    } else {
      toast.error('Failed to submit answer.');
      console.error(error);
    }
    setMessageLoading(false);
  };

  const sliderSettings = { dots: true, infinite: true, speed: 500, slidesToShow: 1, slidesToScroll: 1 };
  const allPhotos = [...(product.mainphoto ? [product.mainphoto] : []), ...(product.photos || [])];

  return (
    <div className="container">
      <h1>{product.name}</h1>
      <Slider {...sliderSettings}>
        {allPhotos.map((photo, idx) => (
          <div key={idx}>
            <img src={photo} alt={`Image ${idx + 1}`} style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }} />
          </div>
        ))}
      </Slider>
      <div className="section-divider" />

      <h3>Product Information</h3>
      <p><strong>Price:</strong> {product.currency || ''} {Number(product.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      <p><strong>Condition:</strong> {product.condition}</p>
      <p><strong>Available Stock:</strong> {stockDisponible}</p>
      <p><strong>City:</strong> {product.city}</p>
      <p><strong>Country:</strong> {product.country}</p>
      <div className="section-divider" />

      <h3>Description</h3>
      <p className="description-text" style={{ whiteSpace: 'pre-line' }}>{product.description}</p>
      <div className="section-divider" />

      <h3>Rating</h3>
      {sellerRating
        ? <p><strong>⭐ Seller Rating:</strong> {sellerRating} / 5</p>
        : <p>This user doesn't have enough ratings to display an average yet.</p>}
      <button onClick={() => setShowRatingModal(true)} className="landing-button" style={{ marginBottom: '20px' }}>
        View Seller Ratings
      </button>
      {showRatingModal && <RatingModal sellerId={product.owner} onClose={() => setShowRatingModal(false)} />}

      <div className="section-divider" />
      {!isPaused && !isOwner && currentUser && stockDisponible > 0 && (
        <>
          <h3>Quantity to Purchase</h3>
          <input type="number" min="1" max={stockDisponible} value={purchaseQty} onChange={e => setPurchaseQty(parseInt(e.target.value, 10))} style={{ maxWidth: 80, textAlign: 'center', marginBottom: 8 }} />
          <button className="landing-button" onClick={handleAddToCart} disabled={purchaseQty === 0 || product.category_id === 16} style={{ marginLeft: 8 }}>
            Add to cart
          </button>
        </>
      )}
      {!isPaused && !isOwner && currentUser && (
        <button className="landing-button" onClick={handleAddToFavorites} disabled={isFavorite} style={{ marginLeft: 8 }}>
          {isFavorite ? '✔ In favorites' : 'Add to favorites'}
        </button>
      )}
      <div style={{ marginTop: '24px' }}>
        <div className="section-divider" />
      </div>

      <div className="product-detail-qa" style={{ margin: '40px auto 0', maxWidth: 500, width: '100%' }}>
        <h3>Questions and Answers</h3>
        {messages.filter(m => !m.receiver_id).map(q => {
          const answer = messages.find(m => m.receiver_id === q.id);
          return (
            <div key={q.id} style={{ borderBottom: '1px solid #ccc', marginBottom: 10, paddingBottom: 5 }}>
              <p><strong>{q.users?.nickname || 'User'}:</strong> {q.content}</p>
              {answer && <p style={{ marginLeft: 20, color: 'green' }}><strong>Seller:</strong> {answer.content}</p>}
              {isOwner && !answer && (
                <div style={{ marginLeft: 20 }}>
                  {respondingTo === q.id ? (
                    <>
                      <textarea rows={2} value={responseText} onChange={e => setResponseText(e.target.value)} placeholder="Type response..." /><br />
                      <button className="landing-button" onClick={handleSubmitAnswer} disabled={messageLoading}>Reply</button>
                      <button className="landing-button" onClick={() => setRespondingTo(null)} style={{ marginLeft: 10 }}>Cancel</button>
                    </>
                  ) : (
                    <button onClick={() => setRespondingTo(q.id)} disabled={messageLoading}>Reply</button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {currentUser && !isOwner && (<div style={{ marginTop: 20 }}>
          <textarea rows={3} value={questionText} onChange={e => setQuestionText(e.target.value)} placeholder="Ask a question…" style={{ width: '100%' }} disabled={messageLoading} />
          <button className="landing-button" onClick={handleSubmitQuestion} disabled={messageLoading || !questionText.trim()} style={{ marginTop: 8 }}>
            {messageLoading ? 'Sending...' : 'Submit question'}
          </button>
        </div>)}
        {!currentUser && <p>Log in to ask questions.</p>}
      </div>

      {product.category_id === 16 && (
        <>
          <div className="section-divider" style={{ marginTop: 40, marginBottom: 10 }} />
          <div style={{ marginTop: 20 }}>
            <h3>Seller Contact</h3>
            <p><strong>Nickname:</strong> {sellerInfo.nickname || '—'}</p>
            <p><strong>Email:</strong> {product.owneremail || '—'}</p>
            <p><strong>Phone:</strong> {sellerInfo.phone || '—'}</p>
          </div>
        </>
      )}
    </div>
  );
}

export default ProductDetailPage;