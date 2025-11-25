import { useQuery } from '@tanstack/react-query';
import { fetchCategories } from '@/services/categoriesService';
import type { Categoria } from '@/types';

const CATEGORIES_QUERY_KEY = ['categories'] as const;

export const useCategories = () => {
  const query = useQuery<Categoria[]>({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: fetchCategories,
  });

  const error = query.isError
    ? query.error instanceof Error
      ? query.error.message
      : 'No se pudieron cargar las categorías.'
    : null;

  return {
    categories: query.data ?? [],
    loading: query.isInitialLoading,
    error,
    refetch: query.refetch,
  };
};

export const categoriesQueryKeys = {
  all: CATEGORIES_QUERY_KEY,
};
