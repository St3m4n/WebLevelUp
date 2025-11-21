import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import type { Region } from '@/types';
import { regiones as fallbackRegiones } from '@/data/regionesComunas';
import { fetchRegions, type RegionDto } from '@/services/regionsService';

const mapRegion = (dto: RegionDto): Region => ({
  nombre: dto.nombre,
  comunas: dto.comunas.map((comuna) => ({ nombre: comuna })),
});

export const useRegions = () => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await fetchRegions();
      setRegions(payload.map(mapRegion));
    } catch (error) {
      console.warn('No se pudieron cargar las regiones', error);
      if (fallbackRegiones.length > 0) {
        setRegions(fallbackRegiones);
        addToast({
          variant: 'warning',
          title: 'Catálogo de regiones offline',
          description:
            'Usamos la lista guardada localmente mientras restauramos la conexión.',
        });
      } else {
        addToast({
          variant: 'error',
          title: 'No se pudieron cargar las regiones',
          description:
            'Intenta recargar la página para obtener la lista más reciente.',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    reload();
  }, [reload]);

  const regionNames = useMemo(
    () => regions.map((region) => region.nombre),
    [regions]
  );

  return {
    regions,
    regionNames,
    loading,
    reload,
  };
};
