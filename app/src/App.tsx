import { Suspense } from 'react';
import { Outlet, ScrollRestoration } from 'react-router-dom';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
// SecondaryNav ahora se renderiza dentro de Navbar

import './App.css';
import './styles/legacy.css';

const App: React.FC = () => {
  // location handled inside Navbar when needed

  return (
    <div className="app-shell">
      <Navbar />
      {/* SecondaryNav se renderiza dentro de <Navbar /> */}

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
