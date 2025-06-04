import React, { useEffect, useState } from 'react';
import supabase from '../supabase';
import { toast } from 'react-toastify';
import Modal from './Modal';
import PostEventForm from './PostEventForm';

function EditEventModal({ eventId, onClose, onUpdate }) {
  const [initialData, setInitialData] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      setUser({ id: userId });

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
  }, [eventId, onClose]);

  const handleUpdate = async (updatedData) => {
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

  if (loading || !initialData || !user) return null;

  return (
    <Modal onClose={onClose}>
      <PostEventForm
        user={user}
        onSubmit={handleUpdate}
        initialValues={initialData}
        mode="edit"
      />
    </Modal>
  );
}

export default EditEventModal;