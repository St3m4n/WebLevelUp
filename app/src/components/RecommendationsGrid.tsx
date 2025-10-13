import React from 'react';
import { productos } from '../data/productos';
import './RecommendationsGrid.css';

// Selección simple: los primeros 4 productos del dataset
const recomendados = productos.slice(0, 4);

const RecommendationsGrid: React.FC = () => (
  <div className="container my-5">
    <h2 className="featured-categories-title">TE RECOMENDAMOS</h2>
    <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">
      {recomendados.map(producto => (
        <div className="col" key={producto.codigo}>
          <div className="card h-100" data-producto>
            <img src={producto.url} alt={producto.nombre} className="card-img-top" />
            <div className="card-body">
              <h5 className="card-title">{producto.nombre}</h5>
              <p className="card-text">{producto.descripcion}</p>
              <div className="d-flex justify-content-between align-items-center">
                <span className="price-highlight">${producto.precio.toLocaleString()}</span>
                <button className="btn btn-view-product">Ver producto</button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default RecommendationsGrid;
