import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './App';
import ProtectedRoute from './routes/ProtectedRoute';

const Home = lazy(() => import('./pages/Home'));
const Tienda = lazy(() => import('./pages/Tienda'));
const ProductoDetalle = lazy(() => import('./pages/ProductoDetalle'));
const Carrito = lazy(() => import('./pages/Carrito'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Login = lazy(() => import('./pages/Login'));
const Registro = lazy(() => import('./pages/Registro'));
const Perfil = lazy(() => import('./pages/Perfil'));
const Contacto = lazy(() => import('./pages/Contacto'));
const Nosotros = lazy(() => import('./pages/Nosotros'));
const Comunidad = lazy(() => import('./pages/Comunidad'));
const ComunidadDetalle = lazy(() => import('./pages/ComunidadDetalle'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminProductos = lazy(() => import('./pages/admin/Productos'));
const AdminCategorias = lazy(() => import('./pages/admin/Categorias'));
const AdminUsuarios = lazy(() => import('./pages/admin/Usuarios'));
const AdminPedidos = lazy(() => import('./pages/admin/Pedidos'));
const AdminMensajes = lazy(() => import('./pages/admin/Mensajes'));
const AdminAuditoria = lazy(() => import('./pages/admin/Auditoria'));
const NotFound = lazy(() => import('./pages/NotFound'));

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'tienda', element: <Tienda /> },
      { path: 'tienda/:id', element: <ProductoDetalle /> },
      { path: 'carrito', element: <Carrito /> },
      { path: 'checkout', element: <Checkout /> },
      { path: 'login', element: <Login /> },
      { path: 'registro', element: <Registro /> },
      { path: 'nosotros', element: <Nosotros /> },
      { path: 'comunidad', element: <Comunidad /> },
      { path: 'comunidad/:slug', element: <ComunidadDetalle /> },
      {
        path: 'contacto',
        element: <Contacto />,
      },
      {
        path: 'perfil',
        element: (
          <ProtectedRoute>
            <Perfil />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin',
        element: (
          <ProtectedRoute roles={['Administrador', 'Vendedor']}>
            <AdminLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <AdminDashboard /> },
          {
            path: 'productos',
            element: (
              <ProtectedRoute roles={['Administrador']}>
                <AdminProductos />
              </ProtectedRoute>
            ),
          },
          {
            path: 'categorias',
            element: (
              <ProtectedRoute roles={['Administrador']}>
                <AdminCategorias />
              </ProtectedRoute>
            ),
          },
          {
            path: 'pedidos',
            element: (
              <ProtectedRoute roles={['Administrador', 'Vendedor']}>
                <AdminPedidos />
              </ProtectedRoute>
            ),
          },
          {
            path: 'mensajes',
            element: (
              <ProtectedRoute roles={['Administrador', 'Vendedor']}>
                <AdminMensajes />
              </ProtectedRoute>
            ),
          },
          {
            path: 'auditoria',
            element: (
              <ProtectedRoute roles={['Administrador']}>
                <AdminAuditoria />
              </ProtectedRoute>
            ),
          },
          {
            path: 'usuarios',
            element: (
              <ProtectedRoute roles={['Administrador']}>
                <AdminUsuarios />
              </ProtectedRoute>
            ),
          },
          { path: '*', element: <Navigate to="/admin" replace /> },
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export default router;
