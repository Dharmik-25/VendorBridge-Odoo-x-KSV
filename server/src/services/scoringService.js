const { SCORING_WEIGHTS } = require('../config/constants');

/**
 * Calculates weighted score for a set of quotations for a single RFQ.
 * Formula:
 * - Price Score: (minPrice / currentPrice) * 100
 * - Delivery Score: (minDays / currentDays) * 100
 * - Rating Score: (vendorRating / 5) * 100
 * - Total Score = (0.6 * Price Score) + (0.3 * Delivery Score) + (0.1 * Rating Score)
 * 
 * Returns quotations with calculated scores.
 */
const calculateScores = (quotations) => {
  if (!quotations || quotations.length === 0) return [];

  // Find min price and min delivery days
  // Each quotation has items. We calculate total price for each quotation.
  const quotesWithTotals = quotations.map((q) => {
    const totalAmount = q.items.reduce((sum, item) => sum + parseFloat(item.unitPrice) * parseFloat(item.rfqItem.quantity), 0);
    const rating = q.vendor && q.vendor.rating ? parseFloat(q.vendor.rating) : 0;
    return {
      ...q,
      totalAmount,
      rating,
    };
  });

  const minPrice = Math.min(...quotesWithTotals.map((q) => q.totalAmount));
  const minDelivery = Math.min(...quotesWithTotals.map((q) => q.deliveryDays));

  return quotesWithTotals.map((q) => {
    // Price score: lower is better, so minPrice / totalAmount
    const priceScore = q.totalAmount > 0 ? (minPrice / q.totalAmount) * 100 : 0;

    // Delivery score: lower is better, so minDelivery / deliveryDays
    const deliveryScore = q.deliveryDays > 0 ? (minDelivery / q.deliveryDays) * 100 : 0;

    // Rating score: higher is better, rating / 5 * 100
    const ratingScore = (q.rating / 5.0) * 100;

    // Weighted average using constants (0.6, 0.3, 0.1)
    const priceWeight = 0.6;
    const deliveryWeight = 0.3;
    const ratingWeight = 0.1;

    const weightedScore = (priceScore * priceWeight) + (deliveryScore * deliveryWeight) + (ratingScore * ratingWeight);

    return {
      ...q,
      priceScore: parseFloat(priceScore.toFixed(2)),
      deliveryScore: parseFloat(deliveryScore.toFixed(2)),
      ratingScore: parseFloat(ratingScore.toFixed(2)),
      weightedScore: parseFloat(weightedScore.toFixed(2)),
    };
  });
};

module.exports = { calculateScores };
