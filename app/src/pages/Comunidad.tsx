import { Link } from 'react-router-dom';
import GuideIcon from '@/components/GuideIcon';
import {
  communityBlogPosts,
  communityEvents,
  communityGuides,
  communityHeroImage,
  communityNews,
} from '@/data/comunidad';
import styles from './Comunidad.module.css';

const formatEventDate = (isoDate: string) => {
  const date = new Date(`${isoDate}T00:00:00Z`);
  const day = date
    .toLocaleDateString('es-CL', { day: '2-digit', timeZone: 'UTC' })
    .padStart(2, '0');
  const month = date
    .toLocaleDateString('es-CL', { month: 'short', timeZone: 'UTC' })
    .replace('.', '')
    .toUpperCase();
  return { day, month };
};

const formatPublishedDate = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

const Comunidad: React.FC = () => {
  const highlight =
    communityNews.find((item) => item.highlight) ?? communityNews[0];
  const secondaryNews = communityNews.filter(
    (item) => item.id !== highlight.id
  );

  return (
    <div className="container">
      <div className={styles.page}>
        <section
          className={styles.hero}
          style={{ backgroundImage: `url(${communityHeroImage})` }}
          aria-labelledby="comunidad-hero-title"
        >
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <span className={styles.heroKicker}>Explora. Juega. Comparte.</span>
            <h1 id="comunidad-hero-title" className={styles.heroTitle}>
              Comunidad Level-Up
            </h1>
            <p className={styles.heroSubtitle}>
              Noticias, guías, eventos y recursos en un solo lugar para
              mantenerte conectado con lo último del universo gamer.
            </p>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="news-title">
          <div className={styles.sectionHeader}>
            <h2 id="news-title" className={styles.sectionTitle}>
              Últimas noticias
            </h2>
            <p className={styles.sectionSubtitle}>
              Mantente al día con lanzamientos, actualizaciones y la escena
              competitiva.
            </p>
          </div>
          <div className={styles.newsGrid}>
            <article className={styles.newsMain}>
              <img src={highlight.image} alt={highlight.title} loading="lazy" />
              <div className={styles.newsBody}>
                <span
                  className={`${styles.newsBadge} ${
                    highlight.accent === 'neon' ? styles.newsBadgeNeon : ''
                  }`}
                >
                  {highlight.category}
                </span>
                <h3 className={styles.newsTitle}>{highlight.title}</h3>
                <p className={styles.newsExcerpt}>{highlight.excerpt}</p>
                <p className={styles.newsMeta}>
                  Publicado el {formatPublishedDate(highlight.publishedAt)}
                </p>
                <Link
                  to={`/comunidad/${highlight.slug}`}
                  className={styles.newsLink}
                >
                  Leer más →
                </Link>
              </div>
            </article>
            <div className={styles.newsStack}>
              {secondaryNews.map((item) => (
                <article key={item.id} className={styles.newsCard}>
                  <img src={item.image} alt={item.title} loading="lazy" />
                  <div>
                    <span
                      className={`${styles.newsBadge} ${
                        item.accent === 'neon' ? styles.newsBadgeNeon : ''
                      }`}
                    >
                      {item.category}
                    </span>
                    <h3 className={styles.newsTitle}>{item.title}</h3>
                    <p className={styles.newsExcerpt}>{item.excerpt}</p>
                    <p className={styles.newsMeta}>
                      Publicado el {formatPublishedDate(item.publishedAt)}
                    </p>
                    <Link
                      to={`/comunidad/${item.slug}`}
                      className={styles.newsLink}
                    >
                      Leer más →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="blog-title">
          <div className={styles.sectionHeader}>
            <h2 id="blog-title" className={styles.sectionTitle}>
              Desde nuestro blog
            </h2>
            <p className={styles.sectionSubtitle}>
              Consejos, análisis y tendencias curadas por el equipo Level-Up.
            </p>
          </div>
          <div className={styles.blogGrid}>
            {communityBlogPosts.map((post) => (
              <article key={post.id} className={styles.blogCard}>
                <img src={post.image} alt={post.title} loading="lazy" />
                <div className={styles.blogBody}>
                  <h3 className={styles.blogTitle}>{post.title}</h3>
                  <p className={styles.blogExcerpt}>{post.excerpt}</p>
                </div>
                <p className={styles.blogMeta}>
                  {formatPublishedDate(post.publishedAt)}
                </p>
                <Link
                  to={`/comunidad/${post.slug}`}
                  className={styles.blogLink}
                >
                  Leer entrada →
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="guides-title">
          <div className={styles.sectionHeader}>
            <h2 id="guides-title" className={styles.sectionTitle}>
              Guías y tutoriales
            </h2>
            <p className={styles.sectionSubtitle}>
              Aprende desde el armado de tu PC hasta optimizar tu stream.
            </p>
          </div>
          <div className={styles.guidesGrid}>
            {communityGuides.map((guide) => (
              <Link
                key={guide.id}
                to={`/comunidad/${guide.slug}`}
                className={styles.guideCard}
              >
                <span className={styles.guideIcon}>
                  <GuideIcon icon={guide.icon} />
                </span>
                <h3 className={styles.guideTitle}>{guide.title}</h3>
                <p className={styles.guideDescription}>{guide.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="events-title">
          <div className={styles.sectionHeader}>
            <h2 id="events-title" className={styles.sectionTitle}>
              Próximos eventos
            </h2>
            <p className={styles.sectionSubtitle}>
              Participa en torneos, talleres y encuentros presenciales
              organizados por Level-Up.
            </p>
          </div>
          <div className={styles.eventsList}>
            {communityEvents.map((event) => {
              const { day, month } = formatEventDate(event.date);
              return (
                <article key={event.id} className={styles.eventItem}>
                  <div className={styles.eventDate} aria-hidden="true">
                    <span className={styles.eventDay}>{day}</span>
                    <span className={styles.eventMonth}>{month}</span>
                  </div>
                  <div className={styles.eventInfo}>
                    <h3 className={styles.eventTitle}>{event.title}</h3>
                    <p className={styles.eventDescription}>
                      {event.description}
                    </p>
                    <p className={styles.eventMeta}>
                      {event.location} · {event.startTime} hrs
                    </p>
                    <Link
                      to={`/comunidad/${event.slug}`}
                      className={styles.eventLink}
                    >
                      Más info →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Comunidad;
