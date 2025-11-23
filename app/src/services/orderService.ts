import { apiGet, apiPost, apiPatch, apiDelete } from '@/services/apiClient';
import type { Order, OrderStatus, PaymentPreferenceMethod } from '@/types';

export type OrderFilters = {
  userEmail?: string;
  status?: OrderStatus;
  paymentMethod?: PaymentPreferenceMethod;
  from?: string;
  to?: string;
  includeDeleted?: boolean;
};

export const fetchOrders = (filters: OrderFilters = {}) => {
  const params = new URLSearchParams();
  if (filters.userEmail) params.append('userEmail', filters.userEmail);
  if (filters.status) params.append('status', filters.status);
  if (filters.paymentMethod)
    params.append('paymentMethod', filters.paymentMethod);
  if (filters.from) params.append('from', filters.from);
  if (filters.to) params.append('to', filters.to);
  if (filters.includeDeleted) params.append('includeDeleted', 'true');

  return apiGet<Order[]>(`/orders?${params.toString()}`);
};

export const createOrder = (
  order: Omit<Order, 'id' | 'createdAt' | 'status'>
) => apiPost<Order>('/orders', order);

export const updateOrderStatus = (orderId: string, status: Order['status']) =>
  apiPatch<Order>(`/orders/${encodeURIComponent(orderId)}/status`, { status });

export const deleteOrder = (orderId: string) =>
  apiDelete<void>(`/orders/${encodeURIComponent(orderId)}`);

export const restoreOrder = (orderId: string) =>
  apiPost<Order>(`/orders/${encodeURIComponent(orderId)}/restore`);
