import React from 'react';
import { productos } from '../data/productos';
import './FeaturedOffers.css';

// Selección fija de productos destacados como en el legacy
const destacados = [
  {
    ...productos.find(p => p.codigo === '1gamer') || {},
    nombre: 'Tarjetas de Video',
    precio: 194990,
    url: '/assets/1gamer.png',
    categoria: 'Tarjetas de Video',
  },
  {
    ...productos.find(p => p.codigo === '2gamer') || {},
    nombre: 'Monitores Gamer',
    precio: 97990,
    url: '/assets/2gamer.png',
    categoria: 'Monitores',
  },
  {
    ...productos.find(p => p.codigo === '3gamer') || {},
    nombre: 'Todo en SSD',
    precio: 23990,
    url: '/assets/3gamer.png',
    categoria: 'SSD',
  },
  {
    ...productos.find(p => p.codigo === '4gamer') || {},
    nombre: 'Memorias RAM',
    precio: 22990,
    url: '/assets/4gamer.png',
    categoria: 'Memorias',
  },
];

const FeaturedOffers: React.FC = () => (
  <section className="container my-5">
    <h2 className="featured-categories-title">OFERTAS IMPERDIBLES</h2>
    <div className="row g-4">
      <div className="col-lg-4 col-md-6">
        <a href="#" className="category-card category-card-tall shadow" style={{ backgroundImage: `url(${destacados[0].url})` }}>
          <div className="category-card-content">
            <h3>{destacados[0].nombre}</h3>
            <div className="category-price-box price-box-purple">
              <span>desde:</span>
              <strong>${destacados[0].precio.toLocaleString()}</strong>
            </div>
          </div>
        </a>
      </div>
      <div className="col-lg-4 col-md-6">
        <div className="vstack gap-4">
          <a href="#" className="category-card category-card-short shadow" style={{ backgroundImage: `url(${destacados[1].url})` }}>
            <div className="category-card-content">
              <h3>{destacados[1].nombre}</h3>
              <div className="category-price-box price-box-red">
                <span>desde:</span>
                <strong>${destacados[1].precio.toLocaleString()}</strong>
              </div>
            </div>
          </a>
          <a href="#" className="category-card category-card-short shadow" style={{ backgroundImage: `url(${destacados[2].url})` }}>
            <div className="category-card-content">
              <h3>{destacados[2].nombre}</h3>
              <div className="category-price-box price-box-cyan">
                <span>desde:</span>
                <strong>${destacados[2].precio.toLocaleString()}</strong>
              </div>
            </div>
          </a>
        </div>
      </div>
      <div className="col-lg-4 col-md-12">
        <a href="#" className="category-card category-card-tall shadow" style={{ backgroundImage: `url(${destacados[3].url})` }}>
          <div className="category-card-content">
            <h3>{destacados[3].nombre}</h3>
            <div className="category-price-box price-box-orange">
              <span>desde:</span>
              <strong>${destacados[3].precio.toLocaleString()}</strong>
            </div>
          </div>
        </a>
      </div>
    </div>
  </section>
);

export default FeaturedOffers;
