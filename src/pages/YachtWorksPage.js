import React, { useEffect, useState } from 'react';
import supabase from '../supabase';
import YachtOfferList from '../components/YachtOfferList';

function YachtWorksPage() {
  const [offers, setOffers] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

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
      <h2>Ofertas disponibles</h2>
      <YachtOfferList offers={offers} currentUser={user} />
    </div>
  );
}

export default YachtWorksPage;