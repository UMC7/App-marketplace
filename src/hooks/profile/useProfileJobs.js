import { useCallback, useState } from 'react';
import { toast } from 'react-toastify';
import supabase from '../../supabase';

const useProfileJobs = ({ currentUser }) => {
  const [jobOffers, setJobOffers] = useState([]);
  const [deletedJobs, setDeletedJobs] = useState([]);

  const setJobsData = useCallback((offersData, deletedData) => {
    setJobOffers(offersData || []);
    setDeletedJobs(deletedData || []);
  }, []);

  const handlePauseToggleJob = useCallback(async (offerId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('yacht_work_offers')
        .update({ status: currentStatus === 'active' ? 'paused' : 'active' })
        .eq('id', offerId);

      if (error) throw error;

      setJobOffers((prev) =>
        prev.map((o) =>
          o.id === offerId
            ? { ...o, status: currentStatus === 'active' ? 'paused' : 'active' }
            : o
        )
      );
    } catch (error) {
      console.error('Failed to update job status:', error.message);
      toast.error('Could not update the job status.');
    }
  }, []);

  const handleDeleteJob = useCallback(async (offerId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this job offer?');
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('yacht_work_offers')
        .update({ status: 'deleted', deleted_at: new Date().toISOString() })
        .eq('id', offerId);

      if (error) throw error;

      setJobOffers((prev) => prev.filter((o) => o.id !== offerId));
      toast.error('Job deleted successfully.');
    } catch (error) {
      console.error('Failed to delete job:', error.message);
      toast.error('Could not delete the job offer.');
    }
  }, []);

  const refetchJobOffers = useCallback(async () => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase
        .from('yacht_work_offers')
        .select('*')
        .eq('user_id', currentUser.id)
        .not('status', 'eq', 'deleted')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobOffers(data || []);
    } catch (error) {
      console.error('Error refreshing job offers:', error.message);
    }
  }, [currentUser]);

  return {
    jobOffers,
    deletedJobs,
    setJobsData,
    handlePauseToggleJob,
    handleDeleteJob,
    refetchJobOffers,
  };
};

export default useProfileJobs;
