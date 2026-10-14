import type { SVGProps } from "react";

/** Officiële Bluesky-vlinder als subtiele bronmarkering. */
export function BlueskyIcon({ className, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 600 530"
      fill="currentColor"
      aria-hidden
      focusable="false"
      className={className}
      {...rest}
    >
      <path d="M135.7 44.0c66.5 49.9 138 151.1 164.3 205.4C326.3 195.1 397.8 93.9 464.3 44.0 512.3 8.0 590-19.8 590 68.8c0 17.7-10.2 148.6-16.1 169.9-20.7 74.0-96.2 92.9-163.3 81.5 117.3 20.0 147.1 86.1 82.7 152.2-122.4 125.6-175.9-31.5-189.6-71.8-2.5-7.4-3.7-10.8-3.7-7.8 0-3.0-1.2 0.4-3.7 7.8-13.7 40.3-67.2 197.4-189.6 71.8-64.4-66.1-34.6-132.2 82.7-152.2-67.1 11.4-142.6-7.5-163.3-81.5C20.2 217.4 10 86.5 10 68.8 10-19.8 87.7 8.0 135.7 44.0Z" />
    </svg>
  );
}
