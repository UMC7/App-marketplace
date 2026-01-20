import { useCallback, useState } from 'react';
import { toast } from 'react-toastify';
import supabase from '../../supabase';

const useProfileProducts = ({ currentUser }) => {
  const [products, setProducts] = useState([]);
  const [deletedProducts, setDeletedProducts] = useState([]);

  const setProductsData = useCallback((productData, deletedData) => {
    setProducts(productData || []);
    setDeletedProducts(deletedData || []);
  }, []);

  const handlePauseToggle = useCallback(
    async (productId, currentStatus) => {
      if (!currentUser) return;
      try {
        const { error } = await supabase
          .from('products')
          .update({ status: currentStatus === 'active' ? 'paused' : 'active' })
          .eq('id', productId);

        if (error) throw error;
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  status: currentStatus === 'active' ? 'paused' : 'active',
                }
              : p
          )
        );
      } catch (error) {
        console.error('Failed to update product status:', error.message);
        toast.error('Could not update product status.');
      }
    },
    [currentUser]
  );

  const handleDelete = useCallback(
    async (productId) => {
      if (!currentUser) return;
      const confirmDelete = window.confirm(
        'Are you sure you want to delete this product? This action will hide it from all users.'
      );
      if (!confirmDelete) return;

      try {
        const { error } = await supabase
          .from('products')
          .update({ status: 'deleted', deleted_at: new Date().toISOString() })
          .eq('id', productId);

        if (error) throw error;

        setProducts((prev) => prev.filter((p) => p.id !== productId));
        const { data: updatedDeleted } = await supabase
          .from('products')
          .select('*')
          .eq('owner', currentUser.id)
          .eq('status', 'deleted')
          .order('deleted_at', { ascending: false });
        setDeletedProducts(updatedDeleted);
        toast.error('Product deleted successfully.');
      } catch (error) {
        console.error('Failed to delete product:', error.message);
        toast.error('Could not delete the product.');
      }
    },
    [currentUser]
  );

  const handleRestore = useCallback(
    async (productId) => {
      if (!currentUser) return;
      const confirmRestore = window.confirm(
        'Do you want to restore this product as paused?'
      );
      if (!confirmRestore) return;

      try {
        const { error } = await supabase
          .from('products')
          .update({ status: 'paused', deleted_at: null })
          .eq('id', productId);

        if (error) throw error;

        setDeletedProducts((prev) => prev.filter((p) => p.id !== productId));
        const { data: updatedProducts } = await supabase
          .from('products')
          .select('*')
          .eq('owner', currentUser.id)
          .not('status', 'eq', 'deleted')
          .order('created_at', { ascending: false });
        setProducts(updatedProducts);
        toast.error('Product restored successfully.');
      } catch (error) {
        console.error('Failed to restore product:', error.message);
        toast.error('Could not restore the product.');
      }
    },
    [currentUser]
  );

  const refetchProducts = useCallback(async () => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('owner', currentUser.id)
        .not('status', 'eq', 'deleted')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error refreshing products:', error.message);
    }
  }, [currentUser]);

  return {
    products,
    deletedProducts,
    setProductsData,
    handlePauseToggle,
    handleDelete,
    handleRestore,
    refetchProducts,
  };
};

export default useProfileProducts;
