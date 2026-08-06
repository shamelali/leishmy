"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

export type MapInnerProps = {
  position: [number, number];
  location: string;
};

let iconReady = false;

function ensureIcon() {
  if (iconReady || typeof window === "undefined") return;
  iconReady = true;
  (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl = undefined;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

export default function MapInner({ position, location }: MapInnerProps) {
  ensureIcon();
  return (
    <MapContainer
      center={position}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={position}>
        {location && <Popup>{location}</Popup>}
      </Marker>
    </MapContainer>
  );
}
