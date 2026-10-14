import {
  useCallback,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type SVGProps,
} from "react";
import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";
import { useSiteConfig } from "@/lib/use-site-config";
import { activeSocialLinks } from "@/lib/site-config";
import eyouAsset from "@/assets/eyou-logo.png";
import wsocialAsset from "@/assets/wsocial-logo.png";

type SocialPlatform = {
  /** Koppelt dit icoon aan een kanaal-id uit site-config (DEFAULT_SOCIAL_LINKS). */
  id: string;
  name: string;
  href: string;
  path?: string;
  viewBox?: string;
  imgSrc?: string;
  /** Extra rel-waarden, bv. "me" voor fediverse-verificatie. */
  rel?: string;
  /** Optische correctie: visuele schaal en verschuiving binnen de cirkel. */
  scale?: number;
  dx?: number;
  dy?: number;
};


const iconProps: SVGProps<SVGSVGElement> = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "currentColor",
  xmlns: "http://www.w3.org/2000/svg",
  "aria-hidden": true,
  focusable: false,
};

const socialPlatforms: SocialPlatform[] = [
  {
    name: "Facebook",
    id: "facebook",
    scale: 0.96,
    dx: -0.2,
    dy: 0.1,
    href: "https://facebook.com/maximilienbrussels",
    path: "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z",
  },
  {
    name: "Instagram",
    id: "instagram",
    scale: 1.02,
    dx: 0,
    dy: 0,
    href: "https://instagram.com/maximilienbrussels",
    path: "M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077",
  },
  {
    name: "YouTube",
    id: "youtube",
    scale: 1.08,
    dx: 0,
    dy: 0,
    href: "https://youtube.com/@maximilienbrussels",
    path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  },
  {
    name: "LinkedIn",
    id: "linkedin",
    scale: 0.95,
    dx: 0.1,
    dy: -0.1,
    href: "https://linkedin.com/company/maximilienbrussels",
    path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  },
  {
    name: "Mastodon",
    id: "mastodon",
    scale: 1.0,
    dx: 0,
    dy: -0.2,
    href: "https://mastodon.social/@maximilienbrussels",
    rel: "me",

    path: "M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 0 0 .023-.043v-1.809a.052.052 0 0 0-.02-.041.053.053 0 0 0-.046-.01 20.282 20.282 0 0 1-4.709.545c-2.73 0-3.463-1.284-3.674-1.818a5.593 5.593 0 0 1-.319-1.433.053.053 0 0 1 .066-.054c1.517.363 3.072.546 4.632.546.376 0 .75 0 1.125-.01 1.57-.044 3.224-.124 4.768-.422.038-.008.077-.015.11-.024 2.435-.464 4.753-1.92 4.989-5.604.008-.145.03-1.52.03-1.67.002-.512.167-3.63-.024-5.545zm-3.748 9.195h-2.561V8.29c0-1.309-.55-1.976-1.67-1.976-1.23 0-1.846.79-1.846 2.35v3.403h-2.546V8.663c0-1.56-.617-2.35-1.848-2.35-1.112 0-1.668.668-1.67 1.977v6.218H4.822V8.102c0-1.31.337-2.35 1.011-3.12.696-.77 1.608-1.164 2.74-1.164 1.311 0 2.302.5 2.962 1.498l.638 1.06.638-1.06c.66-.999 1.65-1.498 2.96-1.498 1.13 0 2.043.395 2.74 1.164.675.77 1.012 1.81 1.012 3.12z",
  },
  {
    name: "Bluesky",
    id: "bluesky",
    scale: 1.22,
    dx: 0,
    dy: 0.2,
    href: "https://bsky.app/profile/maximilien.brussels",
    path: "M5.202 2.857C7.954 4.922 10.913 9.11 12 11.358c1.087-2.247 4.046-6.436 6.798-8.501C20.783 1.366 24 .213 24 3.883c0 .732-.42 6.156-.667 7.037-.856 3.061-3.978 3.842-6.755 3.37 4.854.826 6.089 3.562 3.422 6.299-5.065 5.196-7.28-1.304-7.847-2.97-.104-.305-.152-.448-.153-.327 0-.121-.05.022-.153.327-.568 1.666-2.782 8.166-7.847 2.97-2.667-2.737-1.432-5.473 3.422-6.3-2.777.473-5.899-.308-6.755-3.369C.42 10.04 0 4.615 0 3.883c0-3.67 3.217-2.517 5.202-1.026",
  },
  {
    name: "PeerTube",
    id: "peertube",
    scale: 1.12,
    dx: -0.3,
    dy: 0.2,
    href: "https://peertube.be/c/maximilienbrussels",
    path: "M12 6.545v10.91L20.727 12M3.273 12v12L12 17.455M3.273 0v12L12 6.545",
  },
  {
    name: "Pinterest",
    id: "pinterest",
    scale: 0.92,
    dx: 0,
    dy: -0.2,
    href: "https://pinterest.com/maximilienbrussels",
    path: "M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z",
  },
  {
    name: "WSocial",
    id: "wsocial",
    scale: 1.0,
    dx: 0,
    dy: 0,
    href: "https://wsocial.com/maximilienbrussels",
    imgSrc: wsocialAsset,
  },
  {
    name: "eYou",
    id: "eyou",
    scale: 1.0,
    dx: 0,
    dy: 0,
    href: "https://eyou.com/maximilienbrussels",
    imgSrc: eyouAsset,
  },
  {
    name: "GitHub",
    id: "github",
    scale: 1.05,
    dx: 0,
    dy: 0.2,
    href: "https://github.com/maximilienbrussels",
    path: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
  },
  {
    name: "Discord",
    id: "discord",
    scale: 1.05,
    dx: 0,
    dy: 0.1,
    href: "https://discord.gg/maximilienbrussels",
    path: "M20.317 4.3698a19.7913 19.7913 0 0 0-4.8851-1.5152.0741.0741 0 0 0-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 0 0-.0785-.037 19.7363 19.7363 0 0 0-4.8852 1.515.0699.0699 0 0 0-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 0 0 .0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 0 0 .0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 0 0-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 0 1-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 0 1 .0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 0 1 .0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 0 1-.0066.1276 12.2986 12.2986 0 0 1-1.873.8914.0766.0766 0 0 0-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 0 0 .0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 0 0 .0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 0 0-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z",
  },
];

const LOOP_COPIES = 2;
/** Minimum aantal actieve kanalen voordat de automatische scroll start. */
const MIN_FOR_MARQUEE = 5;

/** Actieve platforms uit de siteconfig, met URL uit de databank waar aanwezig. */
function useActivePlatforms(): SocialPlatform[] {
  const config = useSiteConfig();
  const active = activeSocialLinks(config);
  const byId = new Map(active.map((l) => [l.id, l]));
  return socialPlatforms
    .filter((p) => byId.has(p.id))
    .map((p) => ({ ...p, href: byId.get(p.id)?.url || p.href }))
    .sort((a, b) => (byId.get(a.id)?.order ?? 0) - (byId.get(b.id)?.order ?? 0));
}

/**
 * Rendert één platform-icoon met optische correctie: elk icoon wordt individueel
 * geschaald en verschoven zodat alles even groot en gecentreerd oogt.
 */
function PlatformIcon({ platform, size }: { platform: SocialPlatform; size: number }) {
  const scale = platform.scale ?? 1;
  const dx = ((platform.dx ?? 0) / 24) * size;
  const dy = ((platform.dy ?? 0) / 24) * size;
  const style = {
    transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
    transformOrigin: "center",
  } as const;

  if (platform.imgSrc) {
    return (
      <span
        className="eyou-mask inline-block bg-current"
        style={{
          ...style,
          width: size,
          height: size,
          WebkitMaskImage: `url(${platform.imgSrc})`,
          maskImage: `url(${platform.imgSrc})`,
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
        }}
        aria-hidden="true"
      />
    );
  }

  return (
    <svg
      {...iconProps}
      width={size}
      height={size}
      style={style}
      viewBox={platform.viewBox ?? iconProps.viewBox}
    >
      <path d={platform.path} />
    </svg>
  );
}

export function SocialCarousel() {
  const draggedRef = useRef(false);
  const pointerDownXRef = useRef<number | null>(null);
  const activePlatforms = useActivePlatforms();
  const useMarquee = activePlatforms.length >= MIN_FOR_MARQUEE;
  const loopedPlatforms = useMarquee
    ? Array.from({ length: LOOP_COPIES }, () => activePlatforms).flat()
    : activePlatforms;

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      dragFree: true,
      align: "start",
      containScroll: false,
      watchDrag: true,
    },
    useMarquee
      ? [
          AutoScroll({
            speed: 1,
            startDelay: 0,
            stopOnInteraction: false,
            stopOnMouseEnter: true,
            stopOnFocusIn: true,
            playOnInit: true,
          }),
        ]
      : [],
  );

  // Pause while dragging, resume smoothly on release.
  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      draggedRef.current = false;
      pointerDownXRef.current = e.clientX;
      emblaApi?.plugins()?.autoScroll?.stop();
    },
    [emblaApi],
  );

  const handlePointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const start = pointerDownXRef.current;
    if (start != null && Math.abs(e.clientX - start) > 6) draggedRef.current = true;
  }, []);

  const handlePointerEnd = useCallback(() => {
    pointerDownXRef.current = null;
    emblaApi?.plugins()?.autoScroll?.play();
  }, [emblaApi]);

  // Suppress the click that follows a drag so links don't open by accident.
  const handleLinkClickCapture = (e: ReactMouseEvent<HTMLAnchorElement>) => {
    if (draggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      draggedRef.current = false;
    }
  };

  if (activePlatforms.length === 0) return null;

  // Onder de drempel: rustige statische rij, zonder auto-scroll (geen embla-plugins actief).
  if (!useMarquee) {
    return (
      <nav aria-label="Social media" className="mt-5 w-full">
        <ul className="flex flex-wrap items-center justify-center gap-6 py-4">
          {activePlatforms.map((platform) => (
            <li key={platform.id} className="min-w-0 shrink-0">
              <a
                href={platform.href}
                target="_blank"
                rel={platform.rel ? platform.rel + " noopener noreferrer" : "noopener noreferrer"}
                aria-label={`Volg ons op ${platform.name}`}
                title={`Volg ons op ${platform.name}`}
                draggable={false}
                className="flex h-12 w-12 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-social-badge text-social-icon transition-[background-color,transform] duration-150 hover:bg-social-badge-hover active:scale-95"
              >
                <PlatformIcon platform={platform} size={22} />
              </a>
            </li>
          ))}
        </ul>
      </nav>
    );
  }

  return (
    <nav aria-label="Social media" className="social-carousel-shell mt-5 w-full">
      <div
        ref={emblaRef}
        className="no-scrollbar social-carousel-scroller w-full overflow-hidden px-4 py-2 sm:px-6"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        <ul className="flex items-center">
          {loopedPlatforms.map((platform, index) => (
            <li key={`${platform.id}-${index}`} className="min-w-0 shrink-0 pr-3">
              <a
                href={platform.href}
                target="_blank"
                rel={platform.rel ? platform.rel + " noopener noreferrer" : "noopener noreferrer"}
                aria-label={`Volg ons op ${platform.name}`}
                title={`Volg ons op ${platform.name}`}
                onClickCapture={handleLinkClickCapture}
                draggable={false}
                className="flex h-12 w-12 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-social-badge text-social-icon transition-[background-color,transform] duration-150 hover:bg-social-badge-hover active:scale-95"
              >
                <PlatformIcon platform={platform} size={22} />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

/** Compacte, statische rij social-iconen — voor de footer-onderbalk. */
export function SocialRow({ className = "" }: { className?: string }) {
  const activePlatforms = useActivePlatforms();
  return (
    <nav aria-label="Social media" className={"flex flex-wrap items-center gap-1.5 " + className}>
      {activePlatforms.map((platform) => (
        <a
          key={platform.id}
          href={platform.href}
          target="_blank"
          rel={platform.rel ? platform.rel + " noopener noreferrer" : "noopener noreferrer"}
          aria-label={`Volg ons op ${platform.name}`}
          title={platform.name}
          className="inline-flex h-9 w-9 min-h-0 min-w-0 shrink-0 items-center justify-center rounded-full bg-social-badge text-social-icon transition-colors hover:bg-social-badge-hover"
        >
          <PlatformIcon platform={platform} size={16} />
        </a>
      ))}
    </nav>
  );
}

export default SocialCarousel;

/**
 * Compacte, statische rij met de actieve sociale kanalen.
 * Gebruikt in de mobiele navigatielade — geen animatie, geen carousel.
 */
export function SocialIconRow({ className = "" }: { className?: string }) {
  const platforms = useActivePlatforms();
  if (platforms.length === 0) return null;
  return (
    <nav aria-label="Social media" className={className}>
      <ul className="flex flex-wrap items-center gap-2">
        {platforms.map((platform) => (
          <li key={platform.id}>
            <a
              href={platform.href}
              target="_blank"
              rel={platform.rel ? platform.rel + " noopener noreferrer" : "noopener noreferrer"}
              aria-label={platform.name}
              title={platform.name}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-social-badge text-social-icon transition-colors hover:bg-social-badge-hover"
            >
              <PlatformIcon platform={platform} size={18} />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
