import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function WorldIcon({ className = "size-5", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M3.5 9h17M3.5 15h17M12 3c2.25 2.45 3.4 5.45 3.4 9S14.25 18.55 12 21M12 3C9.75 5.45 8.6 8.45 8.6 12s1.15 6.55 3.4 9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BrazilFlag({ className = "h-4 w-6", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 30 20"
      className={className}
      role="img"
      aria-label="Brasil"
      {...props}
    >
      <rect width="30" height="20" rx="2" fill="#169B62" />
      <path d="m15 3 10 7-10 7L5 10l10-7Z" fill="#FFDA44" />
      <circle cx="15" cy="10" r="4" fill="#0A3D91" />
      <path d="M11.4 9.2c2.8-.9 5.3-.35 7.25.9" fill="none" stroke="#fff" strokeWidth=".85" />
    </svg>
  );
}

export function UnitedStatesFlag({ className = "h-4 w-6", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 30 20"
      className={className}
      role="img"
      aria-label="United States"
      {...props}
    >
      <rect width="30" height="20" rx="2" fill="#fff" />
      <path
        d="M0 0h30v1.55H0Zm0 3.08h30v1.54H0Zm0 3.08h30V7.7H0Zm0 3.08h30v1.54H0Zm0 3.08h30v1.54H0Zm0 3.08h30v1.54H0Zm0 3.08h30V20H0Z"
        fill="#D52B3F"
      />
      <path d="M0 0h13v10.78H0Z" fill="#173B75" />
      <g fill="#fff">
        <circle cx="2" cy="2" r=".65" />
        <circle cx="5" cy="2" r=".65" />
        <circle cx="8" cy="2" r=".65" />
        <circle cx="11" cy="2" r=".65" />
        <circle cx="3.5" cy="4.2" r=".65" />
        <circle cx="6.5" cy="4.2" r=".65" />
        <circle cx="9.5" cy="4.2" r=".65" />
        <circle cx="2" cy="6.4" r=".65" />
        <circle cx="5" cy="6.4" r=".65" />
        <circle cx="8" cy="6.4" r=".65" />
        <circle cx="11" cy="6.4" r=".65" />
        <circle cx="3.5" cy="8.6" r=".65" />
        <circle cx="6.5" cy="8.6" r=".65" />
        <circle cx="9.5" cy="8.6" r=".65" />
      </g>
    </svg>
  );
}
