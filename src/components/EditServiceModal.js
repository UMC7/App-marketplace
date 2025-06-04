import React, { useEffect, useState } from 'react';
import supabase from '../supabase';
import { toast } from 'react-toastify';
import PostServiceForm from './PostServiceForm';
import Modal from './Modal';

function EditServiceModal({ serviceId, onClose, onUpdate }) {
  const [initialData, setInitialData] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      setUser({ id: userId });

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
  }, [serviceId]);

  const handleUpdate = async (updatedData) => {
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

  if (loading || !initialData || !user) return null;

  return (
    <Modal onClose={onClose}>
      <PostServiceForm
  user={user}
  onSubmit={handleUpdate}
  initialValues={initialData}
  mode="edit"
/>
    </Modal>
  );
}

export default EditServiceModal;