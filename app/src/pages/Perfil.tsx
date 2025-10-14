import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { Order } from '@/types';
import { formatPrice } from '@/utils/format';
import { loadOrders, subscribeToOrders } from '@/utils/orders';
import styles from './Perfil.module.css';

const dateFormatter = new Intl.DateTimeFormat('es-CL', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const Perfil: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>(() => loadOrders());

  useEffect(() => {
    const unsubscribe = subscribeToOrders(() => {
      setOrders(loadOrders());
    });
    return () => {
      unsubscribe?.();
    };
  }, []);

  const userOrders = useMemo(() => {
    if (!user) return [];
    const correo = user.correo.toLowerCase();
    return orders
      .filter((order) => order.userEmail.toLowerCase() === correo)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [orders, user]);

  const totalGastado = useMemo(() => {
    return userOrders.reduce((sum, order) => sum + order.total, 0);
  }, [userOrders]);

  const handleGoShop = () => {
    navigate('/tienda');
  };

  const handleGoAdmin = () => {
    navigate('/admin');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return null;
  }

  const fullName = [user.nombre, user.apellidos].filter(Boolean).join(' ');

  return (
    <div className="container">
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            Hola, {user.nombre.split(' ')[0] || 'Gamer'}
          </h1>
          <p className={styles.subtitle}>
            Aquí puedes revisar tus datos, seguir tus pedidos y acceder a tus
            paneles de gestión.
          </p>
        </header>

        <div className={styles.contentGrid}>
          <section className={styles.card} aria-labelledby="perfil-resumen">
            <div className={styles.profileMeta}>
              <div className={styles.avatar} aria-hidden="true">
                {user.nombre.charAt(0).toUpperCase()}
              </div>
              <div>
                <strong id="perfil-resumen" className={styles.metaValue}>
                  {fullName || user.correo}
                </strong>
              </div>
              <span className={styles.metaLabel}>{user.correo}</span>
              <span className={styles.ordersBadge}>{user.perfil}</span>
            </div>

            <dl className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <dt className={styles.infoLabel}>Región</dt>
                <dd className={styles.infoValue}>
                  {user.region || 'Sin registro'}
                </dd>
              </div>
              <div className={styles.infoItem}>
                <dt className={styles.infoLabel}>Comuna</dt>
                <dd className={styles.infoValue}>
                  {user.comuna || 'Sin registro'}
                </dd>
              </div>
              <div className={styles.infoItem}>
                <dt className={styles.infoLabel}>Dirección</dt>
                <dd className={styles.infoValue}>
                  {user.direccion ||
                    'Completa tu dirección para envíos rápidos.'}
                </dd>
              </div>
              <div className={styles.infoItem}>
                <dt className={styles.infoLabel}>Beneficios</dt>
                <dd className={styles.infoValue}>
                  {user.descuentoVitalicio
                    ? 'Descuento vitalicio activo'
                    : 'Sin beneficios especiales'}
                </dd>
              </div>
            </dl>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handleGoShop}
              >
                Ir a la tienda
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handleLogout}
              >
                Cerrar sesión
              </button>
              {['Administrador', 'Vendedor'].includes(user.perfil) && (
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={handleGoAdmin}
                >
                  Abrir panel admin
                </button>
              )}
            </div>
          </section>

          <section className={styles.card} aria-labelledby="perfil-pedidos">
            <div>
              <h2 id="perfil-pedidos">Historial de pedidos</h2>
              <p className={styles.metaLabel}>
                Has realizado {userOrders.length} pedidos por un total de{' '}
                <strong>{formatPrice(totalGastado)}</strong>.
              </p>
            </div>

            {userOrders.length === 0 ? (
              <div className={styles.ordersEmpty}>
                Aún no registras compras. ¡Explora la tienda y encuentra tu
                próximo setup!
              </div>
            ) : (
              <div className={styles.ordersTableWrapper}>
                <table className={styles.ordersTable}>
                  <thead>
                    <tr>
                      <th scope="col">Pedido</th>
                      <th scope="col">Fecha</th>
                      <th scope="col">Total</th>
                      <th scope="col">Items</th>
                      <th scope="col">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userOrders.map((order) => {
                      const itemsCount = order.items.reduce(
                        (sum, item) => sum + item.cantidad,
                        0
                      );
                      const formattedDate = dateFormatter.format(
                        new Date(order.createdAt)
                      );

                      return (
                        <tr key={order.id}>
                          <td>{order.id}</td>
                          <td>{formattedDate}</td>
                          <td>{formatPrice(order.total)}</td>
                          <td>{itemsCount}</td>
                          <td>{order.status}</td>
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
    </div>
  );
};

export default Perfil;
