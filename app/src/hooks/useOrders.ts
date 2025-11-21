import { useCallback, useEffect, useState } from 'react';
import { fetchOrders, type OrderFilters } from '@/services/orderService';
import type { Order } from '@/types';

export const useOrders = (initialFilters?: OrderFilters) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshOrders = useCallback(
    async (filters?: OrderFilters) => {
      setLoading(true);
      try {
        const data = await fetchOrders(filters || initialFilters);
        setOrders(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch orders', err);
        setError('No se pudieron cargar los pedidos.');
      } finally {
        setLoading(false);
      }
    },
    [initialFilters]
  );

  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  return { orders, loading, error, refreshOrders };
};
