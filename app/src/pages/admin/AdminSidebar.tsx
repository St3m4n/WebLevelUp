import { useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { UsuarioPerfil } from '@/types';
import styles from './Admin.module.css';

type NavItem = {
  to: string;
  label: string;
  roles: Readonly<UsuarioPerfil[]>;
  end?: boolean;
};

const navItems: NavItem[] = [
  {
    to: '/admin',
    label: 'Dashboard',
    roles: ['Administrador', 'Vendedor'],
    end: true,
  },
  { to: '/admin/productos', label: 'Productos', roles: ['Administrador'] },
  { to: '/admin/categorias', label: 'Categorías', roles: ['Administrador'] },
  {
    to: '/admin/pedidos',
    label: 'Pedidos',
    roles: ['Administrador', 'Vendedor'],
  },
  {
    to: '/admin/mensajes',
    label: 'Mensajes',
    roles: ['Administrador', 'Vendedor'],
  },
  { to: '/admin/auditoria', label: 'Auditoría', roles: ['Administrador'] },
  { to: '/admin/usuarios', label: 'Usuarios', roles: ['Administrador'] },
];

const AdminSidebar: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user, logout } = useAuth();

  const availableItems = useMemo(() => {
    if (!user) return [];
    return navItems.filter((item) => item.roles.includes(user.perfil));
  }, [user]);

  const handleLogout = () => {
    logout();
    addToast({
      variant: 'info',
      title: 'Sesión cerrada',
      description: 'Tu sesión de administrador se cerró correctamente.',
    });
    navigate('/');
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarInner}>
        <div className={styles.sidebarHeader}>
          <span className={styles.sidebarBrand}>Level-Up Admin</span>
          {user && (
            <span className={styles.sidebarUser}>
              {user.nombre}
              <span className={styles.sidebarRole}>{user.perfil}</span>
            </span>
          )}
        </div>

        <nav className={styles.sidebarNav} aria-label="Administración">
          {availableItems.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  styles.sidebarNavLink,
                  isActive ? styles.sidebarNavLinkActive : '',
                ]
                  .filter(Boolean)
                  .join(' ')
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className={styles.sidebarFooter}>
        <button
          type="button"
          className={styles.sidebarLogout}
          onClick={handleLogout}
        >
          Cerrar sesión
        </button>
        <button
          type="button"
          className={styles.sidebarSecondary}
          onClick={() => navigate('/tienda')}
        >
          Volver a la tienda
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
