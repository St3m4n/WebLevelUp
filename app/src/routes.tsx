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
const Contacto = lazy(() => import('./pages/Contacto'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminProductos = lazy(() => import('./pages/admin/Productos'));
const AdminCategorias = lazy(() => import('./pages/admin/Categorias'));
const AdminUsuarios = lazy(() => import('./pages/admin/Usuarios'));
const AdminPedidos = lazy(() => import('./pages/admin/Pedidos'));
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
  { path: 'contacto', element: <Contacto /> },
      {
        path: 'admin',
        element: (
          <ProtectedRoute roles={['Administrador', 'Vendedor']}>
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/productos',
        element: (
          <ProtectedRoute roles={['Administrador']}>
            <AdminProductos />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/categorias',
        element: (
          <ProtectedRoute roles={['Administrador']}>
            <AdminCategorias />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/pedidos',
        element: (
          <ProtectedRoute roles={['Administrador', 'Vendedor']}>
            <AdminPedidos />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/usuarios',
        element: (
          <ProtectedRoute roles={['Administrador']}>
            <AdminUsuarios />
          </ProtectedRoute>
        ),
      },
      { path: 'admin/*', element: <Navigate to="/admin" replace /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export default router;
