"use client";

import { useEffect } from "react";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import { TANGIER_CENTER } from "@/features/patient/constants/tangier";
import type { MedicinePharmacyAvailability } from "@/features/patient/types/medicine-search";
import { useI18n } from "@/components/locatomed/i18n-provider";

type UserLocation = { lat: number; lng: number };

type Props = {
  pharmacies: MedicinePharmacyAvailability[];
  selectedPharmacyId: string | null;
  onSelectPharmacy: (pharmacyId: string) => void;
  userLocation?: UserLocation;
  fullscreen?: boolean;
};

function RecenterOnSelected({
  pharmacies,
  selectedPharmacyId,
  userLocation,
}: {
  pharmacies: MedicinePharmacyAvailability[];
  selectedPharmacyId: string | null;
  userLocation?: UserLocation;
}) {
  const map = useMap();

  useEffect(() => {
    if (!selectedPharmacyId) return;
    const selected = pharmacies.find((pharmacy) => pharmacy.pharmacyId === selectedPharmacyId);
    if (!selected) return;

    if (userLocation) {
      map.flyToBounds(
        [
          [userLocation.lat, userLocation.lng],
          [selected.lat, selected.lng],
        ],
        { padding: [60, 60], maxZoom: 15, duration: 1.2 }
      );
    } else {
      map.flyTo([selected.lat, selected.lng], 15, {
        duration: 1.2,
        easeLinearity: 0.25,
        animate: true,
      });
    }
  }, [map, pharmacies, selectedPharmacyId, userLocation]);

  return null;
}

function colorByStock(status: MedicinePharmacyAvailability["stockStatus"]) {
  if (status === "in_stock") return "#0f766e";
  if (status === "low_stock") return "#d97706";
  return "#be123c";
}

export function PharmacyMap({ pharmacies, selectedPharmacyId, onSelectPharmacy, userLocation, fullscreen = false }: Props) {
  const { t } = useI18n();
  const selectedPharmacy = pharmacies.find((p) => p.pharmacyId === selectedPharmacyId);

  return (
    <div className={fullscreen ? "h-full w-full" : "rounded-lg border overflow-hidden"}>
      <MapContainer
        center={[TANGIER_CENTER.lat, TANGIER_CENTER.lng]}
        zoom={12}
        maxBounds={[
          [35.68, -5.95],
          [35.85, -5.65],
        ]}
        style={{ height: fullscreen ? "100%" : "320px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap &copy; CARTO"
        />
        <RecenterOnSelected
          pharmacies={pharmacies}
          selectedPharmacyId={selectedPharmacyId}
          userLocation={userLocation}
        />

        {/* Direction line between user and selected pharmacy */}
        {userLocation && selectedPharmacy && (
          <Polyline
            positions={[
              [userLocation.lat, userLocation.lng],
              [selectedPharmacy.lat, selectedPharmacy.lng],
            ]}
            pathOptions={{ color: "#3b82f6", weight: 3, opacity: 0.7, dashArray: "10, 7" }}
          />
        )}

        {/* User location marker */}
        {userLocation && (
          <CircleMarker
            center={[userLocation.lat, userLocation.lng]}
            radius={9}
            pathOptions={{ color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 1, weight: 3 }}
          >
            <Popup>
              <p className="text-xs font-medium">Votre position</p>
            </Popup>
          </CircleMarker>
        )}

        {pharmacies.map((pharmacy) => (
          <CircleMarker
            key={pharmacy.pharmacyId}
            center={[pharmacy.lat, pharmacy.lng]}
            radius={pharmacy.pharmacyId === selectedPharmacyId ? 10 : 8}
            pathOptions={{
              color: colorByStock(pharmacy.stockStatus),
              fillOpacity: 0.8,
              weight: pharmacy.pharmacyId === selectedPharmacyId ? 3 : 2,
            }}
            eventHandlers={{
              click: () => onSelectPharmacy(pharmacy.pharmacyId),
            }}
          >
            <Popup>
              <div className="text-xs">
                <p className="font-semibold">{pharmacy.pharmacyName}</p>
                <p>{pharmacy.neighborhood ?? "Tanger"}</p>
                <p>{t("patient.medicineSearch.quantity")}: {pharmacy.quantity}</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
