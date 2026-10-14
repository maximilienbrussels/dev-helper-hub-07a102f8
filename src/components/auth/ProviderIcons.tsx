/**
 * Officiële merklogo's van de identiteitsproviders.
 *
 * Google vereist het originele meerkleurige "G"-logo (brandingregels), dus
 * gebruiken we hier de exacte paden en kleuren — géén ge-tinte icoonfont.
 */
import { ROUT_LOGO_PATH } from "./rout-logo";

type IconProps = { className?: string };

const BASE = "h-5 w-5 shrink-0";

export function GoogleIcon({ className = BASE }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59A14.5 14.5 0 0 1 9.77 24c0-1.6.27-3.15.76-4.59l-7.98-6.19A23.94 23.94 0 0 0 0 24c0 3.88.93 7.55 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.46-9.9l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export function GitHubIcon({ className = BASE }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 .5C5.73.5.5 5.73.5 12.02c0 5.03 3.29 9.29 7.86 10.76.58.1.79-.25.79-.55v-2.1c-3.2.7-3.88-1.36-3.88-1.36-.53-1.34-1.29-1.7-1.29-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.75.41-1.27.74-1.56-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.4-5.26 5.69.42.36.79 1.08.79 2.18v3.23c0 .31.21.66.8.55 4.56-1.48 7.85-5.74 7.85-10.76C23.5 5.73 18.27.5 12 .5z"
      />
    </svg>
  );
}

export function GitLabIcon({ className = BASE }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="#E24329" d="M12 22.5 16.42 8.9H7.58L12 22.5z" />
      <path fill="#FC6D26" d="M12 22.5 7.58 8.9H1.39L12 22.5z" />
      <path fill="#FCA326" d="M1.39 8.9 .04 13.03a.92.92 0 0 0 .33 1.03L12 22.5 1.39 8.9z" />
      <path fill="#E24329" d="M1.39 8.9h6.19L4.92.71a.46.46 0 0 0-.87 0L1.39 8.9z" />
      <path fill="#FC6D26" d="M12 22.5 16.42 8.9h6.19L12 22.5z" />
      <path fill="#FCA326" d="M22.61 8.9l1.35 4.13a.92.92 0 0 1-.33 1.03L12 22.5 22.61 8.9z" />
      <path fill="#E24329" d="M22.61 8.9h-6.19L19.08.71a.46.46 0 0 1 .87 0L22.61 8.9z" />
    </svg>
  );
}

export function MastodonIcon({ className = BASE }: IconProps) {
  return (
    <svg className={className} viewBox="-2 -2 28 28" aria-hidden="true" focusable="false">
      <path
        fill="#6364FF"
        d="M23.19 7.06c0-5.13-3.36-6.63-3.36-6.63C18.14.68 15.26.34 12.27.32h-.08c-3 .02-5.87.36-7.57 1.11 0 0-3.36 1.5-3.36 6.63 0 1.17-.02 2.57.01 4.05.12 5 .4 9.94 5.05 11.17 2.14.57 3.98.68 5.46.6 2.69-.15 4.2-.96 4.2-.96l-.09-1.95s-1.92.6-4.08.53c-2.14-.07-4.4-.23-4.75-2.86a5.4 5.4 0 0 1-.05-.74s2.1.51 4.76.63c1.63.08 3.15-.1 4.7-.28 2.97-.36 5.55-2.19 5.88-3.87.51-2.65.47-6.47.47-6.47zm-3.94 6.57h-2.45V7.66c0-1.26-.53-1.9-1.59-1.9-1.17 0-1.76.76-1.76 2.26v3.28h-2.43V8.02c0-1.5-.59-2.26-1.76-2.26-1.06 0-1.59.64-1.59 1.9v5.97H5.17V7.48c0-1.26.32-2.26.97-3 .66-.74 1.53-1.12 2.6-1.12 1.25 0 2.19.48 2.82 1.44l.61 1.02.61-1.02c.63-.96 1.57-1.44 2.82-1.44 1.07 0 1.94.38 2.6 1.12.65.74.97 1.74.97 3v6.15z"
      />
    </svg>
  );
}

export function KeycloakIcon({ className = BASE }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="#33A0C4"
        d="M7.5 2h9L21 12l-4.5 10h-9L3 12 7.5 2zm1.28 2L5.2 12l3.58 8h6.44l3.58-8-3.58-8H8.78z"
      />
      <path fill="#008AAA" d="M9.6 7.2h2.1v3.3l2.5-3.3h2.4l-3 3.9 3 4.9h-2.5l-2.4-4v4H9.6V7.2z" />
    </svg>
  );
}

export function BlueskyIcon({ className = BASE }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 600 530" aria-hidden="true" focusable="false">
      <path
        fill="#0285FF"
        d="M135.7 44c66.5 49.9 138 151.1 164.3 205.4C326.3 195.1 397.8 93.9 464.3 44 512.3 8 590-19.8 590 68.8c0 17.7-10.2 148.6-16.1 169.9-20.7 74-96.2 92.9-163.3 81.5 117.3 20 147.1 86.1 82.7 152.2-122.4 125.6-175.9-31.5-189.6-71.8-2.5-7.4-3.7-10.8-3.7-7.8 0-3-1.2.4-3.7 7.8-13.7 40.3-67.2 197.4-189.6 71.8-64.4-66.1-34.6-132.2 82.7-152.2-67.1 11.4-142.6-7.5-163.3-81.5C20.2 217.4 10 86.5 10 68.8 10-19.8 87.7 8 135.7 44Z"
      />
    </svg>
  );
}

export function RoutIcon({ className = BASE }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 1024 1254" role="img" aria-label="ROUT" focusable="false">
      <g transform="translate(0,1254) scale(0.1,-0.1)" stroke="none">
        <path fill="currentColor" d={ROUT_LOGO_PATH} />
      </g>
    </svg>
  );
}
