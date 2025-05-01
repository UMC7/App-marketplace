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
  const { addToCart } = useCarrito();

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
    else console.error('Error al obtener mensajes:', error.message);
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

  const handleAddToFavorites = async () => {
    if (!currentUser) return alert('Debes iniciar sesión.');
    setFavLoading(true);
    const { error } = await supabase.from('favorites').insert({
      product_id: parseInt(id),
      user_id: currentUser.id,
    });
    if (error) alert('No se pudo agregar a favoritos.');
    else setIsFavorite(true);
    setFavLoading(false);
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

    if (error) {
      console.error('❌ Supabase insert error:', error.message);
      alert('Error al enviar la pregunta.');
    } else {
      setQuestionText('');
      fetchMessages();
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
    if (error) alert('Error al responder.');
    else {
      setResponseText('');
      setRespondingTo(null);
      fetchMessages();
    }
  };

  useEffect(() => {
    fetchProduct();
    fetchMessages();
    checkIfFavorite();
    // eslint-disable-next-line
  }, [id, currentUser]);

  if (loading) return <p>Cargando producto...</p>;
  if (!product) return <p>Producto no encontrado.</p>;

  const isOwner = currentUser?.id === product.owner;

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
  };

  const allPhotos = [
    ...(product.mainphoto ? [product.mainphoto] : []),
    ...(
      typeof product.photos === 'string'
        ? JSON.parse(product.photos)
        : (product.photos || [])
    ),
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
      <p>Precio: ${product.price}</p>
      <p>Stock: {product.quantity}</p>

      {!isOwner && (
        <button onClick={handleAddToFavorites} disabled={isFavorite || favLoading}>
          {isFavorite ? '✔ En favoritos' : 'Agregar a favoritos'}
        </button>
      )}

      {isOwner && <p style={{ color: 'gray' }}>Este es tu producto.</p>}

      {!isOwner && (
        <div style={{ marginTop: '20px' }}>
          <h3>Cantidad</h3>
          <input
            type="number"
            value={purchaseQty}
            onChange={(e) => setPurchaseQty(parseInt(e.target.value))}
            min="1"
            max={product.quantity}
          />
          <button onClick={() => addToCart(product, purchaseQty)} style={{ marginLeft: '10px' }}>
            Agregar al carrito
          </button>
        </div>
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
                          placeholder="Escribe tu respuesta..."
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

        {currentUser ? (
          !isOwner ? (
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
          ) : (
            <p>Eres el vendedor de este producto.</p>
          )
        ) : (
          <p>Inicia sesión para hacer preguntas.</p>
        )}
      </div>
    </div>
  );
}

export default ProductDetailPage;