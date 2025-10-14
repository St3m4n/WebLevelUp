import { useEffect, useState } from 'react';

type SectionConfig = {
  id: string;
  threshold?: number;
};

type UseActiveSectionOptions = {
  sections: SectionConfig[];
  rootMargin?: string;
};

export const useActiveSection = ({
  sections,
  rootMargin = '-40% 0px -40% 0px',
}: UseActiveSectionOptions) => {
  const [activeSection, setActiveSection] = useState<string>(
    sections[0]?.id ?? ''
  );

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sections.forEach(({ id, threshold }) => {
      const element = document.getElementById(id);
      if (!element) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection(id);
            }
          });
        },
        {
          threshold: threshold ?? 0.5,
          rootMargin,
        }
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [sections, rootMargin]);

  return activeSection;
};
