import { useEffect, useState } from 'react';

import type { ProductRecord } from '@/utils/products';
import {
  loadProducts,
  requestProductsSync,
  subscribeToProducts,
} from '@/utils/products';

type UseProductsOptions = {
  includeDeleted?: boolean;
};

export const useProducts = (options?: UseProductsOptions): ProductRecord[] => {
  const { includeDeleted = false } = options ?? {};
  const [products, setProducts] = useState<ProductRecord[]>(() =>
    loadProducts({ includeDeleted })
  );

  useEffect(() => {
    let active = true;

    const syncProducts = () => {
      if (!active) {
        return;
      }
      setProducts(loadProducts({ includeDeleted }));
    };

    syncProducts();

    requestProductsSync().catch(() => undefined);

    const unsubscribe = subscribeToProducts(syncProducts);

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [includeDeleted]);

  return products;
};
