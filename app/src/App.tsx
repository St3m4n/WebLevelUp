import FeaturedOffers from './components/FeaturedOffers';
import RecommendationsGrid from './components/RecommendationsGrid';
import Footer from './components/Footer';
import SecondaryNav from './components/SecondaryNav';

import './App.css';
import './styles/legacy.css';

function App() {
  return (
    <>
      {/* Header */}
      <header className="fixed-top">
        <nav className="navbar navbar-expand-lg top-nav d-none d-lg-block">
          <div className="container">
            <div className="collapse navbar-collapse">
              <ul className="navbar-nav ms-auto">
                <li className="nav-item"><a className="nav-link" href="#">Inicio</a></li>
                <li className="nav-item"><a className="nav-link" href="#">Categorias</a></li>
                <li className="nav-item"><a className="nav-link" href="#">Nosotros</a></li>
                <li className="nav-item"><a className="nav-link" href="#">Comunidad</a></li>
                <li className="nav-item"><a className="nav-link" href="#">Contacto</a></li>
              </ul>
            </div>
          </div>
        </nav>
        <nav className="navbar navbar-expand-lg navbar-dark py-3 primary-nav">
          <div className="container">
            <a className="navbar-brand" href="#">
              <img src="/assets/logo2.png" alt="Logo Level-UP Gamer" />
            </a>
            <div className="navbar-collapse w-100">
              <form className="d-none d-lg-flex mx-auto w-50 my-2" role="search">
                <input className="form-control me-2" type="search" placeholder="Buscar productos..." aria-label="Search" />
                <button className="btn btn-outline-light" type="submit"><i className="bi bi-search"></i></button>
              </form>
              <div className="d-flex justify-content-end">
                <div className="d-flex align-items-center">
                  <div className="nav-item dropdown ms-3">
                    <a className="nav-link" href="#" role="button">
                      <i className="bi bi-person-circle fs-4"></i>
                    </a>
                  </div>
                  <a href="#" className="nav-link ms-3"><i className="bi bi-cart fs-4"></i></a>
                </div>
              </div>
            </div>
          </div>
        </nav>
        <nav className="navbar navbar-expand-lg secondary-nav"></nav>

  {/* Barra de navegación secundaria */}
  <SecondaryNav />
  </header>

      {/* Hero */}
      <div className="hero-container">
        <div className="text-center hero-banner">
          <h1>BIENVENIDO A <span className="text-accent">LEVEL-UP</span></h1>
          <p className="lead">Explora, juega y gana recompensas.</p>
          <a href="#" className="btn btn-neon mt-2" role="button">¡Únete a la comunidad!</a>
        </div>
      </div>

      <FeaturedOffers />

      <RecommendationsGrid />

      <Footer />
    </>
  );
}

export default App;
