import { useCallback, useState } from 'react';

const useProfileReviews = () => {
  const [receivedReviews, setReceivedReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(null);

  const setReviewsData = useCallback((reviewsData) => {
    const reviews = reviewsData || [];
    setReceivedReviews(reviews);

    const totalRatings = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating =
      reviews.length > 0 ? (totalRatings / reviews.length).toFixed(1) : null;
    setAverageRating(avgRating);
  }, []);

  return {
    receivedReviews,
    averageRating,
    setReviewsData,
  };
};

export default useProfileReviews;
