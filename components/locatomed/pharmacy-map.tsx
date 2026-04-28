"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { PharmacyWithStock } from "@/lib/actions/medicine-search-actions";

interface PharmacyMapProps {
  pharmacies: PharmacyWithStock[];
  selectedId?: string | null;
  onSelect?: (pharmacyId: string) => void;
  /** Tangier city center fallback */
  center?: [number, number];
  zoom?: number;
}

const TANGIER_CENTER: [number, number] = [35.7673, -5.7998];

export default function PharmacyMap({
  pharmacies,
  selectedId,
  onSelect,
  center = TANGIER_CENTER,
  zoom = 13,
}: PharmacyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<Map<string, import("leaflet").Marker>>(new Map());

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Dynamic import ensures Leaflet only runs in the browser
    import("leaflet").then((L) => {
      const map = L.map(containerRef.current!, { zoomControl: true }).setView(center, zoom);

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        },
      ).addTo(map);

      mapRef.current = map;

      // Initial markers
      addMarkers(L, map, pharmacies, onSelect);
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when pharmacies change
  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then((L) => {
      // Remove old markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      addMarkers(L, mapRef.current!, pharmacies, onSelect);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pharmacies]);

  // Pan to selected pharmacy
  useEffect(() => {
    if (!selectedId || !mapRef.current) return;
    const pharmacy = pharmacies.find((p) => p.pharmacyId === selectedId);
    if (pharmacy) {
      mapRef.current.panTo([pharmacy.lat, pharmacy.lng], { animate: true });
      markersRef.current.get(selectedId)?.openPopup();
    }
  }, [selectedId, pharmacies]);

  function addMarkers(
    L: typeof import("leaflet"),
    map: import("leaflet").Map,
    items: PharmacyWithStock[],
    onSelectFn?: (id: string) => void,
  ) {
    for (const p of items) {
      const color =
        p.status === "out_of_stock"
          ? "#ef4444"
          : p.isOnDuty
            ? "#f59e0b"
            : "#06b6d4";

      const icon = L.divIcon({
        className: "",
        html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.5)"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        popupAnchor: [0, -12],
      });

      const dutyBadge = p.isOnDuty
        ? `<span style="background:#f59e0b;color:#000;font-size:10px;padding:1px 6px;border-radius:4px;font-weight:700">DE GARDE</span>`
        : "";

      const popup = `
        <div style="font-family:sans-serif;min-width:160px">
          <strong style="font-size:13px">${p.pharmacyName}</strong>
          ${dutyBadge ? `<div style="margin:4px 0">${dutyBadge}</div>` : ""}
          <div style="font-size:11px;color:#888;margin-top:4px">${p.address ?? ""}</div>
          ${p.openingHours ? `<div style="font-size:11px;margin-top:2px">🕐 ${p.openingHours}</div>` : ""}
          <div style="font-size:12px;margin-top:6px;font-weight:600">
            Qté: ${p.quantity} · ${p.price.toFixed(2)} MAD
          </div>
        </div>`;

      const marker = L.marker([p.lat, p.lng], { icon })
        .addTo(map)
        .bindPopup(popup);

      marker.on("click", () => onSelectFn?.(p.pharmacyId));
      markersRef.current.set(p.pharmacyId, marker);
    }

    // Fit bounds if we have markers
    if (items.length > 0) {
      const bounds = L.latLngBounds(items.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-lg overflow-hidden"
      style={{ minHeight: 400 }}
    />
  );
}
