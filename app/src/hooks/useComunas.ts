import { useCallback, useMemo } from 'react';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import type { Comuna, Region } from '@/types';
import { regionesQueryKeys } from '@/hooks/useRegiones';

const normalizeSelector = (value?: string | number): string | null => {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim().toLowerCase();
  return normalized ? normalized : null;
};

export const useComunas = (regionId?: string | number) => {
  const queryClient = useQueryClient();
  const selector = normalizeSelector(regionId);
  const regiones = queryClient.getQueryData<Region[]>(regionesQueryKeys.all) ?? [];

  const region = useMemo(() => {
    if (!selector) return null;
    return (
      regiones.find((item) => {
        if (item.id != null && String(item.id) === selector) {
          return true;
        }
        return item.nombre.toLowerCase() === selector;
      }) ?? null
    );
  }, [regiones, selector]);

  const comunas = region?.comunas ?? ([] as Comuna[]);

  const errorState = queryClient.getQueryState<Region[]>(regionesQueryKeys.all);
  const error = selector && errorState?.error
    ? errorState.error instanceof Error
      ? errorState.error.message
      : 'No se pudieron cargar las comunas.'
    : null;

  const isFetching = useIsFetching({ queryKey: regionesQueryKeys.all }) > 0;

  const refetch = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: regionesQueryKeys.all,
      refetchType: 'all',
    });
  }, [queryClient]);

  return {
    comunas,
    region,
    loading: Boolean(selector) && isFetching,
    error,
    refetch,
  };
};
