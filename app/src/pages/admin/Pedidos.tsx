import {
  Fragment,
  type ChangeEvent,
  useCallback,
  useMemo,
  useState,
} from 'react';
import type { Order } from '@/types';
import { formatPrice } from '@/utils/format';
import { useOrders } from '@/hooks/useOrders';
import { updateOrderStatus, deleteOrder } from '@/services/orderService';
import { useAuditActor } from '@/hooks/useAuditActor';
import { recordAuditEvent } from '@/utils/audit';
import styles from './Admin.module.css';

type StatusFilter = 'all' | Order['status'];
type PaymentFilter = 'all' | Order['paymentMethod'];
type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';

type FiltersState = {
  query: string;
  status: StatusFilter;
  payment: PaymentFilter;
  sort: SortOption;
};

const statusLabels: Record<Order['status'], string> = {
  Pagado: 'Pagado',
  Pendiente: 'Pendiente',
  Cancelado: 'Cancelado',
};

const paymentLabels: Record<Order['paymentMethod'], string> = {
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  efectivo: 'Efectivo',
};

const defaultFilters: FiltersState = {
  query: '',
  status: 'all',
  payment: 'all',
  sort: 'newest',
};

const Pedidos: React.FC = () => {
  const { orders, refreshOrders } = useOrders();
  const [filters, setFilters] = useState<FiltersState>(defaultFilters);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const auditActor = useAuditActor();

  const logOrderEvent = useCallback(
    (
      action: 'status-changed' | 'deleted',
      order: Order,
      summary: string,
      metadata?: unknown
    ) => {
      recordAuditEvent({
        action,
        summary,
        entity: {
          type: 'orden',
          id: order.id,
          name: order.userEmail,
          context: order.userName,
        },
        metadata,
        actor: auditActor,
      });
    },
    [auditActor]
  );

  const summary = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        acc.total += 1;
        acc.revenue += order.total;
        if (order.status === 'Pagado') {
          acc.byStatus.Pagado += 1;
        }
        if (order.status === 'Pendiente') {
          acc.byStatus.Pendiente += 1;
          acc.pendingValue += order.total;
        }
        if (order.status === 'Cancelado') {
          acc.byStatus.Cancelado += 1;
        }
        return acc;
      },
      {
        total: 0,
        revenue: 0,
        pendingValue: 0,
        byStatus: {
          Pagado: 0,
          Pendiente: 0,
          Cancelado: 0,
        } as Record<Order['status'], number>,
      }
    );
  }, [orders]);

  const displayedOrders = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    const filtered = orders.filter((order) => {
      if (query) {
        const haystack =
          `${order.id} ${order.userName} ${order.userEmail}`.toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }

      if (filters.status !== 'all' && order.status !== filters.status) {
        return false;
      }

      if (
        filters.payment !== 'all' &&
        order.paymentMethod !== filters.payment
      ) {
        return false;
      }

      return true;
    });

    return filtered.sort((a, b) => {
      switch (filters.sort) {
        case 'oldest':
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case 'highest':
          return b.total - a.total;
        case 'lowest':
          return a.total - b.total;
        case 'newest':
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });
  }, [orders, filters]);

  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, query: event.target.value }));
  };

  const handleStatusFilterChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({
      ...prev,
      status: event.target.value as StatusFilter,
    }));
  };

  const handlePaymentFilterChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({
      ...prev,
      payment: event.target.value as PaymentFilter,
    }));
  };

  const handleSortChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({
      ...prev,
      sort: event.target.value as SortOption,
    }));
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
  };

  const handleStatusChange = async (order: Order, status: Order['status']) => {
    if (order.status === status) return;
    try {
      const updated = await updateOrderStatus(order.id, status);
      await refreshOrders();
      logOrderEvent(
        'status-changed',
        updated,
        `Estado del pedido ${updated.id} actualizado a ${status}`,
        {
          estadoAnterior: order.status,
          estadoNuevo: status,
        }
      );
    } catch (error) {
      console.error('Error updating order status', error);
    }
  };

  const handleRemoveOrder = async (order: Order) => {
    if (typeof window === 'undefined') return;
    const confirmed = window.confirm(
      `¿Eliminar el pedido ${order.id}? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    try {
      await deleteOrder(order.id);
      await refreshOrders();
      setExpandedOrder((prev) => (prev === order.id ? null : prev));
      logOrderEvent(
        'deleted',
        order,
        `Pedido ${order.id} eliminado del registro`,
        {
          total: order.total,
          estado: order.status,
          articulos: order.items.length,
        }
      );
    } catch (error) {
      console.error('Error deleting order', error);
    }
  };

  const toggleExpanded = (orderId: string) => {
    setExpandedOrder((prev) => (prev === orderId ? null : orderId));
  };

  return (
    <div className="container">
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Pedidos</h1>
          <p className={styles.subtitle}>
            Revisa y gestiona los pedidos confirmados desde el checkout. Filtra
            por estado, método de pago y consulta el detalle de cada compra.
          </p>
        </header>

        <section className={styles.sectionCard}>
          <div className={styles.controlsBar}>
            <form
              className={styles.filtersForm}
              onSubmit={(event) => event.preventDefault()}
            >
              <input
                id="order-search"
                type="search"
                placeholder="Buscar por código, cliente o correo"
                value={filters.query}
                onChange={handleQueryChange}
                className={styles.searchInput}
                aria-label="Buscar pedidos"
              />
              <select
                id="order-status-filter"
                value={filters.status}
                onChange={handleStatusFilterChange}
                className={styles.selectInput}
                aria-label="Filtrar por estado"
              >
                <option value="all">Todos los estados</option>
                <option value="Pagado">Pagados</option>
                <option value="Pendiente">Pendientes</option>
                <option value="Cancelado">Cancelados</option>
              </select>
              <select
                id="order-payment-filter"
                value={filters.payment}
                onChange={handlePaymentFilterChange}
                className={styles.selectInput}
                aria-label="Filtrar por método de pago"
              >
                <option value="all">Todos los métodos</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
                <option value="efectivo">Efectivo</option>
              </select>
              <select
                id="order-sort"
                value={filters.sort}
                onChange={handleSortChange}
                className={styles.selectInput}
                aria-label="Ordenar pedidos"
              >
                <option value="newest">Más recientes</option>
                <option value="oldest">Más antiguos</option>
                <option value="highest">Mayor monto</option>
                <option value="lowest">Menor monto</option>
              </select>
            </form>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={handleResetFilters}
            >
              Limpiar filtros
            </button>
          </div>

          <div className={styles.resultsSummary}>
            <span>
              Total pedidos: <strong>{summary.total}</strong>
            </span>
            <span>
              Pagados: <strong>{summary.byStatus.Pagado}</strong>
            </span>
            <span>
              Pendientes: <strong>{summary.byStatus.Pendiente}</strong>
            </span>
            <span>
              Cancelados: <strong>{summary.byStatus.Cancelado}</strong>
            </span>
            <span>
              Ingresos acumulados:{' '}
              <strong>{formatPrice(summary.revenue)}</strong>
            </span>
            {summary.byStatus.Pendiente > 0 && (
              <span>
                Por confirmar:{' '}
                <strong>{formatPrice(summary.pendingValue)}</strong>
              </span>
            )}
          </div>

          {displayedOrders.length === 0 ? (
            <div className={styles.emptyResults}>
              <strong>No hay pedidos que coincidan con los filtros.</strong>
              <span>Confirma una compra o ajusta los criterios.</span>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Pedido</th>
                    <th scope="col">Cliente</th>
                    <th scope="col">Total</th>
                    <th scope="col">Pago</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Creado</th>
                    <th scope="col" style={{ textAlign: 'right' }}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayedOrders.map((order) => {
                    const isExpanded = expandedOrder === order.id;
                    const createdAt = new Date(order.createdAt).toLocaleString(
                      'es-CL',
                      {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }
                    );
                    const itemsCount = order.items.reduce(
                      (sum, item) => sum + item.cantidad,
                      0
                    );

                    return (
                      <Fragment key={order.id}>
                        <tr>
                          <td>
                            <strong>{order.id}</strong>
                            <div className={styles.metricDelta}>
                              {itemsCount}{' '}
                              {itemsCount === 1 ? 'producto' : 'productos'}
                            </div>
                          </td>
                          <td>
                            <div className={styles.userCell}>
                              <span className={styles.userName}>
                                {order.userName || 'Sin nombre'}
                              </span>
                              <span className={styles.productMeta}>
                                {order.userEmail}
                              </span>
                            </div>
                          </td>
                          <td>{formatPrice(order.total)}</td>
                          <td>{paymentLabels[order.paymentMethod]}</td>
                          <td>
                            <select
                              className={styles.tableSelect}
                              value={order.status}
                              onChange={(event) =>
                                handleStatusChange(
                                  order,
                                  event.target.value as Order['status']
                                )
                              }
                            >
                              <option value="Pagado">Pagado</option>
                              <option value="Pendiente">Pendiente</option>
                              <option value="Cancelado">Cancelado</option>
                            </select>
                          </td>
                          <td>{createdAt}</td>
                          <td>
                            <div className={styles.tableActions}>
                              <button
                                type="button"
                                className={styles.tableActionButton}
                                onClick={() => toggleExpanded(order.id)}
                              >
                                {isExpanded
                                  ? 'Ocultar detalles'
                                  : 'Ver detalles'}
                              </button>
                              <button
                                type="button"
                                className={`${styles.tableActionButton} ${styles.tableActionButtonDanger}`.trim()}
                                onClick={() => handleRemoveOrder(order)}
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className={styles.orderDetailsRow}>
                            <td colSpan={7}>
                              <div className={styles.orderDetails}>
                                <div className={styles.orderMetaGrid}>
                                  <span>
                                    Estado actual:{' '}
                                    <strong>
                                      {statusLabels[order.status]}
                                    </strong>
                                  </span>
                                  <span>
                                    Método de pago:{' '}
                                    <strong>
                                      {paymentLabels[order.paymentMethod]}
                                    </strong>
                                  </span>
                                  <span>
                                    Total:{' '}
                                    <strong>{formatPrice(order.total)}</strong>
                                  </span>
                                  {order.direccion && (
                                    <span>Dirección: {order.direccion}</span>
                                  )}
                                  {order.region && (
                                    <span>Región: {order.region}</span>
                                  )}
                                  {order.comuna && (
                                    <span>Comuna: {order.comuna}</span>
                                  )}
                                </div>
                                <div>
                                  <h3 className={styles.orderDetailsTitle}>
                                    Artículos
                                  </h3>
                                  <ul className={styles.orderItemsList}>
                                    {order.items.map((item) => (
                                      <li
                                        key={`${order.id}-${item.codigo}`}
                                        className={styles.orderItem}
                                      >
                                        <div>
                                          <strong>{item.nombre}</strong>
                                          <div className={styles.orderItemMeta}>
                                            <span>SKU: {item.codigo}</span>
                                            <span>
                                              Unidad:{' '}
                                              {formatPrice(item.precioUnitario)}
                                            </span>
                                            <span>
                                              Cantidad: {item.cantidad}
                                            </span>
                                          </div>
                                        </div>
                                        <span className={styles.orderItemTotal}>
                                          {formatPrice(item.subtotal)}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Pedidos;
