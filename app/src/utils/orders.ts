import type { Order, OrderItem } from '@/types';

const ORDER_STORAGE_KEY = 'levelup-orders';
const ORDER_UPDATED_EVENT = 'levelup-orders-updated';

const isBrowser = typeof window !== 'undefined';

const safeParse = (raw: string | null): unknown => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('No se pudo parsear órdenes guardadas', error);
    return null;
  }
};

const sanitizeOrder = (candidate: unknown): Order | null => {
  if (!candidate || typeof candidate !== 'object') return null;
  const partial = candidate as Partial<Order>;
  if (
    typeof partial.id !== 'string' ||
    typeof partial.userEmail !== 'string' ||
    typeof partial.total !== 'number' ||
    typeof partial.createdAt !== 'string' ||
    !Array.isArray(partial.items)
  ) {
    return null;
  }

  const items = (partial.items as unknown[])
    .map((item: unknown) => {
      if (!item || typeof item !== 'object') return null;
      const inner = item as Partial<OrderItem>;
      if (
        typeof inner.codigo !== 'string' ||
        typeof inner.nombre !== 'string' ||
        typeof inner.cantidad !== 'number' ||
        typeof inner.precioUnitario !== 'number'
      ) {
        return null;
      }
      const subtotal = inner.cantidad * inner.precioUnitario;
      return {
        codigo: inner.codigo,
        nombre: inner.nombre,
        cantidad: inner.cantidad,
        precioUnitario: inner.precioUnitario,
        subtotal,
      };
    })
    .filter(Boolean) as Order['items'];

  const paymentMethod: Order['paymentMethod'] =
    partial.paymentMethod === 'transferencia'
      ? 'transferencia'
      : partial.paymentMethod === 'efectivo'
        ? 'efectivo'
        : 'tarjeta';

  const status: Order['status'] =
    partial.status === 'Cancelado'
      ? 'Cancelado'
      : partial.status === 'Pendiente'
        ? 'Pendiente'
        : 'Pagado';

  return {
    id: partial.id,
    userEmail: partial.userEmail.toLowerCase(),
    userName: partial.userName ?? '',
    total: partial.total,
    createdAt: partial.createdAt,
    items,
    paymentMethod,
    direccion: partial.direccion ?? '',
    region: partial.region ?? '',
    comuna: partial.comuna ?? '',
    status,
  } satisfies Order;
};

export const loadOrders = (): Order[] => {
  if (!isBrowser) return [];
  const parsed = safeParse(window.localStorage.getItem(ORDER_STORAGE_KEY));
  if (!Array.isArray(parsed)) return [];
  return (parsed as unknown[])
    .map((item: unknown) => sanitizeOrder(item))
    .filter((item): item is Order => Boolean(item));
};

const persistOrders = (orders: Order[]) => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
    window.dispatchEvent(new Event(ORDER_UPDATED_EVENT));
  } catch (error) {
    console.warn('No se pudieron guardar las órdenes', error);
  }
};

export const addOrder = (order: Order) => {
  const current = loadOrders();
  const next = [...current, order];
  persistOrders(next);
};

export const subscribeToOrders = (listener: () => void) => {
  if (!isBrowser) return () => undefined;
  const handler = () => listener();
  window.addEventListener(ORDER_UPDATED_EVENT, handler);
  return () => window.removeEventListener(ORDER_UPDATED_EVENT, handler);
};

export const updateOrderStatus = (
  orderId: string,
  status: Order['status']
): Order | null => {
  const current = loadOrders();
  const index = current.findIndex((order) => order.id === orderId);
  if (index === -1) {
    return null;
  }
  if (current[index].status === status) {
    return current[index];
  }
  const next = [...current];
  const updated: Order = {
    ...current[index],
    status,
  };
  next[index] = updated;
  persistOrders(next);
  return updated;
};

export const removeOrder = (orderId: string): Order | null => {
  const current = loadOrders();
  const index = current.findIndex((order) => order.id === orderId);
  if (index === -1) {
    return null;
  }
  const removed = current[index];
  const next = [...current];
  next.splice(index, 1);
  persistOrders(next);
  return removed;
};

export const ORDER_STORAGE_KEYS = {
  global: ORDER_STORAGE_KEY,
  event: ORDER_UPDATED_EVENT,
};
