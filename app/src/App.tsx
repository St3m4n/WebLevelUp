import { Suspense } from 'react';
import { Outlet, ScrollRestoration } from 'react-router-dom';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import SecondaryNav from '@/components/SecondaryNav';

import './App.css';
import './styles/legacy.css';

const App: React.FC = () => {
  return (
    <div className="app-shell">
      <Navbar />
      <SecondaryNav />

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
