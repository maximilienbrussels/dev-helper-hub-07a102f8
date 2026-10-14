/**
 * Handgeschreven vectorhandtekening in donkergroen. Puur SVG-pad, dus het
 * print haarscherp en heeft geen lettertype nodig.
 */
export function Signature({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 90" className={className} aria-hidden="true">
      <g fill="none" stroke="#1E3A2B" strokeLinecap="round" strokeLinejoin="round">
        <path
          strokeWidth="2.6"
          d="M14 62 c 10 -20 22 -38 32 -38 c 8 0 6 12 -2 22 c -8 10 -18 18 -14 24 c 4 6 18 -2 26 -12 c 8 -10 12 -20 18 -20 c 6 0 4 12 0 20 c -4 8 -6 14 -1 15 c 6 1 14 -10 20 -20 c 5 -9 9 -17 14 -17 c 5 0 3 10 0 18 c -3 8 -3 14 3 14 c 8 0 16 -12 24 -26"
        />
        <path
          strokeWidth="2.2"
          d="M132 60 c 14 -4 30 -14 40 -26 c 6 -8 4 -14 -2 -13 c -8 1 -14 16 -14 28 c 0 10 6 15 15 14 c 12 -1 24 -12 34 -26"
        />
        <path
          strokeWidth="2.2"
          d="M200 58 c 12 -2 24 -10 32 -20 c 5 -7 2 -12 -3 -10 c -7 3 -10 16 -8 24 c 2 7 9 10 17 8 c 12 -3 26 -14 38 -30"
        />
        <path strokeWidth="1.6" d="M96 72 c 40 8 108 8 168 -4" opacity="0.75" />
      </g>
    </svg>
  );
}
