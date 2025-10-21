import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLevelUpStats } from '@/hooks/useLevelUpStats';
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
  const levelUp = useLevelUpStats();
  const pointsFormatter = useMemo(() => new Intl.NumberFormat('es-CL'), []);
  const referralDateFormatter = useMemo(
    () => new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }),
    []
  );
  const [referralFeedback, setReferralFeedback] = useState<string | null>(null);

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

  const referralCode = levelUp.stats?.referralCode ?? '';

  const referralLink = useMemo(() => {
    if (!referralCode) return '';
    if (typeof window === 'undefined') return '';
    const origin = window.location?.origin ?? '';
    return `${origin}/registro?ref=${referralCode}`;
  }, [referralCode]);

  const referrals = useMemo(() => {
    const users = levelUp.stats?.referidos?.users ?? [];
    return users
      .map((entry) => {
        const email = entry.email ?? '';
        if (!email) {
          return { email: '', dateLabel: '', timestamp: 0 };
        }
        const date = entry.date ? new Date(entry.date) : null;
        const timestamp =
          date && !Number.isNaN(date.getTime()) ? date.getTime() : 0;
        const dateLabel =
          date && !Number.isNaN(date.getTime())
            ? referralDateFormatter.format(date)
            : '';
        return { email, dateLabel, timestamp };
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [levelUp.stats, referralDateFormatter]);

  const referralCount = levelUp.stats?.referidos?.count ?? referrals.length;
  const totalExp = levelUp.totalExp;
  const totalPoints = levelUp.stats?.points ?? totalExp;
  const expToNextLevel = Math.max(
    0,
    levelUp.nextLevelExp - levelUp.currentExpIntoLevel
  );

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

  useEffect(() => {
    if (!referralFeedback) return;
    const timeout = window.setTimeout(() => {
      setReferralFeedback(null);
    }, 3000);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [referralFeedback]);

  const maskEmail = (email: string): string => {
    const [userPart, domainPart] = email.split('@');
    if (!userPart || !domainPart) return email;
    if (userPart.length <= 2) {
      return `${userPart[0] ?? ''}***@${domainPart}`;
    }
    const head = userPart.slice(0, 2);
    return `${head}***@${domainPart}`;
  };

  const handleCopyCode = async () => {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(referralCode);
      setReferralFeedback('Código copiado. ¡Comparte y gana EXP extra!');
    } catch (error) {
      console.warn('No se pudo copiar el código de referido', error);
      setReferralFeedback(
        'No pudimos copiar automáticamente. Copia el código manualmente.'
      );
    }
  };

  const handleShareReferral = async () => {
    if (!referralLink) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Únete a Level-Up Gamer',
          text: 'Regístrate con mi código y suma puntos al instante.',
          url: referralLink,
        });
        setReferralFeedback(
          '¡Link compartido! Gracias por invitar a tu squad.'
        );
        return;
      }
    } catch (error) {
      const isAbortError =
        error instanceof DOMException && error.name === 'AbortError';
      if (isAbortError) {
        return;
      }
      console.warn('No se pudo compartir el link de referido', error);
    }
    try {
      await navigator.clipboard.writeText(referralLink);
      setReferralFeedback('Link copiado al portapapeles.');
    } catch (error) {
      console.warn('No se pudo copiar el link de referido', error);
      setReferralFeedback('No pudimos copiar el link automáticamente.');
    }
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

          <section
            className={`${styles.card} ${styles.loyaltyCard}`}
            aria-labelledby="perfil-levelup"
          >
            <div className={styles.loyaltyHeader}>
              <div>
                <h2 id="perfil-levelup" className={styles.loyaltyTitle}>
                  Progreso Level-Up
                </h2>
                <p className={styles.loyaltySubtitle}>
                  {pointsFormatter.format(totalPoints)} puntos ·{' '}
                  {pointsFormatter.format(totalExp)} EXP acumulados.
                </p>
              </div>
              <span
                className={styles.levelBadge}
                aria-label={`Nivel ${levelUp.level}`}
              >
                Lv. {levelUp.level}
              </span>
            </div>

            <div
              className={styles.progressBar}
              role="progressbar"
              aria-valuenow={Math.round(levelUp.progressPct)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={styles.progressFill}
                style={{
                  width: `${Math.max(0, Math.min(100, levelUp.progressPct))}%`,
                }}
              />
            </div>
            <p className={styles.progressMeta}>
              {levelUp.nextLevelExp > 0 ? (
                <>
                  Te faltan {pointsFormatter.format(expToNextLevel)} EXP para
                  subir de nivel.
                  <span>
                    {pointsFormatter.format(levelUp.currentExpIntoLevel)} /{' '}
                    {pointsFormatter.format(levelUp.nextLevelExp)} EXP
                  </span>
                </>
              ) : (
                <>Has alcanzado el nivel máximo disponible.</>
              )}
            </p>

            <div className={styles.loyaltyStats}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>EXP por compras</span>
                <span className={styles.statValue}>
                  {pointsFormatter.format(levelUp.stats?.exp?.compras ?? 0)}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>EXP por torneos</span>
                <span className={styles.statValue}>
                  {pointsFormatter.format(levelUp.stats?.exp?.torneos ?? 0)}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>EXP por referidos</span>
                <span className={styles.statValue}>
                  {pointsFormatter.format(levelUp.stats?.exp?.referidos ?? 0)}
                </span>
              </div>
            </div>

            <div className={styles.referralSection}>
              <div className={styles.referralHeader}>
                <h3 className={styles.subsectionTitle}>Código de referido</h3>
                <span className={styles.referralCounter}>
                  {referralCount} {referralCount === 1 ? 'amigo' : 'amigos'}{' '}
                  invitados
                </span>
              </div>
              <div className={styles.referralInputGroup}>
                <input
                  className={styles.referralInput}
                  value={referralCode || 'Disponible al iniciar sesión'}
                  readOnly
                  aria-label="Tu código de referido"
                />
                <button
                  type="button"
                  className={styles.referralButton}
                  onClick={handleCopyCode}
                  disabled={!referralCode}
                >
                  Copiar código
                </button>
                <button
                  type="button"
                  className={styles.referralButton}
                  onClick={handleShareReferral}
                  disabled={!referralLink}
                >
                  Compartir enlace
                </button>
              </div>
              {referralFeedback && (
                <p className={styles.referralFeedback}>{referralFeedback}</p>
              )}
              <p className={styles.referralHint}>
                Comparte tu código: cada registro otorga 100 EXP para ambos.
              </p>
            </div>

            <div className={styles.referralListSection}>
              <h3 className={styles.subsectionTitle}>Historial de referidos</h3>
              {referrals.length === 0 ? (
                <p className={styles.referralEmpty}>
                  Aún no sumas referidos. ¡Comparte el enlace con tu squad
                  gamer!
                </p>
              ) : (
                <ul className={styles.referralList}>
                  {referrals.map((referral) => (
                    <li
                      key={referral.email}
                      className={styles.referralListItem}
                    >
                      <span className={styles.referralEmail}>
                        {maskEmail(referral.email)}
                      </span>
                      <span className={styles.referralDate}>
                        {referral.dateLabel || 'Reciente'}
                      </span>
                    </li>
                  ))}
                </ul>
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
