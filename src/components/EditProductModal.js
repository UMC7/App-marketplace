// src/components/EditProductModal.js

import React, { useEffect, useState } from 'react';
import supabase from '../supabase';
import { toast } from 'react-toastify';
import Modal from './Modal';
import PostProductForm from './PostProductForm';

function EditProductModal({ productId, onClose, onUpdate }) {
  const [initialValues, setInitialValues] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error || !data) {
        toast.error('Error loading product.');
        onClose();
        return;
      }

      setInitialValues({
        name: data.name || '',
        description: data.description || '',
        price: data.price || '',
        currency: data.currency || '',
        quantity: data.quantity || 1,
        categoryId: data.category_id?.toString() || '',
        city: data.city || '',
        country: data.country || '',
        condition: data.condition || '',
        mainPhoto: data.mainphoto || '',
        photos: data.photos || [],
        id: data.id,
      });

      setLoading(false);
    };

    fetchProduct();
  }, [productId]);

  const handleUpdate = async (updatedData) => {
  const { id, created_at, ...dataToUpdate } = updatedData;

  const { error } = await supabase
    .from('products')
    .update(dataToUpdate)
    .eq('id', productId);

  if (error) {
    toast.error('Error updating product.');
  } else {
    toast.success('Product updated successfully.');
    onClose(); // ❗ esto debe llamarse sin await
    if (onUpdate) await onUpdate();
  }
};

  if (loading || !initialValues) return null;

  return (
    <Modal onClose={onClose}>
      <PostProductForm
        initialValues={initialValues}
        mode="edit"
        onSubmit={handleUpdate}
      />
    </Modal>
  );
}

export default EditProductModal;