// Trigger rebuild - cleanup duplicate folder
import type { NextConfig } from "next";
import withPWAInit from "next-pwa";
import runtimeCaching from "next-pwa/cache.js";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV !== "production",
  register: true,
  skipWaiting: true,
  runtimeCaching,
});

const isCapacitorStaticExport = process.env.CAPACITOR_STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
  ...(isCapacitorStaticExport
    ? {
        output: "export",
        trailingSlash: true,
        images: {
          unoptimized: true,
        },
      }
    : {}),
};

export default withPWA(nextConfig);
