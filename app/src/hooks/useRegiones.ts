import { useCallback, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/context/ToastContext';
import { fetchRegions, type RegionDto } from '@/services/regionsService';
import type { Region } from '@/types';

const REGIONES_QUERY_KEY = ['regiones'] as const;

const mapRegion = (dto: RegionDto): Region => ({
  id: dto.id,
  nombre: dto.nombre,
  comunas: (dto.comunas ?? []).map((nombre) => ({ nombre })),
});

export const useRegiones = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const query = useQuery<Region[], Error>({
    queryKey: REGIONES_QUERY_KEY,
    queryFn: async () => {
      const payload = await fetchRegions();
      return payload.map(mapRegion);
    },
  });

  useEffect(() => {
    if (!query.isError) return;
    addToast({
      variant: 'error',
      title: 'No se pudieron cargar las regiones',
      description: 'Intenta recargar la página para obtener la lista más reciente.',
    });
  }, [addToast, query.isError]);

  const reload = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: REGIONES_QUERY_KEY,
      refetchType: 'all',
    });
  }, [queryClient]);

  const regionNames = useMemo(
    () => query.data?.map((region) => region.nombre) ?? [],
    [query.data]
  );

  return {
    regions: query.data ?? [],
    regionNames,
    loading: query.isInitialLoading,
    reload,
  };
};

export const regionesQueryKeys = {
  all: REGIONES_QUERY_KEY,
};
