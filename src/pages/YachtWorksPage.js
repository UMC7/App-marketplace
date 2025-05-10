import React, { useEffect, useState } from 'react';
import supabase from '../supabase'; // ✅ Ruta corregida
import YachtOfferList from '../components/YachtOfferList';
import YachtOfferForm from '../components/YachtOfferForm';

function YachtWorksPage() {
  const [offers, setOffers] = useState([]);
  const [user, setUser] = useState(null);

  // Obtener usuario autenticado
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Obtener ofertas
  useEffect(() => {
    const fetchOffers = async () => {
      const { data, error } = await supabase
        .from('yacht_work_offers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching offers:', error);
      } else {
        setOffers(data);
      }
    };
    fetchOffers();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Yacht Work</h1>
      {user ? (
        <>
          <h2>Publica una oferta de empleo</h2>
          <YachtOfferForm user={user} onOfferPosted={() => window.location.reload()} />
        </>
      ) : (
        <p>Inicia sesión para publicar una oferta de empleo.</p>
      )}

      <h2>Ofertas disponibles</h2>
      <YachtOfferList offers={offers} currentUser={user} />
    </div>
  );
}

export default YachtWorksPage;