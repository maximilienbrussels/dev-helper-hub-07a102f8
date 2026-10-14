/** Official stylised "M" mark of Maximilien. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      role="img"
      aria-label="Maximilien"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="40" height="40" rx="10" className="fill-primary" />
      {/* stylised M: two upward strokes meeting in a peak */}
      <path
        d="M10 29V13.5l10 9 10-9V29"
        className="stroke-primary-foreground"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 29v-5"
        className="stroke-primary-foreground"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}
