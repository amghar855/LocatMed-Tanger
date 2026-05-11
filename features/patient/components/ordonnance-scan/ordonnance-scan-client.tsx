"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Camera, CameraOff, FileText, Loader2, Paperclip, ScanLine, Upload } from "lucide-react";
import { TANGIER_CENTER } from "@/features/patient/constants/tangier";
import type { ChatbotResponse } from "@/features/patient/types/chatbot";
import type { MedicinePharmacyAvailability } from "@/features/patient/types/ordonnance-scan";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/components/locatomed/i18n-provider";

type UserLocation = {
  lat: number;
  lng: number;
};

type OcrResult = {
  text: string;
  medicines: string[];
};

function haversineKm(a: UserLocation, b: UserLocation) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const radius = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  const y = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return radius * y;
}

function stockRank(status: MedicinePharmacyAvailability["stockStatus"]) {
  if (status === "in_stock") return 3;
  if (status === "low_stock") return 2;
  return 1;
}

function StockBadge({ status }: { status: MedicinePharmacyAvailability["stockStatus"] }) {
  const { t } = useI18n();

  if (status === "in_stock") {
    return <Badge className="rounded-full bg-teal-50 text-teal-700">{t("patient.medicineSearch.stockIn")}</Badge>;
  }
  if (status === "low_stock") {
    return <Badge className="rounded-full bg-amber-50 text-amber-700">{t("patient.medicineSearch.stockLow")}</Badge>;
  }
  return <Badge className="rounded-full bg-rose-50 text-rose-700">{t("patient.medicineSearch.stockOut")}</Badge>;
}

export function OrdonnanceScanClient() {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [chatbotResponse, setChatbotResponse] = useState<ChatbotResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraPending, setCameraPending] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation>(TANGIER_CENTER);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {},
      { timeout: 3000 }
    );
  }, []);

  useEffect(() => {
    return () => {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    };
  }, []);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedFile) {
      toast.error(t("patient.ordonnance.fileRequired"));
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    startTransition(async () => {
      try {
        setOcrResult(null);
        setChatbotResponse(null);

        // Step 1: Call OCR API
        const ocrRes = await fetch("/api/ocr", {
          method: "POST",
          body: formData,
        });

        if (!ocrRes.ok) {
          toast.error("Échec de l'extraction OCR");
          return;
        }

        const ocrData: OcrResult = await ocrRes.json();
        setOcrResult(ocrData);

        // Step 2: Call Chatbot API if medicines found
        let question = "find medicines: " + ocrData.medicines.join(", ");
        if (ocrData.medicines.length === 0) {
          // If no medicines found, use full text as fallback or a default query
          question = "find pharmacies on duty"; 
          toast.info("Aucun médicament spécifique détecté. Recherche des pharmacies de garde.");
        } else {
          toast.success(t("patient.ordonnance.scanDone"));
        }

        const chatRes = await fetch("/api/chatbot", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question }),
        });

        if (chatRes.ok) {
          const chatData = await chatRes.json();
          setChatbotResponse(chatData);
        } else {
          toast.error("Erreur lors de la recherche de disponibilité");
        }

      } catch (err) {
        console.error("Pipeline error:", err);
        toast.error("Une erreur s'est produite lors du traitement");
      }
    });
  }

  function handleFileSelection(file: File | null) {
    setSelectedFile(file);
    if (file) {
      setCameraOpen(false);
      stopCamera();
    }
  }

  function stopCamera() {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error(t("patient.ordonnance.cameraUnsupported"));
      return;
    }

    try {
      setCameraPending(true);
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOpen(true);
    } catch {
      toast.error(t("patient.ordonnance.cameraAccessError"));
      setCameraOpen(false);
      stopCamera();
    } finally {
      setCameraPending(false);
    }
  }

  function captureFromCamera() {
    const video = videoRef.current;
    if (!video) {
      toast.error(t("patient.ordonnance.cameraUnavailable"));
      return;
    }

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      toast.error(t("patient.ordonnance.captureFailed"));
      return;
    }

    ctx.drawImage(video, 0, 0, width, height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error(t("patient.ordonnance.captureFailed"));
          return;
        }

        const file = new File([blob], `ordonnance-camera-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        setSelectedFile(file);
        toast.success(t("patient.ordonnance.captured"));
      },
      "image/jpeg",
      0.9
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12 xl:gap-6">
      {/* Upload card */}
      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm xl:col-span-4 xl:sticky xl:top-6 xl:self-start">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-base font-semibold text-slate-900">
            {t("patient.ordonnance.scanTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <label
              htmlFor="ordonnance-file-input"
              className="group flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center transition-colors hover:border-teal-300 hover:bg-teal-50/30"
            >
              <div className="flex size-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition-colors group-hover:ring-teal-200">
                <Upload className="size-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">
                  {selectedFile?.name || t("patient.ordonnance.chooseFile")}
                </p>
                <p className="mt-1 text-xs text-slate-400">{t("patient.ordonnance.fileHint")}</p>
              </div>
            </label>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl"
                onClick={startCamera}
                disabled={cameraPending}
              >
                <Camera className="size-4" />
                {cameraPending ? t("patient.ordonnance.opening") : t("patient.ordonnance.openCamera")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="size-4" />
                {t("patient.ordonnance.importFile")}
              </Button>
            </div>

            {cameraOpen ? (
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="relative overflow-hidden rounded-lg bg-black">
                  <video ref={videoRef} className="h-52 w-full object-cover" playsInline muted />
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Button
                    type="button"
                    className="w-full rounded-xl bg-teal-600 text-white hover:bg-teal-700"
                    onClick={captureFromCamera}
                  >
                    <ScanLine className="size-4" />
                    {t("patient.ordonnance.capture")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-xl"
                    onClick={() => {
                      setCameraOpen(false);
                      stopCamera();
                    }}
                  >
                    <CameraOff className="size-4" />
                    {t("patient.ordonnance.closeCamera")}
                  </Button>
                </div>
              </div>
            ) : null}

            <Input
              ref={cameraInputRef}
              id="ordonnance-camera-input"
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => handleFileSelection(e.target.files?.[0] ?? null)}
            />

            <Input
              ref={fileInputRef}
              id="ordonnance-file-input"
              type="file"
              accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
              className="sr-only"
              onChange={(e) => handleFileSelection(e.target.files?.[0] ?? null)}
            />

            <Button
              type="submit"
              disabled={isPending || !selectedFile}
              className="w-full rounded-xl bg-teal-600 text-white hover:bg-teal-700"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  {t("patient.ordonnance.scanning")}
                </span>
              ) : (
                t("patient.ordonnance.scanButton")
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results card */}
      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm xl:col-span-8">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-base font-semibold text-slate-900">
            {t("patient.ordonnance.resultsTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!ocrResult && !isPending ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-12 text-center">
              <FileText className="size-10 text-slate-300" />
              <p className="text-sm text-slate-500">
                {t("patient.ordonnance.uploadPrompt")}
              </p>
            </div>
          ) : isPending ? (
             <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-12 text-center">
              <Loader2 className="size-10 text-teal-600 animate-spin" />
              <p className="text-sm text-slate-500">
                Traitement en cours...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">{t("patient.ordonnance.file")}: {selectedFile?.name}</p>

              {/* Display Extracted Raw Text */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Texte Brut Extrait
                </p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {ocrResult?.text || "Aucun texte trouvé"}
                </p>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <article className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 lg:col-span-2">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Médicaments Détectés
                    </p>
                    {ocrResult?.medicines && ocrResult.medicines.length > 0 ? (
                       <div className="flex flex-wrap gap-2">
                          {ocrResult.medicines.map((med, i) => (
                             <Badge key={i} className="rounded-full bg-teal-50 text-teal-700 hover:bg-teal-100 font-heading text-sm px-3 py-1">
                               {med}
                             </Badge>
                          ))}
                       </div>
                    ) : (
                       <p className="text-sm text-amber-700">Aucun médicament reconnu automatiquement.</p>
                    )}
                </article>

                {chatbotResponse && chatbotResponse.suggestions.length > 0 && (
                   <div className="mt-2 lg:col-span-2 space-y-2 rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold text-slate-700">
                        Pharmacies Suggérées (via Assistant)
                      </p>
                      <p className="text-sm text-slate-600 mb-3">{chatbotResponse.answer}</p>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                         {chatbotResponse.suggestions.filter(s => s.type === "pharmacy").map((s) => (
                           <div
                              key={s.id}
                              className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm"
                           >
                              <p className="font-medium text-slate-900 truncate">
                                {s.title}
                              </p>
                              <p className="text-slate-500 text-xs mt-1">{s.subtitle}</p>
                           </div>
                         ))}
                      </div>
                   </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
