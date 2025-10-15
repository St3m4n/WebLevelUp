import type { CommunityGuideIcon } from '@/types';

interface GuideIconProps {
  icon: CommunityGuideIcon;
  className?: string;
}

const GuideIcon: React.FC<GuideIconProps> = ({ icon, className }) => {
  switch (icon) {
    case 'controller':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
          <path
            fill="currentColor"
            d="M7.5 7A4.5 4.5 0 0 0 3 11.5v2.25A3.25 3.25 0 0 0 6.25 17h1.5a1 1 0 0 0 .9-.55l.56-1.1a.5.5 0 0 1 .45-.28h4.68a.5.5 0 0 1 .45.28l.56 1.1a1 1 0 0 0 .9.55h1.5A3.25 3.25 0 0 0 21 13.75V11.5A4.5 4.5 0 0 0 16.5 7Zm0 2H9v1.5h1.5v1.5H9V13H7.5v-1.5H6V10.5h1.5Zm8 0A1 1 0 1 1 14.5 10a1 1 0 0 1 1-.95Zm2 2A1 1 0 1 1 16.5 12a1 1 0 0 1 1-.95Z"
          />
        </svg>
      );
    case 'motherboard':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
          <path
            fill="currentColor"
            d="M6 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3Zm0 2h12a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-1v-3h-2v3h-6v-3H7v3H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm3 1v6h6V6Zm2 2h2v2h-2Zm-6 4h3v2H5Zm11 0h3v2h-3Z"
          />
        </svg>
      );
    case 'tools':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
          <path
            fill="currentColor"
            d="M10.59 3.42a3.5 3.5 0 0 1 4.95 4.95l-.53.53 2.12 2.12 1.06-1.06a1 1 0 0 1 1.42 0l1.41 1.41a1 1 0 0 1 0 1.42l-5.3 5.3a1 1 0 0 1-1.42 0l-1.41-1.41a1 1 0 0 1 0-1.42l1.06-1.06-2.12-2.12-.53.53a3.5 3.5 0 0 1-4.95-4.95l1.06-1.06-1.41-1.41a1 1 0 0 1 0-1.42l1.41-1.41a1 1 0 0 1 1.42 0l1.41 1.41Zm.7 2.12-1.41 1.41a1.5 1.5 0 1 0 2.12 2.12l1.41-1.41Z"
          />
        </svg>
      );
    case 'camera':
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
          <path
            fill="currentColor"
            d="M9.5 5a1.5 1.5 0 0 1 1.35-.83h2.3A1.5 1.5 0 0 1 14.5 5H20a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm2.5 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z"
          />
        </svg>
      );
  }
};

export default GuideIcon;
