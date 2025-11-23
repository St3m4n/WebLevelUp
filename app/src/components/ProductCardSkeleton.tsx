import type { FC } from 'react';
import styles from './ProductCardSkeleton.module.css';

type ProductCardSkeletonProps = {
  variant?: 'default' | 'compact';
  showButton?: boolean;
};

const joinClassNames = (
  ...values: Array<string | undefined | null | false>
): string => values.filter(Boolean).join(' ');

const ProductCardSkeleton: FC<ProductCardSkeletonProps> = ({
  variant = 'default',
  showButton = true,
}) => {
  const cardClassName = joinClassNames(
    styles.card,
    variant === 'compact' ? styles.cardCompact : undefined
  );

  return (
    <article className={cardClassName} aria-hidden="true">
      <div className={joinClassNames(styles.media, styles.skeleton)} />
      <div className={styles.body}>
        <div className={joinClassNames(styles.title, styles.skeleton)} />
        <div className={styles.description}>
          <div className={joinClassNames(styles.line, styles.skeleton)} />
          <div
            className={joinClassNames(
              styles.line,
              styles.lineShort,
              styles.skeleton
            )}
          />
        </div>
        <div className={joinClassNames(styles.price, styles.skeleton)} />
        {showButton ? (
          <div className={joinClassNames(styles.button, styles.skeleton)} />
        ) : null}
      </div>
    </article>
  );
};

export default ProductCardSkeleton;
