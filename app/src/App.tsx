import { Suspense } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import SecondaryNav from '@/components/SecondaryNav';

import './App.css';
import './styles/legacy.css';

const App: React.FC = () => {
  const location = useLocation();
  const hideSecondaryNav = location.pathname.startsWith('/admin');

  return (
    <div className="app-shell">
      <Navbar />
      {!hideSecondaryNav && <SecondaryNav />}

      <main className="app-main">
        <Suspense
          fallback={<div className="container app-loading">Cargando...</div>}
        >
          <Outlet />
        </Suspense>
      </main>

      <Footer />
      <ScrollRestoration />
    </div>
  );
};

export default App;
