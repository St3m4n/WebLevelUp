import { apiGet } from '@/services/apiClient';

export type ProductDto = {
  codigo: string;
  nombre: string;
  categoria: string;
  fabricante: string;
  distribuidor: string;
  precio: number;
  stock: number;
  stockCritico: number;
  descripcion: string;
  imagenUrl?: string | null;
  url?: string | null;
  eliminado?: boolean;
  deletedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ProductListResponse =
  | ProductDto[]
  | {
      content?: ProductDto[];
      items?: ProductDto[];
      data?: ProductDto[];
      results?: ProductDto[];
    };

const extractList = (payload: ProductListResponse): ProductDto[] => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (!payload || typeof payload !== 'object') {
    return [];
  }
  if (Array.isArray(payload.content)) {
    return payload.content;
  }
  if (Array.isArray(payload.items)) {
    return payload.items;
  }
  if (Array.isArray(payload.data)) {
    return payload.data;
  }
  if (Array.isArray(payload.results)) {
    return payload.results;
  }
  return [];
};

export const fetchProducts = async (): Promise<ProductDto[]> => {
  const response = await apiGet<ProductListResponse>('/products', {
    auth: false,
  });
  return extractList(response);
};

export type ProductDetailResponse =
  | ProductDto
  | {
      product?: ProductDto;
      data?: ProductDto;
    };

export const fetchProductByCode = async (
  codigo: string
): Promise<ProductDto> => {
  const response = await apiGet<ProductDetailResponse>(
    `/products/${encodeURIComponent(codigo)}`,
    {
      auth: false,
    }
  );

  if (response && typeof response === 'object') {
    if ('codigo' in response) {
      return response as ProductDto;
    }
    if (response.product) {
      return response.product;
    }
    if (response.data) {
      return response.data;
    }
  }

  throw new Error('Producto no encontrado');
};
