import supabase from '../supabase';

/**
 * Inserta una nueva valoración de usuario, asegurando que no se repita para la misma compra y producto.
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
  // ✅ Verificar si ya existe una review para este reviewer, compra y producto
  const { data: existingReviews, error: checkError } = await supabase
    .from('user_reviews')
    .select('id')
    .eq('reviewer_id', reviewerId)
    .eq('purchase_id', purchaseId)
    .eq('product_id', productId);

  if (checkError) {
    console.error('Error checking for existing review:', checkError.message);
    return { success: false, error: checkError };
  }

  if (existingReviews.length > 0) {
    return { success: false, error: { message: 'Review already submitted for this product and purchase.' } };
  }

  // ✅ Insertar la nueva review
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

  // ✅ Marcar compra como confirmada
  if (purchaseId) {
    await supabase
      .from('purchases')
      .update({ buyer_confirmed: true })
      .eq('id', purchaseId);
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