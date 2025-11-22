import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchProducts, fetchProductByCode } from '../products';
import * as apiClient from '../apiClient';

// Mock the API client
vi.mock('../apiClient', () => ({
    apiGet: vi.fn(),
    apiPost: vi.fn(),
    apiPut: vi.fn(),
    apiPatch: vi.fn(),
    apiDelete: vi.fn(),
}));

describe('products service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('fetchProducts', () => {
        it('should fetch and transform products correctly', async () => {
            const mockResponse = [
                {
                    codigo: 'P001',
                    nombre: 'Producto 1',
                    categoria: 'Categoria A',
                    precio: 1000,
                    stock: 10,
                    stockCritico: 2,
                    descripcion: 'Desc 1',
                    imagenUrl: 'http://example.com/img1.jpg',
                },
            ];

            vi.mocked(apiClient.apiGet).mockResolvedValue(mockResponse);

            const products = await fetchProducts();

            expect(apiClient.apiGet).toHaveBeenCalledWith('/products', { auth: false });
            expect(products).toHaveLength(1);
            expect(products[0]).toEqual({
                ...mockResponse[0],
                url: 'http://example.com/img1.jpg',
            });
        });

        it('should handle wrapped responses (content property)', async () => {
            const mockResponse = {
                content: [
                    {
                        codigo: 'P002',
                        nombre: 'Producto 2',
                        category: 'Categoria B', // Testing fallback mapping
                        precio: 2000,
                        stock: 5,
                        stockCritico: 1,
                        descripcion: 'Desc 2',
                    },
                ],
            };

            vi.mocked(apiClient.apiGet).mockResolvedValue(mockResponse);

            const products = await fetchProducts();

            expect(products).toHaveLength(1);
            expect(products[0].categoria).toBe('Categoria B');
        });
    });

    describe('fetchProductByCode', () => {
        it('should fetch a single product by code', async () => {
            const mockProduct = {
                codigo: 'P001',
                nombre: 'Producto 1',
                categoria: 'Categoria A',
                precio: 1000,
                stock: 10,
                stockCritico: 2,
                descripcion: 'Desc 1',
            };

            vi.mocked(apiClient.apiGet).mockResolvedValue(mockProduct);

            const product = await fetchProductByCode('P001');

            expect(apiClient.apiGet).toHaveBeenCalledWith('/products/P001', {
                auth: false,
            });
            expect(product.codigo).toBe('P001');
        });

        it('should throw error if product not found', async () => {
            vi.mocked(apiClient.apiGet).mockResolvedValue(null);

            await expect(fetchProductByCode('INVALID')).rejects.toThrow(
                'Producto no encontrado'
            );
        });
    });
});
