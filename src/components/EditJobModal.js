import React, { useEffect, useState } from 'react';
import supabase from '../supabase';
import YachtOfferForm from './YachtOfferForm';
import Modal from './Modal'; // Asegúrate que la ruta sea correcta según tu estructura

function EditJobModal({ jobId, onClose }) {
  const [initialData, setInitialData] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      setUser({ id: userId });

      const { data, error } = await supabase
        .from('yacht_work_offers')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) {
        console.error('Error fetching job:', error);
        onClose(); // opcional
      } else {
        setInitialData(data);
      }
      setLoading(false);
    };

    fetchData();
  }, [jobId]);

  const handleUpdate = async (updatedData) => {
    const { created_at, ...dataToUpdate } = updatedData;

    const { error } = await supabase
      .from('yacht_work_offers')
      .update(dataToUpdate)
      .eq('id', jobId);

    if (error) {
      alert('Error updating the offer');
    } else {
      alert('Offer updated successfully');
      onClose(); // cerrar modal tras guardar
    }
  };

  if (loading || !initialData || !user) return null;

  return (
    <Modal onClose={onClose}>
      <YachtOfferForm
        user={user}
        onOfferPosted={handleUpdate}
        initialValues={initialData}
        mode="edit"
      />
    </Modal>
  );
}

export default EditJobModal;