import { useCallback, useState } from 'react';
import { toast } from 'react-toastify';
import { submitUserReview } from '../../lib/reviewUtils';
import {
  cancelPurchase,
  confirmPurchase,
  reportProblem,
} from '../../lib/purchaseStatus';

const useProfilePurchasesSales = ({ currentUser }) => {
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [updatedPurchaseStatuses, setUpdatedPurchaseStatuses] = useState({});
  const [sentReviews, setSentReviews] = useState([]);

  const setPurchasesSalesData = useCallback((salesData, purchasesData) => {
    setSales(salesData || []);
    setPurchases(purchasesData || []);
  }, []);

  const setSentReviewsData = useCallback((reviewsData) => {
    setSentReviews(reviewsData || []);
  }, []);

  const handleConfirmPurchase = useCallback(async (item) => {
    await confirmPurchase(item.purchases.id);
    toast.error('Purchase confirmed.');
    setPurchases((prev) =>
      prev.map((p) =>
        p.purchases.id === item.purchases.id
          ? {
              ...p,
              purchases: { ...p.purchases, status: 'completed', buyer_confirmed: true },
            }
          : p
      )
    );
    setUpdatedPurchaseStatuses((prev) => ({
      ...prev,
      [item.purchases.id]: 'completed',
    }));
  }, []);

  const handleReportProblem = useCallback(async (item) => {
    await reportProblem(item.purchases.id);
    toast.error('Problem reported.');
    setPurchases((prev) =>
      prev.map((p) =>
        p.purchases.id === item.purchases.id
          ? { ...p, purchases: { ...p.purchases, status: 'problem_reported' } }
          : p
      )
    );
    setUpdatedPurchaseStatuses((prev) => ({
      ...prev,
      [item.purchases.id]: 'problem_reported',
    }));
  }, []);

  const handleCancelPurchase = useCallback(async (item) => {
    await cancelPurchase(item.purchases.id);
    toast.error('Purchase cancelled.');
    setPurchases((prev) =>
      prev.map((p) =>
        p.purchases.id === item.purchases.id
          ? { ...p, purchases: { ...p.purchases, status: 'cancelled' } }
          : p
      )
    );
    setUpdatedPurchaseStatuses((prev) => ({
      ...prev,
      [item.purchases.id]: 'cancelled',
    }));
  }, []);

  const handleReviewSubmit = useCallback(
    async (e, item) => {
      e.preventDefault();
      if (!currentUser) return;

      const form = e.target;
      const rating = parseInt(form.rating.value, 10);
      const comment = form.comment.value;

      const reviewerId = currentUser.id;
      const reviewedUserId = item.products?.owner;

      console.log('Review submit: Purchase ID =', item.purchases?.id);

      const { success } = await submitUserReview({
        reviewerId,
        reviewedUserId,
        rating,
        comment,
        role: 'buyer',
        purchaseId: item.purchases?.id,
        productId: item.product_id,
      });

      if (success) {
        toast.error('Rating submitted successfully.');
        form.reset();
        setPurchases((prev) =>
          prev.map((p) =>
            p.purchases.id === item.purchases.id
              ? {
                  ...p,
                  purchases: {
                    ...p.purchases,
                    buyer_confirmed: true,
                    status: 'completed',
                  },
                }
              : p
          )
        );
      } else {
        toast.error('An error occurred while submitting the rating.');
      }
    },
    [currentUser]
  );

  return {
    sales,
    purchases,
    updatedPurchaseStatuses,
    sentReviews,
    setPurchasesSalesData,
    setSentReviewsData,
    handleConfirmPurchase,
    handleReportProblem,
    handleCancelPurchase,
    handleReviewSubmit,
  };
};

export default useProfilePurchasesSales;
