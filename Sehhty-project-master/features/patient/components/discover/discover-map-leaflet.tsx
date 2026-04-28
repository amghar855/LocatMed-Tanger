"use client";

import { useEffect, useRef, useState } from "react";
import { divIcon, type DivIcon } from "leaflet";
import { Circle, MapContainer, Marker, Polyline, Popup, TileLayer, ZoomControl, useMap, useMapEvents } from "react-leaflet";
import { TANGIER_CENTER } from "@/features/patient/constants/tangier";
import { formatDistance } from "@/features/patient/utils/distance";
import type { HospitalDiscover, PharmacyDiscover } from "@/features/patient/types/discover";

type Props = {
  view: "hospitals" | "pharmacies";
  hospitals: HospitalDiscover[];
  pharmacies: Array<PharmacyDiscover & { distanceKm?: number }>;
  selectedId: string | null;
  nearestId: string | null;
  userLocation: { lat: number; lng: number };
  locationAccuracyM: number | null;
  radiusKm: number;
  directionTarget: { lat: number; lng: number } | null;
  sheetHeightVh?: number;
  onSelect: (id: string) => void;
  onZoomRadiusChange?: (radiusKm: number) => void;
};

type Point = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  subtitle: string;
  isOnDuty?: boolean;
  type?: string;
  distanceKm?: number;
};

type MarkerPalette = {
  stroke: string;
  fill: string;
  glyph: string;
};

// ── Road route via Leaflet Routing Machine ────────────────────────────────────
// Uses routing.openstreetmap.de (OSRM-compatible, more reliably reachable).
// Runs as a child of MapContainer so it has access to the map instance.
function RouteController({
  userLocation,
  destination,
}: {
  userLocation: { lat: number; lng: number };
  destination: { lat: number; lng: number } | null;
}) {
  const map = useMap();
  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);
  const latestRequestRef = useRef(0);

  // Keep a ref so the effect doesn't re-run on every GPS watchPosition tick.
  const userLocationRef = useRef(userLocation);
  userLocationRef.current = userLocation;

  useEffect(() => {
    if (!destination) {
      setRoutePoints([]);
      return;
    }

    const from = userLocationRef.current;
    const abortController = new AbortController();
    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;

    const fetchRoute = async () => {
      try {
        const routeUrl =
          "https://routing.openstreetmap.de/routed-car/route/v1/driving/" +
          `${from.lng},${from.lat};${destination.lng},${destination.lat}` +
          "?overview=full&geometries=geojson";

        const response = await fetch(routeUrl, {
          signal: abortController.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Routing request failed with status ${response.status}`);
        }

        const data = (await response.json()) as {
          routes?: Array<{ geometry?: { coordinates?: [number, number][] } }>;
        };
        const coordinates = data.routes?.[0]?.geometry?.coordinates;

        if (!coordinates?.length) {
          throw new Error("Routing response did not include a route geometry");
        }

        if (latestRequestRef.current !== requestId) return;

        setRoutePoints(coordinates.map(([lng, lat]) => [lat, lng] as [number, number]));
      } catch (error) {
        if (abortController.signal.aborted) return;
        console.error("Routing error:", error);
        setRoutePoints([]);
      }
    };

    void fetchRoute();

    return () => {
      abortController.abort();
    };
  }, [destination]);

  useEffect(() => {
    if (!routePoints.length) return;

    map.flyToBounds(routePoints, {
      paddingTopLeft: [20, 20],
      paddingBottomRight: [20, 140],
      maxZoom: 15,
      duration: 1,
    });
  }, [map, routePoints]);

  if (!routePoints.length) return null;

  return (
    <Polyline
      positions={routePoints}
      pathOptions={{ color: "#3b82f6", weight: 5, opacity: 0.75 }}
    />
  );
}

// Fly to selection, offsetting center upward to account for the bottom sheet
function FlyToSelection({
  points,
  selectedId,
  sheetHeightVh = 0,
}: {
  points: Point[];
  selectedId: string | null;
  sheetHeightVh?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!selectedId) return;
    const selected = points.find((point) => point.id === selectedId);
    if (!selected) return;

    if (sheetHeightVh > 0) {
      const sheetPx = window.innerHeight * (sheetHeightVh / 100);
      const tiny = 0.003;
      map.flyToBounds(
        [
          [selected.lat - tiny, selected.lng - tiny],
          [selected.lat + tiny, selected.lng + tiny],
        ],
        {
          paddingTopLeft: [20, 20],
          paddingBottomRight: [20, sheetPx + 20],
          maxZoom: 15,
          duration: 1.2,
          easeLinearity: 0.25,
        }
      );
    } else {
      map.flyTo([selected.lat, selected.lng], Math.max(map.getZoom(), 15), {
        duration: 1.5,
        easeLinearity: 0.25,
      });
    }
  }, [map, points, selectedId, sheetHeightVh]);

  return null;
}

function zoomForRadiusKm(radiusKm: number) {
  if (radiusKm <= 0) return 12;
  if (radiusKm <= 2) return 14;
  if (radiusKm <= 5) return 13;
  if (radiusKm <= 10) return 12;
  if (radiusKm <= 15) return 11;
  return 10;
}

function radiusKmForZoom(zoom: number) {
  const z = Math.round(zoom);
  if (z >= 14) return 2;
  if (z >= 13) return 5;
  if (z >= 12) return 10;
  if (z >= 11) return 15;
  return 20;
}

function ZoomOnRadius({
  radiusKm,
  userLocation,
  selectedId,
}: {
  radiusKm: number;
  userLocation: { lat: number; lng: number };
  selectedId: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedId) return;
    map.setView([userLocation.lat, userLocation.lng], zoomForRadiusKm(radiusKm), {
      animate: true,
    });
  }, [map, userLocation, radiusKm, selectedId]);

  return null;
}

function SyncRadiusOnZoom({
  selectedId,
  onZoomRadiusChange,
}: {
  selectedId: string | null;
  onZoomRadiusChange?: (radiusKm: number) => void;
}) {
  useMapEvents({
    zoomend: (event) => {
      if (selectedId) return;
      if (!onZoomRadiusChange) return;
      const zoom = event.target.getZoom();
      onZoomRadiusChange(radiusKmForZoom(zoom));
    },
  });

  return null;
}

function resolveMarkerPalette(point: Point, view: "hospitals" | "pharmacies"): MarkerPalette {
  if (view === "hospitals") {
    if (point.type === "private") {
      return { stroke: "#0f766e", fill: "#14b8a6", glyph: "C" };
    }
    if (point.type === "chu") {
      return { stroke: "#6d28d9", fill: "#8b5cf6", glyph: "U" };
    }
    return { stroke: "#b91c1c", fill: "#ef4444", glyph: "H" };
  }

  if (point.isOnDuty) {
    return { stroke: "#d97706", fill: "#f59e0b", glyph: "G" };
  }

  return { stroke: "#0891b2", fill: "#06b6d4", glyph: "P" };
}

function createFacilityIcon({
  point,
  view,
  isSelected,
  isNearest,
}: {
  point: Point;
  view: "hospitals" | "pharmacies";
  isSelected: boolean;
  isNearest: boolean;
}): DivIcon {
  const palette = resolveMarkerPalette(point, view);
  const size = isSelected ? 40 : isNearest ? 31 : 28;
  const strokeWidth = isSelected ? 3 : 2;
  const glyphSize = palette.glyph.length > 1 ? 10 : 12;

  const pulseRing = isSelected
    ? `<div
        class="discover-ping"
        style="
          position: absolute;
          top: -6px;
          left: -6px;
          width: ${size + 12}px;
          height: ${size + 12}px;
          border-radius: 9999px;
          background: ${palette.fill};
          opacity: 0.35;
        "
      ></div>`
    : "";

  return divIcon({
    className: "",
    html: `
      <div style="position: relative; width: ${size}px; height: ${size + 8}px;">
        ${pulseRing}
        <div
          style="
            position: absolute;
            top: 0;
            left: 0;
            width: ${size}px;
            height: ${size}px;
            border-radius: 9999px;
            background: ${palette.fill};
            border: ${strokeWidth}px solid ${palette.stroke};
            box-shadow: 0 6px 14px rgba(15, 23, 42, 0.24);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: ${glyphSize}px;
            letter-spacing: 0.02em;
            line-height: 1;
          "
        >
          ${palette.glyph}
        </div>
        <div
          style="
            position: absolute;
            left: 50%;
            bottom: 0;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 7px solid transparent;
            border-right: 7px solid transparent;
            border-top: 9px solid ${palette.stroke};
          "
        ></div>
      </div>
    `,
    iconSize: [size + 12, size + 20],
    iconAnchor: [Math.round((size + 12) / 2), size + 14],
    popupAnchor: [0, -(size - 8)],
  });
}

function createCurrentLocationIcon(): DivIcon {
  const size = 30;
  return divIcon({
    className: "",
    html: `
      <div style="position: relative; width: ${size}px; height: ${size}px;">
        <span
          style="
            position: absolute;
            inset: 0;
            border-radius: 9999px;
            background: rgba(59, 130, 246, 0.18);
            border: 2px solid rgba(37, 99, 235, 0.55);
          "
        ></span>
        <span
          style="
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 12px;
            height: 12px;
            border-radius: 9999px;
            background: #2563eb;
            border: 2px solid #ffffff;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.22);
          "
        ></span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [Math.round(size / 2), Math.round(size / 2)],
    popupAnchor: [0, -12],
  });
}

export function DiscoverMapLeaflet({
  view,
  hospitals,
  pharmacies,
  selectedId,
  nearestId,
  userLocation,
  locationAccuracyM,
  radiusKm,
  directionTarget,
  sheetHeightVh = 0,
  onSelect,
  onZoomRadiusChange,
}: Props) {
  const points: Point[] =
    view === "hospitals"
      ? hospitals.map((hospital) => ({
          id: hospital.id,
          name: hospital.name,
          lat: hospital.lat,
          lng: hospital.lng,
          subtitle: hospital.address,
          type: hospital.type,
        }))
      : pharmacies.map((pharmacy) => ({
          id: pharmacy.id,
          name: pharmacy.name,
          lat: pharmacy.lat,
          lng: pharmacy.lng,
          subtitle: pharmacy.neighborhood ?? "Tanger",
          isOnDuty: pharmacy.isOnDuty,
          distanceKm: pharmacy.distanceKm,
        }));

  return (
    <div className="h-full w-full overflow-hidden">
      <MapContainer
        key={view}
        center={[TANGIER_CENTER.lat, TANGIER_CENTER.lng]}
        zoom={12}
        zoomControl={false}
        maxBounds={[
          [35.68, -5.95],
          [35.85, -5.65],
        ]}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap &copy; CARTO"
        />
        <ZoomControl position="bottomright" />
        <FlyToSelection points={points} selectedId={selectedId} sheetHeightVh={sheetHeightVh} />
        <ZoomOnRadius radiusKm={radiusKm} userLocation={userLocation} selectedId={selectedId} />
        <SyncRadiusOnZoom selectedId={selectedId} onZoomRadiusChange={onZoomRadiusChange} />

        {/* Road route — LRM handles OSRM fetching and street-following geometry */}
        <RouteController userLocation={userLocation} destination={directionTarget} />

        {/* Dynamic current location accuracy circle */}
        {locationAccuracyM && Number.isFinite(locationAccuracyM) && locationAccuracyM > 0 && (
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={Math.min(Math.max(locationAccuracyM, 25), 350)}
            pathOptions={{
              color: "#3b82f6",
              fillColor: "#93c5fd",
              fillOpacity: 0.16,
              weight: 1.5,
            }}
          />
        )}

        <Marker
          position={[userLocation.lat, userLocation.lng]}
          icon={createCurrentLocationIcon()}
        >
          <Popup>
            <div style={{ minWidth: "170px", lineHeight: "1.45" }}>
              <div style={{ fontWeight: 700, fontSize: "0.875rem" }}>Votre position en direct</div>
              {locationAccuracyM ? (
                <div style={{ color: "#334155", fontSize: "0.8rem", marginTop: "2px" }}>
                  Précision GPS: ±{Math.round(locationAccuracyM)}m
                </div>
              ) : null}
            </div>
          </Popup>
        </Marker>

        {points.map((point) => {
          const isSelected = point.id === selectedId;
          const isNearest = view === "pharmacies" && point.id === nearestId;
          const typeBadge =
            view === "hospitals"
              ? point.type === "private"
                ? "Clinique"
                : point.type === "chu"
                  ? "CHU"
                  : "Hôpital"
              : point.isOnDuty
                ? "Pharmacie de garde"
                : "Pharmacie";

          return (
            <Marker
              key={point.id}
              position={[point.lat, point.lng]}
              icon={createFacilityIcon({ point, view, isSelected, isNearest })}
              eventHandlers={{
                click: (e) => {
                  e.originalEvent.stopPropagation();
                  onSelect(point.id);
                },
              }}
            >
              <Popup>
                <div style={{ minWidth: "160px", lineHeight: "1.5" }}>
                  <div
                    style={{
                      display: "inline-block",
                      background: "#e2e8f0",
                      color: "#0f172a",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      padding: "1px 6px",
                      borderRadius: "999px",
                      marginBottom: "4px",
                    }}
                  >
                    {typeBadge}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: "4px" }}>
                    {point.name}
                  </div>
                  {point.isOnDuty && (
                    <div style={{
                      display: "inline-block",
                      background: "#fef3c7",
                      color: "#92400e",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      padding: "1px 6px",
                      borderRadius: "4px",
                      marginBottom: "4px",
                    }}>
                      🌙 DE GARDE
                    </div>
                  )}
                  <div style={{ fontSize: "0.8rem", color: "#4b5563" }}>
                    📍 {point.subtitle}
                  </div>
                  {point.distanceKm !== undefined && (
                    <div style={{ fontSize: "0.8rem", color: "#374151", marginTop: "2px", fontWeight: 600 }}>
                      📏 {formatDistance(point.distanceKm)}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
