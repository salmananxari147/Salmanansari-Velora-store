export const FREE_SHIPPING_AT = 200;
export const SHIPPING_FEE = 18;

export function shippingFor(itemsPrice) {
  if (itemsPrice <= 0 || itemsPrice >= FREE_SHIPPING_AT) return 0;
  return SHIPPING_FEE;
}

export function couponDiscount(coupon, itemsPrice) {
  if (!coupon) return 0;
  if (coupon.minOrder && itemsPrice < coupon.minOrder) {
    const error = new Error(`This code requires a minimum of $${coupon.minOrder}`);
    error.status = 400;
    throw error;
  }
  const raw = coupon.type === 'percent' ? (itemsPrice * coupon.value) / 100 : coupon.value;
  return Math.min(itemsPrice, Math.max(0, Math.round(raw * 100) / 100));
}

export function totals(itemsPrice, discount = 0) {
  const shippingPrice = shippingFor(itemsPrice);
  const totalPrice = Math.round((itemsPrice - discount + shippingPrice) * 100) / 100;
  return { shippingPrice, discount, totalPrice };
}
