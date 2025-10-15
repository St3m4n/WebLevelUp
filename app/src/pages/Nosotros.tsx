import { Link } from 'react-router-dom';
import heroImage from '@/assets/gamer.jpg';
import communityImage from '@/assets/comunidada.jpg';
import styles from './Nosotros.module.css';

const pilares = [
  {
    id: 'mision',
    title: 'Misión',
    description:
      'Proporcionar productos de alta calidad para gamers en todo Chile con una experiencia de compra única, enfocada en la satisfacción de cada jugador.',
    label: 'M',
  },
  {
    id: 'vision',
    title: 'Visión',
    description:
      'Ser la tienda online líder para la comunidad gamer chilena, reconocida por la innovación, el servicio excepcional y las recompensas por lealtad.',
    label: 'V',
  },
];

const compromisos = [
  'Financiamos torneos y eventos locales para que más jugadores puedan competir y compartir.',
  'Becamos a talentos emergentes cubriendo inscripciones y equipamiento clave.',
  'Creamos espacios de encuentro donde la comunidad puede reunirse, aprender y crecer.',
  'Difundimos actividades, guías y noticias que mantienen a la comunidad conectada.',
];

const Nosotros: React.FC = () => {
  return (
    <div className="container">
      <div className={styles.page}>
        <section
          className={styles.hero}
          style={{ backgroundImage: `url(${heroImage})` }}
          aria-labelledby="nosotros-hero-title"
        >
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <span className={styles.heroKicker}>Nuestra historia</span>
            <h1 id="nosotros-hero-title" className={styles.heroTitle}>
              Crecemos junto a la comunidad gamer chilena
            </h1>
            <p className={styles.heroSubtitle}>
              Level-Up nació durante la pandemia para llevar hardware,
              periféricos y experiencias a cada hogar. Hoy seguimos ampliando el
              ecosistema gamer con envíos a todo Chile y beneficios exclusivos
              para estudiantes DUOC.
            </p>
            <Link to="/comunidad" className={styles.ctaButton}>
              Únete a la comunidad
            </Link>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="historia-title">
          <div className={styles.twoColumn}>
            <figure className={styles.figure}>
              <img
                src={communityImage}
                alt="Jugadores compartiendo en un evento de Level-Up"
              />
            </figure>
            <div>
              <h2 id="historia-title" className={styles.sectionTitle}>
                Nacimos para jugar
              </h2>
              <p className={styles.sectionText}>
                Level-Up Gamer comenzó como una tienda digital creada por un
                grupo de jugadores que no encontraba servicio especializado en
                Chile. Lanzamos nuestro catálogo en línea hace dos años, en
                pleno auge del gaming local, con el objetivo de entregar
                productos curados y soporte real.
              </p>
              <p className={styles.sectionText}>
                Hoy seguimos operando 100% online, con entregas a domicilio y
                puntos de retiro en las principales ciudades. Cada compra
                financia nuevos eventos, alianzas con desarrolladores y
                oportunidades para que la escena gamer se expanda sin limites.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="pilares-title">
          <h2 id="pilares-title" className={styles.sectionTitle}>
            Nuestros pilares
          </h2>
          <div className={styles.pillars}>
            {pilares.map((item) => (
              <article key={item.id} className={styles.pillarCard}>
                <span className={styles.pillarIcon} aria-hidden="true">
                  {item.label}
                </span>
                <h3 className={styles.pillarTitle}>{item.title}</h3>
                <p className={styles.sectionText}>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="impacto-title">
          <div className={styles.impactCard}>
            <div>
              <h2 id="impacto-title" className={styles.sectionTitle}>
                Impacto comunitario
              </h2>
              <p className={styles.sectionText}>
                Cada cliente que confía en Level-Up aporta directamente a nuevas
                experiencias para la comunidad gamer chilena. Nos comprometemos
                a reinvertir parte de cada venta en actividades que eleven la
                escena.
              </p>
            </div>
            <ul className={styles.impactList}>
              {compromisos.map((commitment) => (
                <li key={commitment}>{commitment}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className={styles.ctaBlock} aria-labelledby="cta-title">
          <h2 id="cta-title" className={styles.ctaTitle}>
            Seguimos construyendo el futuro gamer
          </h2>
          <p className={styles.ctaSubtitle}>
            Súmate a nuestros eventos, obtén beneficios exclusivos y comparte
            junto a otros jugadores como tú.
          </p>
          <Link to="/registro" className={styles.ctaButton}>
            Crea tu cuenta
          </Link>
        </section>
      </div>
    </div>
  );
};

export default Nosotros;
