import React, { useEffect, useState } from 'react';
import supabase from '../supabase';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import PostServiceForm from './PostServiceForm';
import Modal from './Modal';

function EditServiceModal({ serviceId, onClose, onUpdate }) {
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
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .single();

      if (error) {
        console.error('Error fetching service:', error);
        onClose();
      } else {
        setInitialData(data);
      }

      setLoading(false);
    };

    fetchData();
  }, [serviceId, currentUser?.id, onClose]);

  const handleUpdate = async (updatedData) => {
    if (!currentUser?.id) return;
    const { created_at, ...dataToUpdate } = updatedData;

    const { error } = await supabase
      .from('services')
      .update(dataToUpdate)
      .eq('id', serviceId);

    if (error) {
      toast.error('Error updating the service');
    } else {
      toast.success('Service updated successfully');
      if (onUpdate) await onUpdate();
      onClose();
    }
  };

  if (loading || !initialData || !currentUser?.id) return null;

  return (
    <Modal onClose={onClose}>
      <PostServiceForm
        user={currentUser}
        onSubmit={handleUpdate}
        initialValues={initialData}
        mode="edit"
      />
    </Modal>
  );
}

export default EditServiceModal;