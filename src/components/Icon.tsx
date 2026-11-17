import type { SVGProps } from 'react';

/** 직접 그린 아이콘 세트: 24px 격자, 선 굵기 1.75, 둥근 끝 */
const PATHS = {
  concert: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" /></>,
  musical: <><path d="M5 4.5h14v6.5a7 7 0 0 1-14 0z" /><path d="M8.4 9.3h2.2M13.4 9.3h2.2M9 13.4c1.7 1.5 4.3 1.5 6 0" /></>,
  movie: <><path d="M4 10.5h16V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" /><path d="m4 10.5-.8-3.7a1 1 0 0 1 .8-1.2l13.6-2.9a1 1 0 0 1 1.2.8l.6 2.9z" /><path d="m8 4.9 2.5 4.2M12.7 3.9l2.5 4.2" /></>,
  sports: <><ellipse cx="12" cy="12" rx="9" ry="6.5" /><ellipse cx="12" cy="12" rx="4.5" ry="2.8" /><path d="M12 5.5v3.7M12 14.8v3.7M3 12h4.5M16.5 12H21" /></>,
  baseball: <><circle cx="12" cy="12" r="8.5" /><path d="M6.3 5.7c2.3 3.7 2.3 8.9 0 12.6M17.7 5.7c-2.3 3.7-2.3 8.9 0 12.6" /></>,
  soccer: <><circle cx="12" cy="12" r="8.5" /><path d="m12 8.3 3.5 2.6-1.3 4.1H9.8l-1.3-4.1z" /><path d="M12 3.5v4.8M20.1 9.9l-4.6 1M17.2 18.7l-3-3.7M6.8 18.7l3-3.7M3.9 9.9l4.6 1" /></>,
  basketball: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5v17M6 6c2.5 2.3 2.5 9.7 0 12M18 6c-2.5 2.3-2.5 9.7 0 12" /></>,
  volleyball: <><circle cx="12" cy="12" r="8.5" /><path d="M12 12c-.9-3.4.4-6.4 2.9-8M12 12c3.4-.9 6.5.5 8.1 3M12 12c-2.5 2.5-5.9 2.7-8.3 1.2" /><path d="M7.3 4.9c-1.4 2.6-1.3 5.6.3 8.2M20 9.2c-2.9-.3-5.7.9-7.4 3.2M9.6 20.1c1.6-2.5 4.1-4 7-4.1" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  chevron: <path d="m9 6 6 6-6 6" />,
  back: <path d="M19 12H5M11 6l-6 6 6 6" />,
  seat: <><path d="M7 11V7.5A3.5 3.5 0 0 1 10.5 4h3A3.5 3.5 0 0 1 17 7.5V11" /><path d="M5 10.5a2 2 0 0 1 2 2V15h10v-2.5a2 2 0 1 1 4 0V17a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4.5a2 2 0 0 1 2-2z" /><path d="M6.5 18v2M17.5 18v2" /></>,
} as const;

export type IconName = keyof typeof PATHS;

export default function Icon({ name, size = 20, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.75}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false" {...rest}>
      {PATHS[name]}
    </svg>
  );
}

export function Logo({ name }: { name: string }) {
  return (
    <>
      <span className="logo-mark"><Icon name="seat" size={17} strokeWidth={2.1} /></span>
      {name}
    </>
  );
}
