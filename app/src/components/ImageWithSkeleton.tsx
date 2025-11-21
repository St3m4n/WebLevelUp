import { useState, type ImgHTMLAttributes, type SyntheticEvent } from 'react';
import styles from './ImageWithSkeleton.module.css';

type ImageWithSkeletonProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'className'
> & {
  className?: string;
  containerClassName?: string;
  skeletonClassName?: string;
};

const joinClassNames = (
  ...values: Array<string | undefined | null | false>
): string => values.filter(Boolean).join(' ');

const ImageWithSkeleton: React.FC<ImageWithSkeletonProps> = ({
  className,
  containerClassName,
  skeletonClassName,
  onLoad,
  onError,
  alt,
  ...imgProps
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.(event);
  };

  const handleError = (event: SyntheticEvent<HTMLImageElement>) => {
    setHasError(true);
    setIsLoaded(false);
    onError?.(event);
  };

  const showSkeleton = !isLoaded && !hasError;
  const containerClasses = joinClassNames(styles.container, containerClassName);
  const skeletonClasses = joinClassNames(styles.skeleton, skeletonClassName);
  const imageClasses = joinClassNames(
    styles.image,
    className,
    showSkeleton ? styles.hidden : undefined,
    hasError ? styles.hidden : undefined
  );

  return (
    <div className={containerClasses}>
      {showSkeleton && <div className={skeletonClasses} aria-hidden="true" />}
      {!hasError ? (
        <img
          {...imgProps}
          alt={alt}
          className={imageClasses}
          onLoad={handleLoad}
          onError={handleError}
        />
      ) : (
        <div className={styles.fallback} role="img" aria-label={alt ?? 'Imagen no disponible'}>
          <span>{alt ?? 'Imagen no disponible'}</span>
        </div>
      )}
    </div>
  );
};

export default ImageWithSkeleton;
