/**
 * Leaflet-kaart met de échte route (browser-only). Wordt lui geladen door
 * ChatRouteMap zodat Leaflet nooit tijdens SSR wordt geïmporteerd.
 */
import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import type { RouteMapResult } from "@/routes/api/route-map";
import type { Lang } from "@/lib/i18n";

/** Label voor de vertrekmarker in de taal van het gesprek. */
const YOU_LABEL: Record<Lang, string> = {
  nl: "Jouw Locatie",
  fr: "Votre Position",
  en: "Your Location",
};

function pin(color: string) {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:${color};box-shadow:0 0 0 3px rgba(255,255,255,.9),0 1px 4px rgba(0,0,0,.4)"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function FitRoute({ path }: { path: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (path.length > 1) map.fitBounds(L.latLngBounds(path), { padding: [24, 24] });
  }, [map, path]);
  return null;
}

export default function RouteMapCanvas({ data, lang }: { data: RouteMapResult; lang: Lang }) {
  const start: [number, number] = [data.start.lat, data.start.lon];
  const end: [number, number] = [data.end.lat, data.end.lon];
  const youLabel = YOU_LABEL[lang] ?? YOU_LABEL.nl;

  return (
    <MapContainer
      center={end}
      zoom={14}
      scrollWheelZoom={false}
      style={{ height: "16rem", width: "100%" }}
      className="rounded-xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline positions={data.path} pathOptions={{ color: "#c2410c", weight: 5, opacity: 0.9 }} />
      <Marker position={start} icon={pin("#0f766e")}>
        <Tooltip>{youLabel}</Tooltip>
      </Marker>
      <Marker position={end} icon={pin("#c2410c")}>
        <Tooltip>{data.end.label}</Tooltip>
      </Marker>
      <FitRoute path={data.path} />
    </MapContainer>
  );
}
