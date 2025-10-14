import type { Region } from '@/types';

export const regiones: Region[] = [
  {
    nombre: 'Arica y Parinacota',
    comunas: [{ nombre: 'Arica' }, { nombre: 'Putre' }],
  },
  {
    nombre: 'Tarapacá',
    comunas: [
      { nombre: 'Iquique' },
      { nombre: 'Alto Hospicio' },
      { nombre: 'Pozo Almonte' },
    ],
  },
  {
    nombre: 'Antofagasta',
    comunas: [
      { nombre: 'Antofagasta' },
      { nombre: 'Calama' },
      { nombre: 'Mejillones' },
      { nombre: 'Tocopilla' },
    ],
  },
  {
    nombre: 'Atacama',
    comunas: [
      { nombre: 'Copiapó' },
      { nombre: 'Vallenar' },
      { nombre: 'Caldera' },
    ],
  },
  {
    nombre: 'Coquimbo',
    comunas: [
      { nombre: 'La Serena' },
      { nombre: 'Coquimbo' },
      { nombre: 'Ovalle' },
      { nombre: 'Illapel' },
    ],
  },
  {
    nombre: 'Valparaíso',
    comunas: [
      { nombre: 'Valparaíso' },
      { nombre: 'Viña del Mar' },
      { nombre: 'Quilpué' },
      { nombre: 'Villa Alemana' },
      { nombre: 'Quillota' },
      { nombre: 'San Antonio' },
    ],
  },
  {
    nombre: 'Metropolitana de Santiago',
    comunas: [
      { nombre: 'Santiago' },
      { nombre: 'Puente Alto' },
      { nombre: 'Maipú' },
      { nombre: 'Providencia' },
      { nombre: 'Las Condes' },
      { nombre: 'La Florida' },
      { nombre: 'Ñuñoa' },
      { nombre: 'Lo Barnechea' },
      { nombre: 'Recoleta' },
    ],
  },
  {
    nombre: 'O’Higgins',
    comunas: [
      { nombre: 'Rancagua' },
      { nombre: 'San Fernando' },
      { nombre: 'Santa Cruz' },
    ],
  },
  {
    nombre: 'Maule',
    comunas: [
      { nombre: 'Talca' },
      { nombre: 'Curicó' },
      { nombre: 'Linares' },
      { nombre: 'Constitución' },
    ],
  },
  {
    nombre: 'Ñuble',
    comunas: [
      { nombre: 'Chillán' },
      { nombre: 'San Carlos' },
      { nombre: 'Bulnes' },
    ],
  },
  {
    nombre: 'Biobío',
    comunas: [
      { nombre: 'Concepción' },
      { nombre: 'Talcahuano' },
      { nombre: 'San Pedro de la Paz' },
      { nombre: 'Coronel' },
      { nombre: 'Chiguayante' },
      { nombre: 'Hualpén' },
      { nombre: 'Los Ángeles' },
    ],
  },
  {
    nombre: 'La Araucanía',
    comunas: [
      { nombre: 'Temuco' },
      { nombre: 'Padre Las Casas' },
      { nombre: 'Villarrica' },
      { nombre: 'Angol' },
    ],
  },
  {
    nombre: 'Los Ríos',
    comunas: [
      { nombre: 'Valdivia' },
      { nombre: 'La Unión' },
      { nombre: 'Río Bueno' },
    ],
  },
  {
    nombre: 'Los Lagos',
    comunas: [
      { nombre: 'Puerto Montt' },
      { nombre: 'Osorno' },
      { nombre: 'Castro' },
      { nombre: 'Ancud' },
      { nombre: 'Puerto Varas' },
    ],
  },
  {
    nombre: 'Aysén',
    comunas: [
      { nombre: 'Coyhaique' },
      { nombre: 'Puerto Aysén' },
      { nombre: 'Chile Chico' },
    ],
  },
  {
    nombre: 'Magallanes',
    comunas: [
      { nombre: 'Punta Arenas' },
      { nombre: 'Puerto Natales' },
      { nombre: 'Porvenir' },
    ],
  },
];

export const regionesComunas = regiones.reduce<Record<string, string[]>>(
  (acc, region) => {
    acc[region.nombre] = region.comunas.map((comuna) => comuna.nombre);
    return acc;
  },
  {}
);
