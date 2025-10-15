import { useCallback, useMemo } from 'react';

import { useAuth } from '@/context/AuthContext';

const DUOC_DISCOUNT_RATE = 0.2;

const sanitizePrice = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.round(value));
};

export type PriceBreakdown = {
  basePrice: number;
  finalPrice: number;
  hasDiscount: boolean;
  discountRate: number;
  savings: number;
};

export const usePricing = () => {
  const { user } = useAuth();

  const hasDuocDiscount = useMemo(() => {
    if (!user) return false;
    if (user.descuentoVitalicio) return true;
    const correo = user.correo?.toLowerCase() ?? '';
    return correo.endsWith('@duoc.cl');
  }, [user]);

  const discountRate = hasDuocDiscount ? DUOC_DISCOUNT_RATE : 0;

  const applyDiscount = useCallback(
    (price: number) => {
      const basePrice = sanitizePrice(price);
      if (!hasDuocDiscount) {
        return basePrice;
      }
      const discounted = Math.round(basePrice * (1 - DUOC_DISCOUNT_RATE));
      return Math.max(0, discounted);
    },
    [hasDuocDiscount]
  );

  const getPriceBreakdown = useCallback(
    (price: number): PriceBreakdown => {
      const basePrice = sanitizePrice(price);
      const finalPrice = applyDiscount(basePrice);
      const savings = Math.max(0, basePrice - finalPrice);

      return {
        basePrice,
        finalPrice,
        hasDiscount: hasDuocDiscount,
        discountRate,
        savings,
      };
    },
    [applyDiscount, discountRate, hasDuocDiscount]
  );

  return {
    hasDuocDiscount,
    discountRate,
    applyDiscount,
    getPriceBreakdown,
  };
};
