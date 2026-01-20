import { useCallback, useState } from 'react';
import { toast } from 'react-toastify';
import supabase from '../../supabase';

const useProfileEvents = ({ currentUser }) => {
  const [events, setEvents] = useState([]);
  const [deletedEvents, setDeletedEvents] = useState([]);

  const setEventsData = useCallback((eventData, deletedData) => {
    setEvents(eventData || []);
    setDeletedEvents(deletedData || []);
  }, []);

  const fetchEvents = useCallback(async () => {
    if (!currentUser) return;

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('owner', currentUser.id);

    if (error) {
      console.error('Error fetching events:', error.message);
    } else {
      setEvents(data);
    }
  }, [currentUser]);

  const updateEventStatus = useCallback(async (eventId, newStatus) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: newStatus })
        .eq('id', eventId);

      if (error) throw error;

      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, status: newStatus } : e))
      );
    } catch (error) {
      toast.error(`Failed to update status: ${error.message}`);
    }
  }, []);

  const deleteEvent = useCallback(
    async (eventId) => {
      const confirmDelete = window.confirm(
        'Are you sure you want to delete this event?'
      );
      if (!confirmDelete) return;

      try {
        const { error } = await supabase
          .from('events')
          .update({ status: 'deleted', updated_at: new Date().toISOString() })
          .eq('id', eventId);

        if (error) throw error;

        setEvents((prev) => prev.filter((e) => e.id !== eventId));
        const { data: updatedDeleted } = await supabase
          .from('events')
          .select('*')
          .eq('owner', currentUser.id)
          .eq('status', 'deleted')
          .order('updated_at', { ascending: false });
        setDeletedEvents(updatedDeleted);
        toast.error('Event deleted successfully.');
      } catch (error) {
        toast.error('Could not delete the event.');
      }
    },
    [currentUser]
  );

  const refetchEvents = useCallback(async () => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('owner', currentUser.id)
        .not('status', 'eq', 'deleted')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error refreshing events:', error.message);
    }
  }, [currentUser]);

  return {
    events,
    deletedEvents,
    setEventsData,
    fetchEvents,
    updateEventStatus,
    deleteEvent,
    refetchEvents,
  };
};

export default useProfileEvents;
