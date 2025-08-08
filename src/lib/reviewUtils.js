import supabase from '../supabase';

/**
 * Inserta una nueva valoración de usuario.
 * Registra una calificación única por producto y compra.
 */
export async function submitUserReview({
  reviewerId,
  reviewedUserId,
  rating,
  comment,
  role,
  purchaseId,
  productId,
}) {
  const { data, error } = await supabase
    .from('user_reviews')
    .insert([
      {
        reviewer_id: reviewerId,
        reviewed_user_id: reviewedUserId,
        rating,
        comment,
        role,
        purchase_id: purchaseId,
        product_id: productId,
      },
    ]);

  if (error) {
    console.error('Error submitting review:', error.message);
    return { success: false, error };
  }

  if (purchaseId) {
    await supabase
      .from('purchases')
      .update({ buyer_confirmed: true })
      .eq('id', purchaseId);
  }

  return { success: true, data };
}