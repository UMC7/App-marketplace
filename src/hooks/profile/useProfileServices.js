import { useCallback, useState } from 'react';
import { toast } from 'react-toastify';
import supabase from '../../supabase';

const useProfileServices = ({ currentUser }) => {
  const [services, setServices] = useState([]);

  const setServicesData = useCallback((serviceData) => {
    setServices(serviceData || []);
  }, []);

  const fetchServices = useCallback(async () => {
    if (!currentUser) return;

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('owner', currentUser.id);

    if (error) {
      console.error('Error fetching services:', error.message);
    } else {
      setServices(data);
    }
  }, [currentUser]);

  const handlePauseToggleService = useCallback(
    async (serviceId, currentStatus) => {
      try {
        const { error } = await supabase
          .from('services')
          .update({ status: currentStatus === 'active' ? 'paused' : 'active' })
          .eq('id', serviceId);

        if (error) throw error;

        setServices((prev) =>
          prev.map((s) =>
            s.id === serviceId
              ? {
                  ...s,
                  status: currentStatus === 'active' ? 'paused' : 'active',
                }
              : s
          )
        );
      } catch (error) {
        console.error('Failed to update service status:', error.message);
        toast.error('Could not update service status.');
      }
    },
    []
  );

  const handleDeleteService = useCallback(async (serviceId) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this service? This action will hide it from all users.'
    );
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('services')
        .update({ status: 'deleted', deleted_at: new Date().toISOString() })
        .eq('id', serviceId);

      if (error) throw error;

      setServices((prev) => prev.filter((s) => s.id !== serviceId));
      toast.error('Service deleted successfully.');
    } catch (error) {
      console.error('Failed to delete service:', error.message);
      toast.error('Could not delete the service.');
    }
  }, []);

  const refetchServices = useCallback(async () => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('owner', currentUser.id)
        .not('status', 'eq', 'deleted')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error refreshing services:', error.message);
    }
  }, [currentUser]);

  return {
    services,
    setServicesData,
    fetchServices,
    handlePauseToggleService,
    handleDeleteService,
    refetchServices,
  };
};

export default useProfileServices;
