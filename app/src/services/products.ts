import { apiGet, apiPost, apiPatch, apiPut } from '@/services/apiClient';
import type { Producto } from '@/types';

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

const mapDtoToProduct = (dto: ProductDto): ProductDto => {
  return {
    ...dto,
    url: dto.url || dto.imagenUrl || '',
  };
};

export const fetchProducts = async (): Promise<ProductDto[]> => {
  const response = await apiGet<ProductListResponse>('/products', {
    auth: false,
  });
  const list = extractList(response);
  return list.map(mapDtoToProduct);
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

  let product: ProductDto | undefined;

  if (response && typeof response === 'object') {
    if ('codigo' in response) {
      product = response as ProductDto;
    } else if (response.product) {
      product = response.product;
    } else if (response.data) {
      product = response.data;
    }
  }

  if (product) {
    return mapDtoToProduct(product);
  }

  throw new Error('Producto no encontrado');
};

export const createProduct = (
  product: Omit<Producto, 'codigo'> & { codigo?: string; imagenUrl?: string }
) => {
  const { url, imagenUrl, ...rest } = product;
  const finalUrl = imagenUrl || url;
  const payload = {
    ...rest,
    imagenUrl: finalUrl,
  };
  console.log('createProduct payload:', JSON.stringify(payload, null, 2));
  return apiPost<Producto>('/products', payload);
};

export const updateProduct = (codigo: string, product: Partial<Producto>) => {
  const { url, ...rest } = product;
  // @ts-ignore
  const imagenUrl = product.imagenUrl;
  const finalUrl = imagenUrl || url;

  const payload = {
    ...rest,
    ...(finalUrl
      ? {
          imagenUrl: finalUrl,
        }
      : {}),
  };
  console.log('updateProduct payload:', JSON.stringify(payload, null, 2));
  return apiPut<Producto>(`/products/${encodeURIComponent(codigo)}`, payload);
};

export const deleteProduct = (codigo: string) =>
  apiPatch<void>(`/products/${encodeURIComponent(codigo)}`, {
    eliminado: true,
  });

export const restoreProduct = (codigo: string) =>
  apiPatch<void>(`/products/${encodeURIComponent(codigo)}`, {
    eliminado: false,
    deletedAt: null,
  });
