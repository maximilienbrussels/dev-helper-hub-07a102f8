/** Officiële ROUT verified badge. */
import { handleImageError } from "@/lib/image-fallback";
export function RoutBadge({ className = "" }: { className?: string }) {
  return (
    <a
      href="https://rout.be/maximilien.brussels"
      target="_blank"
      rel="noopener"
      className={`inline-block rounded-md transition-opacity hover:opacity-85 focus:outline-none focus:ring-2 focus:ring-primary/50 ${className}`}
    >
      <img
        src="https://rout.be/api/public/badge/maximilien.brussels"
        onError={handleImageError}
        alt="Verified on ROUT — @maximilien.brussels"
        width={220}
        height={40}
        loading="lazy"
        className="h-[40px] w-auto object-contain"
      />
    </a>
  );
}
