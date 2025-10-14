import type { Producto } from '@/types';

import JM001 from '@/assets/JM001.webp';
import JM002 from '@/assets/JM002.png';
import JM003 from '@/assets/JM003.webp';
import AC001 from '@/assets/AC001.jpg';
import AC002 from '@/assets/AC002.webp';
import AC003 from '@/assets/AC003.png';
import CO001 from '@/assets/CO001.webp';
import CO002 from '@/assets/CO002.webp';
import CG001 from '@/assets/CG001.png';
import CG002 from '@/assets/CG002.jpg';
import SG001 from '@/assets/SG001.jpg';
import SG002 from '@/assets/SG002.png';
import MS001 from '@/assets/MS001.webp';
import MS002 from '@/assets/MS002.webp';
import MP001 from '@/assets/MP001.jpg';
import MP002 from '@/assets/MP002.jpg';
import PP001 from '@/assets/PP001.png';
import PP002 from '@/assets/PP002.png';
import PG001 from '@/assets/PG001.png';
import PG002 from '@/assets/PG002.png';

export const productos: Producto[] = [
  // --- Juegos de Mesa ---
  {
    codigo: 'JM001',
    nombre: 'Catan',
    categoria: 'Juegos de Mesa',
    fabricante: 'Kosmos',
    distribuidor: 'Level-Up',
    precio: 29990,
    stock: 12,
    stockCritico: 3,
    url: JM001,
    descripcion:
      'Catan es un clásico juego de estrategia donde los jugadores colonizan una isla, comercian recursos y compiten por la supremacía.',
  },
  {
    codigo: 'JM002',
    nombre: 'Carcassonne',
    categoria: 'Juegos de Mesa',
    fabricante: 'Hans im Glück',
    distribuidor: 'Level-Up',
    precio: 24990,
    stock: 7,
    stockCritico: 2,
    url: JM002,
    descripcion:
      'Carcassonne es un juego de colocación de losetas en el que construyes ciudades, caminos y monasterios para sumar puntos.',
  },
  {
    codigo: 'JM003',
    nombre: 'Dixit',
    categoria: 'Juegos de Mesa',
    fabricante: 'Libellud',
    distribuidor: 'Level-Up',
    precio: 21990,
    stock: 10,
    stockCritico: 3,
    url: JM003,
    descripcion:
      'Dixit es un creativo juego de cartas ilustradas donde la imaginación y la interpretación son clave para ganar.',
  },
  // --- Accesorios ---
  {
    codigo: 'AC001',
    nombre: 'Control Xbox Series X',
    categoria: 'Accesorios',
    fabricante: 'Microsoft',
    distribuidor: 'Level-Up',
    precio: 59990,
    stock: 5,
    stockCritico: 2,
    url: AC001,
    descripcion:
      'Control inalámbrico original para Xbox Series X|S con ergonomía mejorada y respuesta precisa.',
  },
  {
    codigo: 'AC002',
    nombre: 'Auriculares HyperX Cloud II',
    categoria: 'Accesorios',
    fabricante: 'HyperX',
    distribuidor: 'Level-Up',
    precio: 79990,
    stock: 8,
    stockCritico: 2,
    url: AC002,
    descripcion:
      'Headset HyperX Cloud II con sonido envolvente virtual 7.1 y micrófono con cancelación de ruido.',
  },
  {
    codigo: 'AC003',
    nombre: 'Teclado Mecánico Redragon Kumara',
    categoria: 'Accesorios',
    fabricante: 'Redragon',
    distribuidor: 'Level-Up',
    precio: 39990,
    stock: 15,
    stockCritico: 4,
    url: AC003,
    descripcion:
      'Teclado mecánico compacto Redragon Kumara con switches durables e iluminación RGB.',
  },
  // --- Consolas ---
  {
    codigo: 'CO001',
    nombre: 'PlayStation 5',
    categoria: 'Consolas',
    fabricante: 'Sony',
    distribuidor: 'Level-Up',
    precio: 549990,
    stock: 2,
    stockCritico: 1,
    url: CO001,
    descripcion:
      'La consola PS5 ofrece gráficos de nueva generación, carga ultrarrápida con SSD y gatillos adaptativos.',
  },
  {
    codigo: 'CO002',
    nombre: 'Nintendo Switch OLED',
    categoria: 'Consolas',
    fabricante: 'Nintendo',
    distribuidor: 'Level-Up',
    precio: 349990,
    stock: 4,
    stockCritico: 1,
    url: CO002,
    descripcion:
      'La consola Nintendo Switch OLED ofrece una pantalla OLED de 7 pulgadas, audio mejorado y un soporte ajustable para una experiencia de juego versátil tanto en modo portátil como en modo TV.',
  },
  // --- Computadores Gamers ---
  {
    codigo: 'CG001',
    nombre: 'PC Gamer ASUS ROG Strix',
    categoria: 'Computadores Gamers',
    fabricante: 'ASUS',
    distribuidor: 'Level-Up',
    precio: 1299990,
    stock: 3,
    stockCritico: 1,
    url: CG001,
    descripcion:
      'PC gamer ASUS ROG Strix de alto rendimiento, ideal para juegos AAA y streaming.',
  },
  {
    codigo: 'CG002',
    nombre: 'Notebook Gamer MSI Katana',
    categoria: 'Computadores Gamers',
    fabricante: 'MSI',
    distribuidor: 'Level-Up',
    precio: 999990,
    stock: 5,
    stockCritico: 1,
    url: CG002,
    descripcion:
      'Notebook MSI Katana con GPU dedicada y pantalla de alta tasa de refresco para gaming fluido.',
  },
  // --- Sillas Gamers ---
  {
    codigo: 'SG001',
    nombre: 'Silla Gamer Secretlab Titan',
    categoria: 'Sillas Gamers',
    fabricante: 'Secretlab',
    distribuidor: 'Level-Up',
    precio: 349990,
    stock: 4,
    stockCritico: 1,
    url: SG001,
    descripcion:
      'Silla gamer Secretlab Titan con soporte ergonómico y materiales premium para sesiones largas.',
  },
  {
    codigo: 'SG002',
    nombre: 'Silla Gamer Cougar Armor One',
    categoria: 'Sillas Gamers',
    fabricante: 'Cougar',
    distribuidor: 'Level-Up',
    precio: 199990,
    stock: 6,
    stockCritico: 2,
    url: SG002,
    descripcion:
      'Silla Cougar Armor One con estructura resistente y cojines ajustables para mayor comodidad.',
  },
  // --- Mouse ---
  {
    codigo: 'MS001',
    nombre: 'Mouse Logitech G502 HERO',
    categoria: 'Mouse',
    fabricante: 'Logitech',
    distribuidor: 'Level-Up',
    precio: 49990,
    stock: 18,
    stockCritico: 4,
    url: MS001,
    descripcion:
      'Mouse Logitech G502 HERO con sensor de alta precisión y pesos ajustables.',
  },
  {
    codigo: 'MS002',
    nombre: 'Mouse Razer DeathAdder V2',
    categoria: 'Mouse',
    fabricante: 'Razer',
    distribuidor: 'Level-Up',
    precio: 39990,
    stock: 12,
    stockCritico: 3,
    url: MS002,
    descripcion:
      'Mouse Razer DeathAdder V2 con diseño ergonómico y switches ópticos Razer.',
  },
  // --- Mousepad ---
  {
    codigo: 'MP001',
    nombre: 'Mousepad Razer Goliathus Extended Chroma',
    categoria: 'Mousepad',
    fabricante: 'Razer',
    distribuidor: 'Level-Up',
    precio: 29990,
    stock: 10,
    stockCritico: 2,
    url: MP001,
    descripcion:
      'Mousepad extendido con iluminación RGB Chroma y superficie optimizada para precisión.',
  },
  {
    codigo: 'MP002',
    nombre: 'Mousepad Logitech G Powerplay',
    categoria: 'Mousepad',
    fabricante: 'Logitech',
    distribuidor: 'Level-Up',
    precio: 99990,
    stock: 3,
    stockCritico: 1,
    url: MP002,
    descripcion:
      'Mousepad Logitech Powerplay con carga inalámbrica continua para mouse compatibles.',
  },
  // --- Poleras Personalizadas ---
  {
    codigo: 'PP001',
    nombre: "Polera Gamer Personalizada 'Level-Up'",
    categoria: 'Poleras Personalizadas',
    fabricante: 'Level-Up',
    distribuidor: 'Level-Up',
    precio: 14990,
    stock: 20,
    stockCritico: 5,
    url: PP001,
    descripcion:
      'Polera personalizada Level-Up con diseño gamer, tela suave y resistente.',
  },
  {
    codigo: 'PP002',
    nombre: 'Polera Retro Arcade',
    categoria: 'Poleras Personalizadas',
    fabricante: 'Level-Up',
    distribuidor: 'Level-Up',
    precio: 15990,
    stock: 15,
    stockCritico: 4,
    url: PP002,
    descripcion:
      'Polera temática retro arcade con estampado de alta calidad y ajuste cómodo.',
  },
  // --- Polerones Gamers Personalizados ---
  {
    codigo: 'PG001',
    nombre: "Polerón Gamer Hoodie 'Respawn'",
    categoria: 'Polerones Gamers Personalizados',
    fabricante: 'Level-Up',
    distribuidor: 'Level-Up',
    precio: 24990,
    stock: 12,
    stockCritico: 3,
    url: PG001,
    descripcion:
      'Polerón con capucha estilo gamer, interior suave y estampado Respawn.',
  },
  {
    codigo: 'PG002',
    nombre: 'Polerón Level-Up Logo',
    categoria: 'Polerones Gamers Personalizados',
    fabricante: 'Level-Up',
    distribuidor: 'Level-Up',
    precio: 26990,
    stock: 10,
    stockCritico: 3,
    url: PG002,
    descripcion:
      'Polerón con logo Level-Up, ideal para el día a día con estilo gamer.',
  },
];
