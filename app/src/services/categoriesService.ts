import { apiGet } from '@/services/apiClient';
import type { Categoria } from '@/types';

export type CategoryDto = {
  id: number;
  nombre: string;
  eliminada: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const mapDtoToCategoria = (dto: CategoryDto): Categoria => ({
  name: dto.nombre,
  deletedAt: dto.eliminada ? dto.updatedAt ?? null : undefined,
});

export const fetchCategories = async (): Promise<Categoria[]> => {
  const payload = await apiGet<CategoryDto[]>('/categories');
  if (!Array.isArray(payload)) {
    return [];
  }
  return payload.map(mapDtoToCategoria);
};
