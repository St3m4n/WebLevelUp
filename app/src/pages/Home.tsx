import { Link } from 'react-router-dom';
import FeaturedOffers from '@/components/FeaturedOffers';
import RecommendationsGrid from '@/components/RecommendationsGrid';
import heroBackground from '@/assets/background.png';
import styles from './Home.module.css';

const metrics = [
  { value: '+5.000', label: 'Productos en stock' },
  { value: '48h', label: 'Despacho express RM' },
  { value: '+25', label: 'Marcas oficiales' },
];

const Home: React.FC = () => (
  <div className={styles.page}>
    <section
      className={styles.heroSection}
      style={{
        backgroundImage: `linear-gradient(rgba(18,18,18,0.6), rgba(18,18,18,0.6)), url(${heroBackground})`,
      }}
    >
      <div className={styles.heroOverlay} />
      <div className="container">
        <div className={styles.heroContent}>
          <span className={styles.heroKicker}>Sube de nivel</span>
          <h1 className={styles.heroTitle}>
            Todo lo que necesitas para dominar{' '}
            <span className={styles.heroAccent}>tu setup</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Hardware, periféricos y asesoría con los mejores beneficios Level-Up
            Points. Compra seguro, recibe rápido y mantente competitivo en cada
            partida.
          </p>

          <div className={styles.ctaGroup}>
            <Link to="/tienda" className={styles.primaryCta}>
              Ver tienda
            </Link>
            <Link to="/comunidad" className={styles.secondaryCta}>
              Únete a la comunidad
            </Link>
          </div>

          <div className={styles.metrics}>
            {metrics.map((metric) => (
              <div key={metric.label} className={styles.metricCard}>
                <p className={styles.metricValue}>{metric.value}</p>
                <p className={styles.metricLabel}>{metric.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    <FeaturedOffers />
    <RecommendationsGrid />
  </div>
);

export default Home;
