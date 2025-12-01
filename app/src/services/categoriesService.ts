import { apiDelete, apiGet, apiPost } from '@/services/apiClient';
import type { Categoria } from '@/types';

export type CategoryDto = {
  id: number;
  nombre: string;
  eliminada: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const mapDtoToCategoria = (dto: CategoryDto): Categoria => ({
  id: dto.id,
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

export const createCategory = async (nombre: string): Promise<Categoria> => {
  const payload = await apiPost<CategoryDto>('/categories', { nombre });
  return mapDtoToCategoria(payload);
};

export const deleteCategory = async (categoriaId: number): Promise<void> => {
  await apiDelete<void>(`/categories/${encodeURIComponent(categoriaId)}`);
};

export const restoreCategory = async (
  categoriaId: number
): Promise<Categoria> => {
  const payload = await apiPost<CategoryDto>(
    `/categories/${encodeURIComponent(categoriaId)}/restore`
  );
  return mapDtoToCategoria(payload);
};
