import { Link, useParams } from 'react-router-dom';
import CommunityComments from '@/components/CommunityComments';
import GuideIcon from '@/components/GuideIcon';
import {
  communityBlogPosts,
  communityEvents,
  communityGuides,
  communityNews,
} from '@/data/comunidad';
import styles from './ComunidadDetalle.module.css';

const formatDateTime = (
  isoDate: string,
  options?: Intl.DateTimeFormatOptions
) =>
  new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
    ...options,
  });

type RelatedItem = {
  slug: string;
  title: string;
  excerpt: string;
  meta: string;
  badge: string;
  image?: string;
  icon?: (typeof communityGuides)[number]['icon'];
};

const ComunidadDetalle: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const entry = (() => {
    if (!slug) {
      return undefined;
    }

    const news = communityNews.find((item) => item.slug === slug);
    if (news) {
      return {
        type: 'news' as const,
        slug: news.slug,
        title: news.title,
        image: news.image,
        meta: `Publicado el ${formatDateTime(news.publishedAt)}`,
        badge: news.category,
        content: news.content,
        icon: undefined,
      };
    }

    const blog = communityBlogPosts.find((item) => item.slug === slug);
    if (blog) {
      return {
        type: 'blog' as const,
        slug: blog.slug,
        title: blog.title,
        image: blog.image,
        meta: `Publicado el ${formatDateTime(blog.publishedAt)}`,
        badge: 'Blog',
        content: blog.content,
        icon: undefined,
      };
    }

    const event = communityEvents.find((item) => item.slug === slug);
    if (event) {
      return {
        type: 'event' as const,
        slug: event.slug,
        title: event.title,
        image: undefined,
        meta: `${formatDateTime(event.date)}, ${event.location} · ${event.startTime} hrs`,
        badge: 'Evento',
        content: event.content,
        icon: undefined,
      };
    }

    const guide = communityGuides.find((item) => item.slug === slug);
    if (guide) {
      const metaParts: string[] = [];
      if (guide.updatedAt) {
        metaParts.push(`Actualizado el ${formatDateTime(guide.updatedAt)}`);
      }
      if (guide.readTime) {
        metaParts.push(`${guide.readTime} de lectura`);
      }

      return {
        type: 'guide' as const,
        slug: guide.slug,
        title: guide.title,
        image: undefined,
        meta:
          metaParts.length > 0
            ? metaParts.join(' · ')
            : 'Guía oficial del equipo Level-Up',
        badge: 'Guía',
        content: guide.content,
        icon: guide.icon,
      };
    }

    return undefined;
  })();

  const relatedItems: RelatedItem[] = (() => {
    if (!entry) {
      return [];
    }

    switch (entry.type) {
      case 'news':
        return communityNews
          .filter((item) => item.slug !== entry.slug)
          .slice(0, 3)
          .map(
            (item): RelatedItem => ({
              slug: item.slug,
              title: item.title,
              excerpt: item.excerpt,
              meta: `Publicado el ${formatDateTime(item.publishedAt)}`,
              badge: item.category,
              image: item.image,
              icon: undefined,
            })
          );
      case 'blog':
        return communityBlogPosts
          .filter((item) => item.slug !== entry.slug)
          .slice(0, 3)
          .map(
            (item): RelatedItem => ({
              slug: item.slug,
              title: item.title,
              excerpt: item.excerpt,
              meta: `Publicado el ${formatDateTime(item.publishedAt)}`,
              badge: 'Blog',
              image: item.image,
              icon: undefined,
            })
          );
      case 'event':
        return communityEvents
          .filter((item) => item.slug !== entry.slug)
          .slice(0, 3)
          .map(
            (item): RelatedItem => ({
              slug: item.slug,
              title: item.title,
              excerpt: item.description,
              meta: `${formatDateTime(item.date)}, ${item.location} · ${item.startTime} hrs`,
              badge: 'Evento',
              image: undefined,
              icon: undefined,
            })
          );
      case 'guide':
        return communityGuides
          .filter((item) => item.slug !== entry.slug)
          .slice(0, 3)
          .map((item): RelatedItem => {
            const metaParts: string[] = [];
            if (item.updatedAt) {
              metaParts.push(
                `Actualizado el ${formatDateTime(item.updatedAt)}`
              );
            }
            if (item.readTime) {
              metaParts.push(`${item.readTime} de lectura`);
            }

            return {
              slug: item.slug,
              title: item.title,
              excerpt: item.description,
              meta:
                metaParts.length > 0
                  ? metaParts.join(' · ')
                  : 'Guía oficial del equipo Level-Up',
              badge: 'Guía',
              image: undefined,
              icon: item.icon,
            };
          });
      default:
        return [];
    }
  })();

  if (!entry) {
    return (
      <div className="container">
        <div className={styles.page}>
          <div className={styles.content}>
            <p>El contenido que buscas no está disponible.</p>
          </div>
          <Link to="/comunidad" className={styles.backLink}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M15.41 16.59 10.83 12l4.58-4.59L14 6l-6 6 6 6z"
              />
            </svg>
            Volver a la comunidad
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className={styles.page}>
        <article className={styles.hero}>
          {entry.image && (
            <img
              src={entry.image}
              alt={entry.title}
              className={styles.heroImage}
              loading="lazy"
            />
          )}
          <div className={styles.heroContent}>
            {entry.icon && (
              <span className={styles.heroIcon} aria-hidden="true">
                <GuideIcon icon={entry.icon} />
              </span>
            )}
            <div className={styles.badgeRow}>
              <span className={styles.badge}>{entry.badge}</span>
            </div>
            <h1 className={styles.title}>{entry.title}</h1>
            <p className={styles.meta}>{entry.meta}</p>
          </div>
        </article>

        <div className={styles.content}>
          {entry.content.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        {entry.type === 'blog' && (
          <section
            className={styles.commentSection}
            aria-labelledby="comments-title"
          >
            <h2 id="comments-title" className={styles.commentTitle}>
              Conversación de la comunidad
            </h2>
            <p className={styles.commentIntro}>
              Únete a la discusión y comparte tus impresiones sobre este
              artículo.
            </p>
            <CommunityComments postKey={entry.slug} seedDemo />
          </section>
        )}

        {relatedItems.length > 0 ? (
          <section
            className={styles.relatedSection}
            aria-labelledby="related-title"
          >
            <h2 id="related-title" className={styles.relatedTitle}>
              También te puede interesar
            </h2>
            <div className={styles.relatedGrid}>
              {relatedItems.map((item) => (
                <Link
                  key={item.slug}
                  to={`/comunidad/${item.slug}`}
                  className={styles.relatedCard}
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className={styles.relatedImage}
                      loading="lazy"
                    />
                  ) : item.icon ? (
                    <span className={styles.relatedIcon} aria-hidden="true">
                      <GuideIcon icon={item.icon} />
                    </span>
                  ) : null}
                  <div className={styles.relatedBody}>
                    <span className={styles.relatedBadge}>{item.badge}</span>
                    <h3 className={styles.relatedHeading}>{item.title}</h3>
                    <p className={styles.relatedExcerpt}>{item.excerpt}</p>
                    <span className={styles.relatedMeta}>{item.meta}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <Link to="/comunidad" className={styles.backLink}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M15.41 16.59 10.83 12l4.58-4.59L14 6l-6 6 6 6z"
            />
          </svg>
          Volver a la comunidad
        </Link>
      </div>
    </div>
  );
};

export default ComunidadDetalle;
