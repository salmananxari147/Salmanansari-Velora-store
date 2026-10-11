import { ApiError } from '../utils/ApiError.js';

const methods = {
  cod: {
    id: 'cod',
    label: 'Cash on Delivery',
    async process() {
      return { provider: 'cod', status: 'pending' };
    },
  },
};

export function listPaymentMethods() {
  return Object.values(methods).map(({ id, label }) => ({ id, label }));
}

export async function processPayment(method) {
  const handler = methods[method];
  if (!handler) throw new ApiError('Choose a valid payment method', 400);
  return handler.process();
}
