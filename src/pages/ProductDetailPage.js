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
import './ProductDetailPage.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const formatSellerFullName = (seller) => {
  const parts = [seller?.first_name, seller?.last_name].filter(Boolean);
  return parts.join(' ').trim() || '-';
};
const SELLER_DETAILS_PUBLIC_FROM = Date.parse('2026-07-31T00:00:00Z');

function ProductDetailPage(props) {
  const params = useParams();
  const id = props.id || params.id;

  const { currentUser } = useAuth();
  const { addToCart, cartItems = [] } = useCarrito();
  const { favorites, addToFavorites } = useFavorites();

  const [product, setProduct] = useState(null);
  const [sellerInfo, setSellerInfo] = useState({ nickname: '', phone: '', first_name: '', last_name: '' });
  const [loading, setLoading] = useState(true);
  const [purchaseQty, setPurchaseQty] = useState(1);
  const [showSellerDetails, setShowSellerDetails] = useState(false);

  const [messages, setMessages] = useState([]);
  const [questionText, setQuestionText] = useState('');
  const [messageLoading, setMessageLoading] = useState(false);
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseText, setResponseText] = useState('');

  const [sellerRating, setSellerRating] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const sellerDetailsRef = React.useRef(null);

  const isFavorite = favorites.some((fav) => fav.id.toString() === id.toString());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

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

      if (productData?.owner) {
        const { data: sellerData, error: sellerError } = await supabase
          .rpc('rpc_public_product_seller', { p_product_id: Number(id) });
        const seller = Array.isArray(sellerData) ? sellerData[0] : sellerData;
        if (!sellerError && seller) {
          setSellerInfo({
            nickname: seller.nickname || '',
            phone: seller.phone || '',
            first_name: seller.first_name || '',
            last_name: seller.last_name || '',
          });
        } else {
          console.error('Error fetching seller info:', sellerError);
        }

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

  useEffect(() => {
    setShowSellerDetails(false);
  }, [id]);

  useEffect(() => {
    if (!showSellerDetails) return;
    sellerDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [showSellerDetails]);

  if (loading) return <p>Loading product...</p>;
  if (!product) return <p>Product not found.</p>;

  const isOwner = currentUser?.id === product.owner;
  const inCartQty = cartItems.find((item) => item.id === product.id)?.quantity || 0;
  const availableStock = Math.max(0, product.quantity - inCartQty);
  const isPaused = product.status === 'paused';
  const sellerDetailsAvailable =
    product.seller_contact_public === true ||
    (product.created_at && Number.isFinite(Date.parse(product.created_at)) && Date.parse(product.created_at) >= SELLER_DETAILS_PUBLIC_FROM);

  const handleAddToCart = () => {
    if (isPaused) return toast.error('This product is paused.');
    if (purchaseQty > availableStock) {
      return toast.error(`Only ${availableStock} units available.`);
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

  const allPhotos = Array.from(new Set([...(product.mainphoto ? [product.mainphoto] : []), ...(Array.isArray(product.photos) ? product.photos : [])].filter(Boolean)));
  const sliderSettings = { dots: true, infinite: allPhotos.length > 1, speed: 500, slidesToShow: 1, slidesToScroll: 1 };

  return (
    <div className="market-product-detail">
      <header className="market-product-detail-hero">
        <div className="market-product-detail-gallery">
          <Slider {...sliderSettings}>
            {allPhotos.map((photo, idx) => (
              <div key={idx}>
                <img src={photo} alt={`Product ${idx + 1}`} />
              </div>
            ))}
          </Slider>
        </div>
        <div className="market-product-detail-heading">
          <p className="market-product-detail-kicker">SeaMarket listing</p>
          <h1>{product.name}</h1>
          <p className="market-product-detail-price">
            {product.currency || ''} {Number(product.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </header>

      <section className="market-product-detail-section market-product-detail-facts-section">
        <h3>Product information</h3>
        <div className="market-product-detail-facts">
          <div><span>Condition</span><strong>{product.condition || 'Not specified'}</strong></div>
          <div><span>Available stock</span><strong>{availableStock}</strong></div>
          <div><span>City</span><strong>{product.city || 'Not specified'}</strong></div>
          <div><span>Country</span><strong>{product.country || 'Not specified'}</strong></div>
        </div>
      </section>

      <section className="market-product-detail-section">
        <h3>Description</h3>
        <p className="description-text market-product-detail-description">{product.description || 'No description provided.'}</p>
      </section>

      <section className="market-product-detail-section market-product-detail-rating">
        <h3>Seller rating</h3>
        {sellerRating
          ? <p><strong>{sellerRating} / 5</strong> based on seller reviews.</p>
          : <p>This seller does not have enough ratings to display an average yet.</p>}
        <button type="button" onClick={() => setShowRatingModal(true)} className="market-product-detail-secondary-btn">
          View seller ratings
        </button>
      </section>
      {showRatingModal && <RatingModal sellerId={product.owner} onClose={() => setShowRatingModal(false)} />}

      {!isPaused && !isOwner && currentUser && availableStock > 0 && (
        <section className="market-product-detail-section market-product-detail-actions">
          <h3>Ready to purchase?</h3>
          <label>
            Quantity
            <input type="number" min="1" max={availableStock} value={purchaseQty} onChange={(e) => setPurchaseQty(parseInt(e.target.value, 10))} />
          </label>
          <button className="market-product-detail-primary-btn" onClick={handleAddToCart} disabled={purchaseQty === 0 || product.category_id === 16}>
            Add to cart
          </button>
        </section>
      )}
      {!isPaused && !isOwner && currentUser && (
        <div className="market-product-detail-favorite">
          <button className="market-product-detail-secondary-btn" onClick={handleAddToFavorites} disabled={isFavorite}>
            {isFavorite ? 'In favorites' : 'Add to favorites'}
          </button>
        </div>
      )}

      <section className="market-product-detail-section product-detail-qa">
        <h3>Questions and Answers</h3>
        {messages.filter((m) => !m.receiver_id).map((q) => {
          const answer = messages.find((m) => m.receiver_id === q.id);
          return (
            <div key={q.id} style={{ borderBottom: '1px solid #ccc', marginBottom: 10, paddingBottom: 5 }}>
              <p><strong>{q.users?.nickname || 'User'}:</strong> {q.content}</p>
              {answer && <p style={{ marginLeft: 20, color: 'green' }}><strong>Seller:</strong> {answer.content}</p>}
              {isOwner && !answer && (
                <div style={{ marginLeft: 20 }}>
                  {respondingTo === q.id ? (
                    <>
                      <textarea rows={2} value={responseText} onChange={(e) => setResponseText(e.target.value)} placeholder="Type response..." /><br />
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
        {currentUser && !isOwner && (
          <div style={{ marginTop: 20 }}>
            <textarea rows={3} value={questionText} onChange={(e) => setQuestionText(e.target.value)} placeholder="Ask a question..." style={{ width: '100%' }} disabled={messageLoading} />
            <button className="landing-button" onClick={handleSubmitQuestion} disabled={messageLoading || !questionText.trim()} style={{ marginTop: 8 }}>
              {messageLoading ? 'Sending...' : 'Submit question'}
            </button>
          </div>
        )}
        {!currentUser && <p>Log in to ask questions.</p>}
      </section>

      <section className="market-product-detail-section market-product-detail-seller">
        <button
          type="button"
          className="market-product-detail-secondary-btn"
          disabled={!sellerDetailsAvailable}
          onClick={() => setShowSellerDetails((prev) => !prev)}
        >
          {sellerDetailsAvailable
            ? (showSellerDetails ? 'Hide Seller Details' : 'View Seller Details')
            : 'Seller details unavailable'}
        </button>


      {sellerDetailsAvailable && showSellerDetails && (
        <div ref={sellerDetailsRef} className="market-product-detail-seller-details">
          <h3>Seller Details</h3>
          <p><strong>Name:</strong> {formatSellerFullName(sellerInfo)}</p>
          <p><strong>Nickname:</strong> {sellerInfo.nickname || '-'}</p>
          <p><strong>Phone:</strong> {sellerInfo.phone || '-'}</p>
        </div>
      )}
      </section>
    </div>
  );
}

export default ProductDetailPage;
