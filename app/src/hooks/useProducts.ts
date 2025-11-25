import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchProducts } from '@/services/products';
import type { Producto } from '@/types';

const PRODUCTS_QUERY_KEY = ['products'] as const;

export const useProducts = () => {
  const queryClient = useQueryClient();
  const query = useQuery<Producto[]>({
    queryKey: PRODUCTS_QUERY_KEY,
    queryFn: fetchProducts,
  });

  const refreshProducts = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: PRODUCTS_QUERY_KEY,
      refetchType: 'all',
    });
  }, [queryClient]);

  const error = query.isError
    ? query.error instanceof Error
      ? query.error.message
      : 'No se pudieron cargar los productos.'
    : null;

  return {
    products: query.data ?? [],
    loading: query.isInitialLoading,
    error,
    refreshProducts,
  };
};

export const productsQueryKeys = {
  all: PRODUCTS_QUERY_KEY,
};
