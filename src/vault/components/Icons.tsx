import type {SVGProps} from 'react';

type IconProps = SVGProps<SVGSVGElement> & {size?: number};

const base = ({size = 18, ...rest}: IconProps) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...rest,
});

export const IconPlus = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconSearch = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </svg>
);

export const IconLock = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    <path d="M12 14.5v2" />
  </svg>
);

export const IconUnlock = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 6.6-1.6" />
  </svg>
);

export const IconSettings = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="2.8" />
    <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M18 6l-1.4 1.4M7.4 16.6 6 18" />
  </svg>
);

export const IconShare = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 15V4m0 0L8.5 7.5M12 4l3.5 3.5" />
    <path d="M5 13v5.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V13" />
  </svg>
);

export const IconPin = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M9 4h6l-.8 6 3 3v1.5H6.8V13l3-3L9 4Z" />
    <path d="M12 14.5V20" />
  </svg>
);

export const IconStar = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="m12 4 2.4 5 5.6.7-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.6-.7L12 4Z" />
  </svg>
);

export const IconTrash = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4.5 7h15M9.5 7V4.8h5V7M7 7l.8 12.2h8.4L17 7" />
    <path d="M10 10.5v6M14 10.5v6" />
  </svg>
);

export const IconEdit = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4.5 19.5h4L20 8l-4-4L4.5 15.5v4Z" />
    <path d="m13.5 5.5 5 5" />
  </svg>
);

export const IconArrowLeft = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4.5 12h15M11 5.5 4.5 12l6.5 6.5" />
  </svg>
);

export const IconChevron = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="m7 9.5 5 5 5-5" />
  </svg>
);

export const IconPhone = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="7" y="3.5" width="10" height="17" rx="2.2" />
    <path d="M10.5 6.5h3" />
    <path d="M10.8 17.2h2.4" />
  </svg>
);

export const IconDownload = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 4v11m0 0 4-4m-4 4-4-4" />
    <path d="M5 17.5v1.7h14v-1.7" />
  </svg>
);

export const IconCloud = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M7.5 18.5h9a3.5 3.5 0 0 0 .4-7 5 5 0 0 0-9.6-1.4 4 4 0 0 0 .2 8.4Z" />
  </svg>
);

export const IconCheck = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </svg>
);

export const IconClose = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const IconMenu = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4.5 7h15M4.5 12h15M4.5 17h10" />
  </svg>
);

export const IconExternal = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M14 4.5h5.5V10" />
    <path d="m19.5 4.5-8 8" />
    <path d="M18.5 14.5v4a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 18.5V7a1.5 1.5 0 0 1 1.5-1.5H10" />
  </svg>
);

export const IconPaperclip = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M19 11.5 12 18.5a4.2 4.2 0 0 1-6-6l7.6-7.6a3 3 0 0 1 4.3 4.3L10.5 17a1.8 1.8 0 0 1-2.5-2.5L15 7.5" />
  </svg>
);

export const IconImage = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="4" y="5" width="16" height="14" rx="2" />
    <circle cx="9" cy="10" r="1.4" />
    <path d="m4.8 17 4.7-4.4 3.3 3 2.7-2.4L19.4 17" />
  </svg>
);

export const IconRestore = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4.5 12a7.5 7.5 0 1 0 2.4-5.5" />
    <path d="M4.5 4.5V9H9" />
  </svg>
);

export const IconClock = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4.3l2.7 1.7" />
  </svg>
);

export const IconSun = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="3.6" />
    <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M18 6l-1.4 1.4M7.4 16.6 6 18" />
  </svg>
);

export const IconSpinner = (props: IconProps) => (
  <svg {...base(props)} className="vault-spinner">
    <path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5" />
  </svg>
);

export const IconCopy = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M15 6.5V5.8A1.8 1.8 0 0 0 13.2 4H5.8A1.8 1.8 0 0 0 4 5.8v7.4A1.8 1.8 0 0 0 5.8 15h.7" />
  </svg>
);

export const IconQr = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="4" y="4" width="6" height="6" rx="1" />
    <rect x="14" y="4" width="6" height="6" rx="1" />
    <rect x="4" y="14" width="6" height="6" rx="1" />
    <path d="M14 14h2.5v2.5H14zM19.5 14H20v2M14 19.5h2M18 18h2v2h-2z" />
  </svg>
);

