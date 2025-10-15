import kirbyImg from '@/assets/KIRBY.avif';
import worldsImg from '@/assets/worlds.webp';
import tecladosImg from '@/assets/teclados.avif';
import optiImg from '@/assets/opti.jpg';
import streetImg from '@/assets/street.avif';
import comunidadaImg from '@/assets/comunidada.jpg';
import type {
  CommunityBlogPost,
  CommunityEvent,
  CommunityGuide,
  CommunityNewsItem,
} from '@/types';

export const communityHeroImage = comunidadaImg;

export const communityNews: CommunityNewsItem[] = [
  {
    id: 'kirby-air-riders',
    slug: 'kirby-air-riders',
    title:
      'Kirby Air Riders llegará a Switch 2 y es "básicamente como Mario Kart"',
    category: 'Lanzamientos',
    excerpt:
      'El juego, secuela de Kirby Air Ride de 2003 para GameCube, se lanzará en noviembre.',
    content: [
      'Nintendo confirmó oficialmente la llegada de Kirby Air Riders a Switch 2 con una propuesta que combina carreras y habilidades especiales al estilo del multijugador de los juegos principales de la franquicia.',
      'El título será desarrollado por HAL Laboratory y ofrecerá circuitos tanto clásicos como inéditos, con énfasis en el modo cooperativo y competitivo en línea.',
      'Se espera su lanzamiento mundial para noviembre de 2025 y contará con soporte para multijugador cruzado con Switch original.',
    ],
    publishedAt: '2025-06-04',
    image: kirbyImg,
    highlight: true,
  },
  {
    id: 'worlds-2025-grupos',
    slug: 'worlds-2025-grupos',
    title: 'Definidos los grupos para el Worlds 2025 de League of Legends',
    category: 'eSports',
    excerpt:
      'Los grupos ya están listos y la competencia arranca con enfrentamientos históricos.',
    content: [
      'Riot Games presentó los grupos oficiales para el Worlds 2025. Los representantes latinoamericanos compartirán escenario con escuadras de Corea, Europa y Norteamérica.',
      'El torneo se disputará en Berlín, Seúl y Ciudad de México, con una fase de apertura renovada que promete partidos de eliminación directa desde el primer día.',
      'La final se llevará a cabo el 2 de noviembre en el Estadio Olímpico de Berlín.',
    ],
    publishedAt: '2025-07-12',
    image: worldsImg,
    accent: 'neon',
  },
  {
    id: 'baldurs-gate-parche-8',
    slug: 'baldurs-gate-parche-8',
    title:
      "Baldur's Gate 3 recibe el Parche 8 con nueva clase y finales extendidos",
    category: 'Actualizaciones',
    excerpt:
      'Larian Studios libera una expansión de contenidos repleta de ajustes para los aventureros.',
    content: [
      'El Parche 8 incorpora la clase Bardo junto con más de 30 nuevas habilidades musicales que afectan a aliados y enemigos.',
      'También se agregaron finales alternativos para dos de los compañeros principales y ajustes de balance para encuentros de alto nivel.',
      'La actualización ya está disponible para PC, PlayStation 5 y Xbox Series X|S.',
    ],
    publishedAt: '2025-05-18',
    image: streetImg,
  },
];

export const communityBlogPosts: CommunityBlogPost[] = [
  {
    id: 'top-teclados-2025',
    slug: 'top-teclados-2025',
    title: 'Los 5 mejores teclados mecánicos de 2025',
    excerpt: 'Analizamos los modelos que están dominando el mercado este año.',
    content: [
      'Seleccionamos cinco teclados ideales para gaming competitivo, creatividad y productividad.',
      'Incluimos opciones con interruptores intercambiables, iluminación RGB personalizable y software multiplataforma.',
      'Cada recomendación considera la disponibilidad en Chile y garantía local.',
    ],
    publishedAt: '2025-04-28',
    image: tecladosImg,
  },
  {
    id: 'optimizar-pc',
    slug: 'optimizar-pc',
    title: 'Cómo optimizar tu PC para un rendimiento máximo',
    excerpt: 'Consejos y trucos para sacarle el máximo provecho a tu equipo.',
    content: [
      'Desde la gestión térmica hasta la configuración de drivers, cubrimos pasos esenciales para mejorar FPS y estabilidad.',
      'Aprende a calibrar perfiles XMP, ajustar la curva de ventiladores y limpiar software que consume recursos en segundo plano.',
      'Incluimos una lista rápida de herramientas gratuitas para monitorear el desempeño.',
    ],
    publishedAt: '2025-03-10',
    image: optiImg,
  },
  {
    id: 'historia-fighting',
    slug: 'historia-fighting',
    title: 'La historia de los juegos de lucha: de Street Fighter a hoy',
    excerpt: 'Un viaje nostálgico por la evolución de un género icónico.',
    content: [
      'Repasamos los hitos que definieron el género desde los arcades de los años 90 hasta los torneos EVO actuales.',
      'Street Fighter, Mortal Kombat y Tekken allanaron el camino para nuevas franquicias enfocadas en el juego en línea.',
      'Cerramos con recomendaciones para quienes buscan iniciarse en la competencia actual.',
    ],
    publishedAt: '2025-01-22',
    image: streetImg,
  },
];

export const communityGuides: CommunityGuide[] = [
  {
    id: 'guias-juegos',
    slug: 'guias-juegos',
    title: 'Guías de Juegos',
    description:
      'Secretos, trofeos y estrategias para completar tus juegos favoritos al 100%.',
    icon: 'controller',
    content: [
      'Exploramos rutas óptimas para conseguir coleccionables, desbloquear finales alternativos y dominar las mecánicas principales de tus juegos favoritos.',
      'Incluimos recomendaciones para cooperativo local y en línea, además de tips para speedruns y desafíos especiales.',
      'Actualizamos estas guías mensualmente considerando parches y actualizaciones importantes.',
    ],
    updatedAt: '2025-02-24',
    readTime: '7 min',
  },
  {
    id: 'armado-pc',
    slug: 'armado-pc',
    title: 'Armado de PC',
    description:
      'Desde la elección de componentes hasta el ensamblaje final paso a paso.',
    icon: 'motherboard',
    content: [
      'Aprende a elegir componentes balanceados según presupuesto y estilo de juego.',
      'Guía ilustrada para instalar procesador, memorias, almacenamiento y enfriamiento sin errores.',
      'Checklist final para validar drivers, sistema operativo y pruebas de estabilidad.',
    ],
    updatedAt: '2025-03-05',
    readTime: '9 min',
  },
  {
    id: 'optimizacion',
    slug: 'optimizacion',
    title: 'Optimización',
    description:
      'Configura periféricos y software para una experiencia competitiva.',
    icon: 'tools',
    content: [
      'Configura tu mouse, teclado y monitor para mejorar tiempos de reacción.',
      'Aprende a ajustar drivers gráficos, modos de energía y perfiles de ventiladores.',
      'Incluimos recomendaciones de software gratuito para limpiar y monitorear tu sistema.',
    ],
    updatedAt: '2025-01-30',
    readTime: '6 min',
  },
  {
    id: 'streaming',
    slug: 'streaming',
    title: 'Streaming',
    description:
      'Todo lo que necesitas para iniciar tu canal: OBS, overlays y más.',
    icon: 'camera',
    content: [
      'Paso a paso para configurar OBS Studio y crear escenas profesionales sin costo.',
      'Cómo optimizar bitrate, audio y transiciones para Twitch, YouTube o Kick.',
      'Recursos gratuitos para overlays, alertas y música libre de derechos.',
    ],
    updatedAt: '2025-02-12',
    readTime: '8 min',
  },
];

export const communityEvents: CommunityEvent[] = [
  {
    id: 'lol-torneo-5v5',
    slug: 'lol-torneo-5v5',
    title: 'Torneo de League of Legends 5v5',
    description:
      'Inscripciones abiertas para el torneo presencial en nuestra tienda.',
    date: '2025-09-28',
    location: 'Level-Up Arena, Las Condes',
    startTime: '11:00',
    content: [
      'Formato presencial con fase de grupos y playoffs al mejor de tres partidas.',
      'Premios en hardware y puntos Level-Up para las primeras tres escuadras.',
      'Equipos deben registrar mínimo cinco integrantes mayores de 16 años.',
    ],
  },
  {
    id: 'noche-juegos-catan',
    slug: 'noche-juegos-catan',
    title: 'Noche de Juegos de Mesa: Especial Catan',
    description:
      'Ven a competir y demuestra quién es el mejor colonizador de la isla.',
    date: '2025-10-05',
    location: 'Sala Co-Op Level-Up, Ñuñoa',
    startTime: '19:30',
    content: [
      'Actividad pensada para jugadores casuales, con mesas guiadas por monitores.',
      'Incluye snacks temáticos y sorteos de expansiones oficiales.',
      'Cupón de descuento Level-Up para todos los asistentes que completen la noche.',
    ],
  },
  {
    id: 'taller-armado-pc',
    slug: 'taller-armado-pc',
    title: 'Taller de Armado de PC para Principiantes',
    description:
      'Aprende con nuestros expertos y arma tu primer computador gamer.',
    date: '2025-10-12',
    location: 'Laboratorio Técnico Level-Up, Providencia',
    startTime: '10:00',
    content: [
      'Sesión práctica de cuatro horas con estaciones individuales y componentes reales.',
      'Incluye guía para elegir piezas según presupuesto y objetivo de juego.',
      'Se entrega certificado de participación y lista de chequeo descargable.',
    ],
  },
];
