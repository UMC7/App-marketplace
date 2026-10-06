import React, { useEffect, useState } from 'react';
import supabase from '../supabase';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import YachtOfferForm from './YachtOfferForm';
import Modal from './Modal'; // Asegúrate que la ruta sea correcta según tu estructura

function EditJobModal({ jobId, onClose, onUpdate }) {
  const { currentUser } = useAuth();
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.id) {
        setLoading(false);
        return;
      }

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
  }, [jobId, currentUser?.id, onClose]);

  const handleUpdate = async (updatedData) => {
    if (!currentUser?.id) return;
    const { id, created_at, user_id, ...dataToUpdate } = updatedData;

    const { error } = await supabase
      .from('yacht_work_offers')
      .update(dataToUpdate)
      .eq('id', jobId);

    if (error) {
      toast.error('Error updating the offer');
    } else {
      toast.success('Offer updated successfully');
      if (onUpdate) await onUpdate();
      onClose();
    }
  };

  if (loading || !initialData || !currentUser?.id) return null;

  return (
    <Modal onClose={onClose}>
      <YachtOfferForm
        user={currentUser}
        onOfferPosted={handleUpdate}
        initialValues={initialData}
        mode="edit"
      />
    </Modal>
  );
}

export default EditJobModal;