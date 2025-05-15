// src/pages/ProductDetailPage.js

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import supabase from '../supabase';
import { useAuth } from '../context/AuthContext';
import { useCarrito } from '../context/CarritoContext';
import Slider from 'react-slick';

function ProductDetailPage() {
  const { id } = useParams();
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
    const fetchProduct = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (!error) setProduct(data);
      setLoading(false);
    };

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('id, content, sender_id, sent_at, product_id, receiver_id, users(nickname)')
        .eq('product_id', parseInt(id))
        .order('sent_at', { ascending: true });

      if (!error) setMessages(data);
    };

    const checkIfFavorite = async () => {
      if (!currentUser) return;
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('product_id', id)
        .eq('user_id', currentUser.id)
        .single();

      if (data) setIsFavorite(true);
    };

    fetchProduct();
    fetchMessages();
    checkIfFavorite();
  }, [id, currentUser]);

  if (loading) return <p>Cargando producto...</p>;
  if (!product) return <p>Producto no encontrado.</p>;

  const isOwner = currentUser?.id === product.owner;
  const enCarrito = cartItems.find(item => item.id === product.id)?.quantity || 0;
  const rawDisponible = product.quantity - enCarrito;
  const stockDisponible = Math.max(0, rawDisponible); // nunca negativo


  const handleAddToCart = () => {
    if (product.status === 'paused') {
      alert('Este producto está pausado y no puede ser añadido al carrito.');
      return;
    }

    if (purchaseQty > stockDisponible) {
      alert(`Solo puedes agregar hasta ${stockDisponible} unidades.`);
      return;
    }

    addToCart(product, purchaseQty);
    alert('Producto agregado al carrito.');
  };

  const handleAddToFavorites = async () => {
    if (product.status === 'paused') {
      alert('Este producto está pausado y no puede ser añadido a favoritos.');
      return;
    }

    if (!currentUser) return alert('Debes iniciar sesión.');
    setFavLoading(true);
    const { error } = await supabase.from('favorites').insert({
      product_id: parseInt(id),
      user_id: currentUser.id,
    });
    if (!error) setIsFavorite(true);
    setFavLoading(false);
  };

  const handleRemoveFavorite = async () => {
    if (!currentUser) return alert('Debes iniciar sesión.');
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('product_id', id)
      .eq('user_id', currentUser.id);

    if (!error) setIsFavorite(false);
    else alert('Error al eliminar de favoritos');
  };

  const handleSubmitQuestion = async () => {
    if (!currentUser || !questionText.trim()) return;
    if (product.owner === currentUser.id) {
      alert('No puedes preguntar sobre tu propio producto.');
      return;
    }

    setMessageLoading(true);
    const { error } = await supabase.from('messages').insert({
      sender_id: currentUser.id,
      content: questionText.trim(),
      product_id: parseInt(id),
    });

    if (!error) {
      setQuestionText('');
      const refreshed = await supabase
        .from('messages')
        .select('id, content, sender_id, sent_at, product_id, receiver_id, users(nickname)')
        .eq('product_id', parseInt(id))
        .order('sent_at', { ascending: true });

      setMessages(refreshed.data || []);
    }

    setMessageLoading(false);
  };

  const handleSubmitAnswer = async () => {
    if (!responseText.trim() || !respondingTo) return;
    const { error } = await supabase.from('messages').insert({
      sender_id: currentUser.id,
      content: responseText.trim(),
      product_id: parseInt(id),
      receiver_id: respondingTo,
    });

    if (!error) {
      setResponseText('');
      setRespondingTo(null);
      const refreshed = await supabase
        .from('messages')
        .select('id, content, sender_id, sent_at, product_id, receiver_id, users(nickname)')
        .eq('product_id', parseInt(id))
        .order('sent_at', { ascending: true });

      setMessages(refreshed.data || []);
    }
  };

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
  };

  const allPhotos = [
    ...(product.mainphoto ? [product.mainphoto] : []),
    ...(product.photos || []),
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h1>{product.name}</h1>

      <Slider {...settings}>
        {allPhotos.map((photo, index) => (
          <div key={index}>
            <img src={photo} alt={`Imagen ${index + 1}`} style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }} />
          </div>
        ))}
      </Slider>

      <h3>Descripción</h3>
      <p>{product.description}</p>

      <h3>Información del producto</h3>
      <p><strong>Precio:</strong> {product.currency || ''} {product.price}</p>
      <p><strong>Stock disponible:</strong> {stockDisponible}</p>
      <p><strong>Ciudad:</strong> {product.city}</p>
      <p><strong>País:</strong> {product.country}</p>
      <p><strong>Condición:</strong> {product.condition}</p>

      {product.status === 'paused' ? (
        <p style={{ color: 'red' }}>Este producto está pausado y no se puede agregar al carrito ni a favoritos.</p>
      ) : (
        <>
          {!isOwner && currentUser && stockDisponible > 0 && (
            <>
              <h3>Cantidad a comprar</h3>
              <input
                type="number"
                min="1"
                max={stockDisponible}
                value={purchaseQty}
                onChange={(e) => setPurchaseQty(parseInt(e.target.value))}
              />
              <button onClick={handleAddToCart}>Agregar al carrito</button>
            </>
          )}

          {!isOwner && currentUser && (
            <button onClick={handleAddToFavorites} disabled={isFavorite || favLoading}>
              {isFavorite ? '✔ En favoritos' : 'Agregar a favoritos'}
            </button>
          )}
        </>
      )}

      <div style={{ marginTop: 40 }}>
        <h3>Preguntas y Respuestas</h3>

        {messages
          .filter((msg) => !msg.receiver_id)
          .map((msg) => {
            const respuesta = messages.find((m) => m.receiver_id === msg.id);
            return (
              <div key={msg.id} style={{ borderBottom: '1px solid #ccc', marginBottom: 10 }}>
                <p><strong>{msg.users?.nickname || 'Usuario'}:</strong> {msg.content}</p>
                {respuesta && (
                  <p style={{ marginLeft: '20px', color: 'green' }}>
                    <strong>Vendedor:</strong> {respuesta.content}
                  </p>
                )}
                {isOwner && !respuesta && (
                  <div style={{ marginLeft: '20px' }}>
                    {respondingTo === msg.id ? (
                      <div>
                        <textarea
                          rows={2}
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                        />
                        <br />
                        <button onClick={handleSubmitAnswer}>Responder</button>
                        <button onClick={() => setRespondingTo(null)}>Cancelar</button>
                      </div>
                    ) : (
                      <button onClick={() => setRespondingTo(msg.id)}>Responder</button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

        {currentUser && !isOwner && (
          <div>
            <textarea
              rows={3}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Haz una pregunta..."
              style={{ width: '100%' }}
            />
            <button onClick={handleSubmitQuestion} disabled={messageLoading}>
              {messageLoading ? 'Enviando...' : 'Enviar pregunta'}
            </button>
          </div>
        )}

        {!currentUser && <p>Inicia sesión para hacer preguntas.</p>}
      </div>
    </div>
  );
}

export default ProductDetailPage;