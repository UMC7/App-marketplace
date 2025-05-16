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

  return { success: true, data };
}

/**
 * Verifica si un usuario ya ha dejado una valoración a otro.
 */
export async function hasReviewedBefore(reviewerId, reviewedUserId) {
  const { data, error } = await supabase
    .from('user_reviews')
    .select('id')
    .eq('reviewer_id', reviewerId)
    .eq('reviewed_user_id', reviewedUserId);

  if (error) {
    console.error('Error checking previous review:', error.message);
    return false;
  }

  return data.length > 0;
}