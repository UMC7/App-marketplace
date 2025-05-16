import supabase from '../supabase';

/**
 * Inserta una nueva valoración de usuario.
 */
export async function submitUserReview({
  reviewerId,
  reviewedUserId,
  rating,
  comment,
  role,
  purchaseId,
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