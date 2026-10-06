import React, { useEffect, useState } from 'react';
import supabase from '../supabase';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';
import PostEventForm from './PostEventForm';

function EditEventModal({ eventId, onClose, onUpdate }) {
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
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) {
        console.error('Error fetching event:', error);
        toast.error('Error loading event data.');
        onClose();
      } else {
        setInitialData(data);
      }

      setLoading(false);
    };

    fetchData();
  }, [eventId, currentUser?.id, onClose]);

  const handleUpdate = async (updatedData) => {
    if (!currentUser?.id) return;
    const { created_at, ...dataToUpdate } = updatedData;

    const { error } = await supabase
      .from('events')
      .update(dataToUpdate)
      .eq('id', eventId);

    if (error) {
      toast.error('Error updating the event');
    } else {
      toast.success('Event updated successfully');
      if (onUpdate) await onUpdate();
      onClose();
    }
  };

  if (loading || !initialData || !currentUser?.id) return null;

  return (
    <Modal onClose={onClose}>
      <PostEventForm
        user={currentUser}
        onSubmit={handleUpdate}
        initialValues={initialData}
        mode="edit"
      />
    </Modal>
  );
}

export default EditEventModal;