import React from 'react';
import './Footer.css';

const Footer: React.FC = () => (
  <footer className="container-fluid py-3 mt-5">
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
      <div className="mb-3 mb-md-0">
        <a href="#" className="navbar-brand"><img src="/assets/logo2.png" alt="Logo Level-UP Gamer" /></a>
      </div>
      <div className="nav mb-3 mb-md-0">
        <a className="nav-link" href="#">Inicio</a>
        <a className="nav-link" href="#">Categorias</a>
        <a className="nav-link" href="#">Nosotros</a>
        <a className="nav-link" href="#">Comunidad</a>
        <a className="nav-link" href="#">Contacto</a>
      </div>
      <div className="d-flex gap-3">
        <a href="#" className="nav-link fs-4"><i className="bi bi-twitch"></i></a>
        <a href="#" className="nav-link fs-4"><i className="bi bi-instagram"></i></a>
        <a href="#" className="nav-link fs-4"><i className="bi bi-discord"></i></a>
      </div>
    </div>
  </footer>
);

export default Footer;
