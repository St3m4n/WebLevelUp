import { apiGet, apiPut } from '@/services/apiClient';

export type CartItemInput = {
  productCode: string;
  quantity: number;
};

export type CartDto = {
  userRun: string;
  items: CartItemInput[];
  totalQuantity: number;
  updatedAt: string;
};

export type UpdateCartRequest = {
  items: CartItemInput[];
  forceReplace?: boolean;
};

export const getCart = () => apiGet<CartDto>('/carts/me');

export const updateCart = (payload: UpdateCartRequest) =>
  apiPut<CartDto>('/carts/me', payload);
