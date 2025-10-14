import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import styles from './Admin.module.css';

const AdminLayout: React.FC = () => {
  return (
    <div className={styles.adminShell}>
      <AdminSidebar />
      <div className={styles.adminContent}>
        <Suspense fallback={<div className="container">Cargando panel...</div>}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
};

export default AdminLayout;
