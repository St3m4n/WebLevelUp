import { useEffect, useState } from 'react';

import type { ProductRecord } from '@/utils/products';
import { loadProducts, subscribeToProducts } from '@/utils/products';

type UseProductsOptions = {
  includeDeleted?: boolean;
};

export const useProducts = (options?: UseProductsOptions): ProductRecord[] => {
  const { includeDeleted = false } = options ?? {};
  const [products, setProducts] = useState<ProductRecord[]>(() =>
    loadProducts({ includeDeleted })
  );

  useEffect(() => {
    setProducts(loadProducts({ includeDeleted }));

    const unsubscribe = subscribeToProducts(() => {
      setProducts(loadProducts({ includeDeleted }));
    });

    return () => {
      unsubscribe?.();
    };
  }, [includeDeleted]);

  return products;
};
