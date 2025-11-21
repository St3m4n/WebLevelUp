import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useProducts } from '@/hooks/useProducts';
import { useUsers } from '@/hooks/useUsers';
import type { ContactMessage, Order } from '@/types';
import { formatPrice } from '@/utils/format';
import {
  loadOrders,
  subscribeToOrders,
  ORDER_STORAGE_KEYS,
} from '@/utils/orders';
import {
  loadMessages,
  subscribeToMessages,
  MESSAGE_STORAGE_KEYS,
} from '@/utils/messages';
import styles from './Admin.module.css';
import SalesChartSection from './SalesChartSection';

type Metric = {
  label: string;
  value: string;
  helper?: string;
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const productos = useProducts();
  const { users } = useUsers();
  const [orders, setOrders] = useState<Order[]>(() => loadOrders());
  const [messages, setMessages] = useState<ContactMessage[]>(() =>
    loadMessages()
  );

  useEffect(() => {
    const unsubscribe = subscribeToOrders(() => {
      setOrders(loadOrders());
    });
    return () => {
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToMessages(() => {
      setMessages(loadMessages());
    });
    return () => {
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (event: StorageEvent) => {
      if (event.key === ORDER_STORAGE_KEYS.global) {
        setOrders(loadOrders());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (event: StorageEvent) => {
      if (event.key === MESSAGE_STORAGE_KEYS.key) {
        setMessages(loadMessages());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const metrics = useMemo<Metric[]>(() => {
    const totalProductos = productos.length;
    const totalStock = productos.reduce(
      (sum, producto) => sum + producto.stock,
      0
    );
    const lowStock = productos.filter(
      (producto) => producto.stock <= producto.stockCritico
    );
    const perfilesActivos = users.filter((item) => !item.isSystem);
    const totalUsuarios = perfilesActivos.length;
    const administradores = perfilesActivos.filter(
      (item) => item.perfil === 'Administrador'
    ).length;
    const totalOrders = orders.length;
    const revenue = orders.reduce((sum, order) => sum + order.total, 0);
    const pendingMessages = messages.filter(
      (message) => message.status === 'pendiente'
    ).length;
    const respondedMessages = messages.length - pendingMessages;

    return [
      {
        label: 'Productos publicados',
        value: totalProductos.toString(),
        helper: `${lowStock.length} con stock crítico`,
      },
      {
        label: 'Inventario total',
        value: totalStock.toLocaleString('es-CL'),
        helper: 'Unidades disponibles en catálogo',
      },
      {
        label: 'Usuarios activos',
        value: totalUsuarios.toString(),
        helper: `${administradores} administradores registrados`,
      },
      {
        label: 'Pedidos confirmados',
        value: totalOrders.toString(),
        helper:
          totalOrders > 0
            ? `Ingresos acumulados ${formatPrice(revenue)}`
            : 'Aún sin pedidos registrados',
      },
      {
        label: 'Mensajes pendientes',
        value: pendingMessages.toString(),
        helper:
          messages.length === 0
            ? 'Sin consultas registradas'
            : `${respondedMessages} respondidos`,
      },
    ];
  }, [messages, orders, productos, users]);

  const lowStockProducts = useMemo(
    () =>
      productos
        .filter((producto) => producto.stock <= producto.stockCritico)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 10),
    [productos]
  );

  const categoriasPopulares = useMemo(() => {
    const aggregates = productos.reduce<Record<string, number>>(
      (acc, producto) => {
        acc[producto.categoria] = (acc[producto.categoria] ?? 0) + 1;
        return acc;
      },
      {}
    );
    return Object.entries(aggregates)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([categoria, cantidad]) => ({ categoria, cantidad }));
  }, [productos]);

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 6);
  }, [orders]);

  const chartOrders = useMemo(
    () => orders.filter((order) => order.status !== 'Cancelado'),
    [orders]
  );

  return (
    <div className="container">
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Panel de control</h1>
          <p className={styles.subtitle}>
            {user?.nombre ? `Hola ${user.nombre}, ` : ''}aquí tienes una
            panorámica del catálogo y la comunidad.
          </p>
        </header>

        <section
          className={styles.metricsGrid}
          aria-label="Indicadores principales"
        >
          {metrics.map((metric) => (
            <article key={metric.label} className={styles.metricCard}>
              <span className={styles.metricLabel}>{metric.label}</span>
              <strong className={styles.metricValue}>{metric.value}</strong>
              {metric.helper && (
                <span className={styles.metricDelta}>{metric.helper}</span>
              )}
            </article>
          ))}
        </section>

        <SalesChartSection orders={chartOrders} />

        <section
          className={styles.sectionCard}
          aria-labelledby="admin-actions-heading"
        >
          <div className={styles.sectionHeader}>
            <h2 id="admin-actions-heading" className={styles.sectionTitle}>
              Accesos administrativos
            </h2>
            <span className={styles.metricDelta}>
              Atajos rápidos para los paneles clave
            </span>
          </div>

          <div className={styles.actionsRow}>
            <button
              type="button"
              className={styles.primaryAction}
              onClick={() => navigate('/admin/usuarios')}
            >
              Gestionar usuarios
            </button>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={() => navigate('/admin/productos')}
            >
              Gestionar productos
            </button>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={() => navigate('/admin/mensajes')}
            >
              Revisar mensajes
            </button>
          </div>
        </section>

        <section
          className={styles.sectionCard}
          aria-labelledby="low-stock-heading"
        >
          <div className={styles.sectionHeader}>
            <h2 id="low-stock-heading" className={styles.sectionTitle}>
              Productos con stock crítico
            </h2>
            <div className={styles.actionsRow}>
              <button
                type="button"
                className={styles.primaryAction}
                onClick={() => navigate('/admin/productos')}
              >
                Gestionar inventario
              </button>
              <button
                type="button"
                className={styles.secondaryAction}
                onClick={() => navigate('/tienda')}
              >
                Ver en tienda
              </button>
            </div>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className={styles.emptyState}>
              <strong>No hay productos en estado crítico.</strong>
              <span>
                ¡Mantén el catálogo actualizado para seguir vendiendo!
              </span>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Producto</th>
                    <th scope="col">Categoría</th>
                    <th scope="col">Stock</th>
                    <th scope="col">Mínimo</th>
                    <th scope="col">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map((producto) => (
                    <tr key={producto.codigo}>
                      <td>
                        <strong>{producto.nombre}</strong>
                        <div className={styles.metricDelta}>
                          SKU: {producto.codigo}
                        </div>
                      </td>
                      <td>{producto.categoria}</td>
                      <td>{producto.stock}</td>
                      <td>{producto.stockCritico}</td>
                      <td>
                        <span className={styles.statusBadge}>Bajo stock</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section
          className={styles.sectionCard}
          aria-labelledby="popular-categories-heading"
        >
          <div className={styles.sectionHeader}>
            <h2 id="popular-categories-heading" className={styles.sectionTitle}>
              Categorías con más catálogo
            </h2>
          </div>

          {categoriasPopulares.length === 0 ? (
            <div className={styles.emptyState}>
              <strong>Aún no hay categorías registradas.</strong>
              <span>Agrega productos para ver el detalle.</span>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Categoría</th>
                    <th scope="col">Productos</th>
                  </tr>
                </thead>
                <tbody>
                  {categoriasPopulares.map((categoria) => (
                    <tr key={categoria.categoria}>
                      <td>{categoria.categoria}</td>
                      <td>{categoria.cantidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section
          className={styles.sectionCard}
          aria-labelledby="orders-heading"
        >
          <div className={styles.sectionHeader}>
            <h2 id="orders-heading" className={styles.sectionTitle}>
              Últimos pedidos confirmados
            </h2>
            <div className={styles.actionsRow}>
              <button
                type="button"
                className={styles.primaryAction}
                onClick={() => navigate('/admin/pedidos')}
              >
                Gestionar pedidos
              </button>
              <span className={styles.metricDelta}>
                Total registrados: {orders.length}
              </span>
              <button
                type="button"
                className={styles.secondaryAction}
                onClick={() => navigate('/tienda')}
              >
                Ver catálogo
              </button>
            </div>
          </div>

          {recentOrders.length === 0 ? (
            <div className={styles.emptyState}>
              <strong>Aún no se registran pedidos.</strong>
              <span>
                Confirma compras desde el checkout para seguir este panel.
              </span>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Pedido</th>
                    <th scope="col">Cliente</th>
                    <th scope="col">Total</th>
                    <th scope="col">Items</th>
                    <th scope="col">Fecha</th>
                    <th scope="col">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => {
                    const itemsCount = order.items.reduce(
                      (sum, item) => sum + item.cantidad,
                      0
                    );
                    const formattedDate = new Date(
                      order.createdAt
                    ).toLocaleString('es-CL', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    });
                    const statusClass =
                      order.status === 'Pagado'
                        ? styles.statusBadgeHealthy
                        : order.status === 'Pendiente'
                          ? styles.statusBadgeCritical
                          : styles.statusBadgeOut;
                    const badgeClassName =
                      `${styles.statusBadge} ${statusClass}`.trim();

                    return (
                      <tr key={order.id}>
                        <td>
                          <strong>{order.id}</strong>
                          <div className={styles.metricDelta}>
                            {order.paymentMethod === 'transferencia'
                              ? 'Transferencia bancaria'
                              : 'Tarjeta'}
                          </div>
                        </td>
                        <td>
                          <div className={styles.userCell}>
                            <span className={styles.userName}>
                              {order.userName}
                            </span>
                            <span className={styles.productMeta}>
                              {order.userEmail}
                            </span>
                          </div>
                        </td>
                        <td>{formatPrice(order.total)}</td>
                        <td>{itemsCount}</td>
                        <td>{formattedDate}</td>
                        <td>
                          <span className={badgeClassName}>{order.status}</span>
                        </td>
                      </tr>
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

export default Dashboard;
