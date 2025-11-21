import { apiGet, apiPost, apiPatch, apiDelete } from '@/services/apiClient';
import type { Order } from '@/types';

export const fetchOrders = () => apiGet<Order[]>('/orders');

export const createOrder = (order: Omit<Order, 'id' | 'createdAt' | 'status'>) =>
  apiPost<Order>('/orders', order);

export const updateOrderStatus = (orderId: string, status: Order['status']) =>
  apiPatch<Order>(`/orders/${encodeURIComponent(orderId)}/status`, { status });

export const deleteOrder = (orderId: string) =>
  apiDelete<void>(`/orders/${encodeURIComponent(orderId)}`);
