import { apiGet } from '@/services/apiClient';

export type RegionDto = {
  id: string;
  nombre: string;
  comunas: string[];
};

export const fetchRegions = () => apiGet<RegionDto[]>('/regiones');
