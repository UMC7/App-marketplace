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
      },
    ]);

  if (error) {
    console.error('Error submitting review:', error.message);
    return { success: false, error };
  }

  return { success: true, data };
}

/**
 * Obtiene todas las valoraciones recibidas por un usuario.
 */
export async function getUserReviews(userId) {
  const { data, error } = await supabase
    .from('user_reviews')
    .select('*')
    .eq('reviewed_user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reviews:', error.message);
    return [];
  }

  return data;
}

/**
 * Calcula el promedio de las valoraciones de un usuario.
 */
export async function getAverageRating(userId) {
  const { data, error } = await supabase
    .from('user_reviews')
    .select('rating')
    .eq('reviewed_user_id', userId);

  if (error) {
    console.error('Error fetching ratings:', error.message);
    return null;
  }

  if (data.length === 0) return null;

  const total = data.reduce((sum, r) => sum + r.rating, 0);
  return total / data.length;
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